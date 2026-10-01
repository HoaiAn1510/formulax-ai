import { createClient } from "@supabase/supabase-js";
import { vietnamToday, vietnamDateOf, shiftDay, vietnamDayStartISO } from "../utils/vietnamDate";

// Strip BOM (﻿) và whitespace — PowerShell có thể thêm BOM khi set env var qua CLI
const supabaseUrl  = (import.meta.env.VITE_SUPABASE_URL  || "").replace(/^﻿/, "").trim();
const supabaseKey  = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").replace(/^﻿/, "").trim();

export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * supabase-js KHÔNG throw khi database từ chối — nó trả về `{ error }`. Bỏ qua giá trị đó là
 * hỏng hoàn toàn âm thầm: giao diện vẫn báo "Đã lưu" trong khi không có gì được ghi, và
 * `.catch()` ở nơi gọi cũng không bao giờ chạy vì Promise vẫn resolve bình thường.
 *
 * Đây không phải rủi ro lý thuyết: khi bật RLS, toàn bộ thao tác ghi bị từ chối mà app không
 * hề báo gì — mất khá lâu mới lần ra vì console sạch trơn.
 *
 * Mọi hàm ghi trong file này phải đi qua đây. Vừa ghi log (để còn dấu vết kể cả khi nơi gọi
 * quên bắt lỗi) vừa throw (để nơi gọi có thể phản ứng).
 */
function throwIfError(label, error) {
  if (!error) return;
  console.error(`[Supabase] ${label} thất bại:`, error.message, error.code ? `(${error.code})` : "");
  throw new Error(`${label} thất bại: ${error.message}${error.code ? ` (${error.code})` : ""}`);
}

/**
 * Access token của phiên hiện tại (khách hoặc Google), để gửi kèm `Authorization: Bearer` khi
 * gọi backend. Backend tự xác thực token và tự đọc is_anonymous — không gửi userId hay cờ nào
 * do client tự khai.
 */
export async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/** Tải toàn bộ dữ liệu của một user */
export async function loadUserData(googleId) {
  // Ngày giờ Việt Nam: quiz_daily.reset_date lưu theo ngày này; đếm hoạt động "hôm nay" từ 0h VN.
  const today = vietnamToday();
  const todayStart = vietnamDayStartISO(today);

  const [bRes, nRes, sRes, hRes, qRes, todayQRes, todayFRes] = await Promise.all([
    supabase.from("bookmarks").select("formula_id").eq("google_id", googleId),
    supabase.from("user_notes").select("formula_id, note_text").eq("google_id", googleId),
    // Dùng limit(1) + order thay vì maybeSingle() để tránh throw khi có duplicate rows
    supabase.from("learning_stats").select("*").eq("google_id", googleId)
      .order("updated_at", { ascending: false }).limit(1),
    supabase.from("search_history").select("query").eq("google_id", googleId)
      .order("searched_at", { ascending: false }).limit(20),
    supabase.from("quiz_daily").select("*").eq("google_id", googleId).limit(1),
    supabase.from("quiz_results").select("*", { count: "exact", head: true })
      .eq("google_id", googleId).gte("created_at", todayStart),
    supabase.from("flashcard_activity").select("*", { count: "exact", head: true })
      .eq("google_id", googleId).gte("created_at", todayStart).neq("formula_id", "sys_streak"),
  ]);

  // Bookmarks → mảng id
  const bookmarkedIds = bRes.data?.map((b) => b.formula_id) ?? [];

  // Notes → object { formulaId: noteText }
  const userNotes = {};
  nRes.data?.forEach((n) => { userNotes[n.formula_id] = n.note_text; });

  // Stats từ Supabase (lấy row mới nhất)
  const statsRow = sRes.data?.[0];
  const statsFromDB = statsRow
    ? { formulasViewed: statsRow.formulas_viewed, flashcardsStudied: statsRow.flashcards_studied, quizzesCompleted: statsRow.quizzes_completed }
    : { formulasViewed: 0, flashcardsStudied: 0, quizzesCompleted: 0 };
  const displayNameFromDB = statsRow?.display_name || "";

  // Merge với localStorage backup — luôn lấy giá trị cao nhất (stats chỉ tăng, không bao giờ giảm)
  const localRaw = localStorage.getItem(`formulax_stats_${googleId}`);
  const statsFromLocal = localRaw ? JSON.parse(localRaw) : null;
  const stats = {
    formulasViewed:    Math.max(statsFromDB.formulasViewed    ?? 0, statsFromLocal?.formulasViewed    ?? 0),
    flashcardsStudied: Math.max(statsFromDB.flashcardsStudied ?? 0, statsFromLocal?.flashcardsStudied ?? 0),
    quizzesCompleted:  Math.max(statsFromDB.quizzesCompleted  ?? 0, statsFromLocal?.quizzesCompleted  ?? 0),
  };

  if (sRes.error) console.error("[Supabase] learning_stats load error:", sRes.error);

  // Search history
  const searchHistory = hRes.data?.map((h) => h.query) ?? [];

  // Quiz daily — reset nếu ngày khác (lấy row mới nhất)
  const qRow = qRes.data?.[0];
  let remainingQuizzes = 10;
  if (qRow) {
    remainingQuizzes = qRow.reset_date === today ? qRow.remaining_count : 10;
  }

  return {
    bookmarkedIds, userNotes, stats, searchHistory, remainingQuizzes,
    displayName: displayNameFromDB,
    // Cài đặt/trạng thái theo tài khoản (migration 008). null/{} = tài khoản chưa lưu lần nào,
    // App.jsx khi đó đẩy giá trị đang có ở máy lên.
    preferences: statsRow?.preferences ?? null,
    viewedFormulaIds: statsRow?.viewed_formula_ids ?? null,
    dailyChallenge: statsRow?.daily_challenge ?? null,
    todayQuizCount: todayQRes.count ?? 0,
    todayFlashcardCount: todayFRes.count ?? 0,
  };
}

// ─── Premium status ─────────────────────────────────────────────────────────

/** Đọc trạng thái Premium mới nhất từ Supabase (do backend ghi sau khi MoMo xác nhận thanh toán) */
export async function checkPremiumStatus(googleId) {
  if (!googleId) return { isPremium: false, premiumExpiry: null };
  const { data, error } = await supabase
    .from("users")
    .select("is_premium, premium_expiry")
    .eq("google_id", googleId)
    .single();
  if (error || !data) return { isPremium: false, premiumExpiry: null };
  const expired = data.premium_expiry && new Date(data.premium_expiry) < new Date();
  return { isPremium: Boolean(data.is_premium) && !expired, premiumExpiry: data.premium_expiry };
}

// ─── Bookmark ───────────────────────────────────────────────────────────────

// supabase-js KHÔNG throw khi database từ chối — nó trả về { error }. Bỏ qua giá trị này là
// hỏng âm thầm: giao diện báo "Đã thêm vào Bookmark" trong khi không có gì được ghi, và
// .catch() ở phía gọi cũng không bao giờ chạy. Luôn kiểm tra error rồi throw.
export async function addBookmark(googleId, formulaId) {
  const { error } = await supabase
    .from("bookmarks")
    .upsert({ google_id: googleId, formula_id: formulaId });
  throwIfError("Lưu bookmark", error);
}

export async function removeBookmark(googleId, formulaId) {
  const { error } = await supabase.from("bookmarks").delete()
    .eq("google_id", googleId).eq("formula_id", formulaId);
  throwIfError("Xoá bookmark", error);
}

// ─── Notes ──────────────────────────────────────────────────────────────────

export async function saveNote(googleId, formulaId, noteText) {
  const { error } = await supabase.from("user_notes").upsert(
    { google_id: googleId, formula_id: formulaId, note_text: noteText, updated_at: new Date().toISOString() },
    { onConflict: "google_id,formula_id" }
  );
  throwIfError("Lưu ghi chú", error);
}

// ─── Stats ──────────────────────────────────────────────────────────────────

export async function saveStats(googleId, stats, displayName) {
  const payload = { google_id: googleId, formulas_viewed: stats.formulasViewed, flashcards_studied: stats.flashcardsStudied, quizzes_completed: stats.quizzesCompleted, updated_at: new Date().toISOString() };
  if (displayName !== undefined) payload.display_name = displayName;
  const { error } = await supabase.from("learning_stats").upsert(payload, { onConflict: "google_id" });
  throwIfError("Lưu thống kê học tập", error);
}

export async function saveDisplayName(googleId, displayName) {
  const { error } = await supabase.from("learning_stats").upsert(
    { google_id: googleId, display_name: displayName, updated_at: new Date().toISOString() },
    { onConflict: "google_id" }
  );
  throwIfError("Lưu tên hiển thị", error);
}

// ─── Cài đặt & trạng thái đồng bộ theo tài khoản (migration 008) ─────────────
// Cùng dòng learning_stats với stats/display_name. Upsert chỉ ghi đúng cột có trong payload nên
// không đè số liệu học tập.

/** Ghi toàn bộ object cài đặt { darkMode, grade, notifPrefs, onboarded } */
export async function savePreferences(googleId, preferences) {
  const { error } = await supabase.from("learning_stats").upsert(
    { google_id: googleId, preferences, updated_at: new Date().toISOString() },
    { onConflict: "google_id" }
  );
  throwIfError("Lưu cài đặt", error);
}

/** Đọc riêng cài đặt — dùng khi app được mở lại (máy khác có thể vừa đổi). */
export async function loadPreferences(googleId) {
  const { data, error } = await supabase.from("learning_stats").select("preferences")
    .eq("google_id", googleId).order("updated_at", { ascending: false }).limit(1);
  if (error) { console.error("[Supabase] loadPreferences:", error); return null; }
  return data?.[0]?.preferences ?? null;
}

export async function saveViewedFormulaIds(googleId, ids) {
  const { error } = await supabase.from("learning_stats").upsert(
    { google_id: googleId, viewed_formula_ids: ids, updated_at: new Date().toISOString() },
    { onConflict: "google_id" }
  );
  throwIfError("Lưu công thức đã xem", error);
}

export async function saveDailyChallenge(googleId, dailyChallenge) {
  const { error } = await supabase.from("learning_stats").upsert(
    { google_id: googleId, daily_challenge: dailyChallenge, updated_at: new Date().toISOString() },
    { onConflict: "google_id" }
  );
  throwIfError("Lưu thử thách hôm nay", error);
}

export async function resetStats(googleId) {
  const { error } = await supabase.from("learning_stats").upsert(
    { google_id: googleId, formulas_viewed: 0, flashcards_studied: 0, quizzes_completed: 0, updated_at: new Date().toISOString() },
    { onConflict: "google_id" }
  );
  throwIfError("Đặt lại thống kê", error);
}

// ─── Search history ──────────────────────────────────────────────────────────

export async function addSearchHistoryEntry(googleId, query) {
  const { error } = await supabase.from("search_history").insert({ google_id: googleId, query });
  throwIfError("Lưu lịch sử tìm kiếm", error);
}

// ─── Quiz daily ──────────────────────────────────────────────────────────────

export async function saveQuizDaily(googleId, remaining) {
  const today = vietnamToday();
  const { error } = await supabase.from("quiz_daily").upsert(
    { google_id: googleId, remaining_count: remaining, reset_date: today },
    { onConflict: "google_id" }
  );
  throwIfError("Lưu lượt quiz trong ngày", error);
}

// ─── Chat Sessions ────────────────────────────────────────────────────────────

export async function loadChatSessions(googleId) {
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("google_id", googleId)
    .order("updated_at", { ascending: false });
  if (error) { console.error("[Supabase] loadChatSessions:", error); return null; }
  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    messages: row.messages || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function upsertChatSession(googleId, session) {
  const { error } = await supabase.from("chat_sessions").upsert({
    id: session.id,
    google_id: googleId,
    name: session.name,
    messages: session.messages,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  throwIfError("Lưu cuộc trò chuyện", error);
}

export async function deleteChatSession(googleId, sessionId) {
  const { error } = await supabase.from("chat_sessions").delete()
    .eq("google_id", googleId).eq("id", sessionId);
  throwIfError("Xoá cuộc trò chuyện", error);
}

// ─── Flashcard Decks ─────────────────────────────────────────────────────────

export async function loadFlashcardDecks(googleId) {
  const { data, error } = await supabase
    .from("flashcard_decks")
    .select("*")
    .eq("google_id", googleId)
    .order("created_at", { ascending: true });
  if (error) { console.error("[Supabase] loadFlashcardDecks:", error); return null; }
  return (data || []).map(row => ({
    id: row.id,
    type: row.type,
    name: row.name,
    topic: row.topic,
    grade: row.grade,
    formulaIds: row.formula_ids || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function upsertFlashcardDeck(googleId, deck) {
  const { error } = await supabase.from("flashcard_decks").upsert({
    id: deck.id,
    google_id: googleId,
    name: deck.name,
    type: deck.type,
    formula_ids: deck.formulaIds,
    topic: deck.topic || null,
    grade: deck.grade || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  throwIfError("Lưu bộ thẻ", error);
}

export async function deleteFlashcardDeck(googleId, deckId) {
  const { error } = await supabase.from("flashcard_decks").delete()
    .eq("google_id", googleId).eq("id", deckId);
  throwIfError("Xoá bộ thẻ", error);
}

// ─── Flashcard Spaced Repetition Progress ─────────────────────────────────────

export async function loadFlashcardProgress(googleId) {
  const { data, error } = await supabase
    .from("flashcard_progress")
    .select("*")
    .eq("google_id", googleId);
  if (error) { console.error("[Supabase] loadFlashcardProgress:", error); return {}; }
  const map = {};
  (data || []).forEach(row => {
    map[row.formula_id] = {
      repetitions: row.repetitions,
      intervalDays: Number(row.interval_days),
      easeFactor: Number(row.ease_factor),
      nextReviewAt: row.next_review_at,
      lastReviewedAt: row.last_reviewed_at,
    };
  });
  return map;
}

export async function upsertFlashcardProgress(googleId, formulaId, progress) {
  if (!googleId) return;
  const { error } = await supabase.from("flashcard_progress").upsert({
    google_id: googleId,
    formula_id: formulaId,
    repetitions: progress.repetitions,
    interval_days: progress.intervalDays,
    ease_factor: progress.easeFactor,
    next_review_at: progress.nextReviewAt,
    last_reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "google_id,formula_id" });
  throwIfError("Lưu tiến độ ôn thẻ", error);
}

// ─── Quiz Results ─────────────────────────────────────────────────────────────

export async function saveQuizResult(googleId, { topic, questionsTotal, questionsCorrect }) {
  if (!googleId) return;
  const scorePercent = questionsTotal > 0 ? Math.round((questionsCorrect / questionsTotal) * 100) : 0;
  const savedTopic = topic === "Tất cả chủ đề" ? "Tổng hợp" : topic;
  const { error } = await supabase.from("quiz_results").insert({
    google_id: googleId,
    topic: savedTopic,
    score_percent: scorePercent,
    questions_total: questionsTotal,
    questions_correct: questionsCorrect,
  });
  throwIfError("Lưu kết quả quiz", error);
}

// ─── Flashcard Activity ───────────────────────────────────────────────────────

export async function saveFlashcardActivity(googleId, { formulaId, result, topic, grade }) {
  if (!googleId) return;
  const { error } = await supabase.from("flashcard_activity").insert({
    google_id: googleId,
    formula_id: formulaId,
    result,
    topic: topic || null,
    grade: grade ? Number(grade) : null,
  });
  throwIfError("Lưu hoạt động flashcard", error);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getTopicPerformance(googleId) {
  const { data, error } = await supabase
    .from("quiz_results")
    .select("topic, questions_total, questions_correct")
    .eq("google_id", googleId);
  if (error) { console.error("[Supabase] getTopicPerformance:", error); return []; }

  const map = {};
  (data || []).forEach(({ topic, questions_total, questions_correct }) => {
    if (!map[topic]) map[topic] = { total: 0, correct: 0 };
    map[topic].total += questions_total;
    map[topic].correct += questions_correct;
  });

  return Object.entries(map)
    .map(([topic, { total, correct }]) => ({
      topic,
      total,
      correct,
      rate: total > 0 ? Math.round((correct / total) * 100) : 0,
    }))
    .sort((a, b) => a.rate - b.rate);
}

export async function getActivityData(googleId) {
  const [qRes, fRes] = await Promise.all([
    supabase.from("quiz_results").select("created_at").eq("google_id", googleId),
    supabase.from("flashcard_activity").select("created_at").eq("google_id", googleId),
  ]);

  // Mỗi hoạt động xếp vào NGÀY GIỜ VIỆT NAM của nó (trước đây là ngày UTC: học lúc 0h–7h bị tính
  // vào hôm trước). Chuyển đổi 2026-09-30: không bản ghi nào nằm trong khung 0h–7h và không ai đang
  // có chuỗi, nên không chuỗi hiện có nào bị đổi.
  const dateSet = new Set();
  [...(qRes.data || []), ...(fRes.data || [])].forEach(row => {
    dateSet.add(vietnamDateOf(row.created_at));
  });

  const sorted = [...dateSet].sort().reverse();

  let streak = 0;
  if (sorted.length > 0) {
    const today = vietnamToday();
    const yesterday = shiftDay(today, -1);
    if (sorted[0] === today || sorted[0] === yesterday) {
      streak = 1;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === shiftDay(sorted[i - 1], -1)) streak++;
        else break;
      }
    }
  }

  return { streak, activityDates: [...dateSet] };
}

export async function deleteUserAnalytics(googleId) {
  if (!googleId) return;
  const { streak } = await getActivityData(googleId);

  const [delQuiz, delActivity] = await Promise.all([
    supabase.from("quiz_results").delete().eq("google_id", googleId),
    supabase.from("flashcard_activity").delete().eq("google_id", googleId),
  ]);
  throwIfError("Xoá kết quả quiz", delQuiz.error);
  throwIfError("Xoá hoạt động flashcard", delActivity.error);

  if (streak > 0) {
    const records = [];
    const today = vietnamToday();
    for (let i = 0; i < streak; i++) {
      records.push({
        google_id: googleId,
        formula_id: "sys_streak",
        result: "correct",
        topic: null,
        grade: null,
        // 12h trưa giờ Việt Nam của từng ngày trong chuỗi — giữa ngày nên không lệch sang ngày khác.
        created_at: new Date(`${shiftDay(today, -i)}T12:00:00+07:00`).toISOString(),
      });
    }
    const { error } = await supabase.from("flashcard_activity").insert(records);
    throwIfError("Ghi lại chuỗi ngày học", error);
  }
}

export async function getAnalyticsSummary(googleId) {
  const [topicPerformance, { streak, activityDates }] = await Promise.all([
    getTopicPerformance(googleId),
    getActivityData(googleId),
  ]);
  return { topicPerformance, streak, activityDates };
}

export async function getDailyHistory(googleId) {
  const [qRes, fRes] = await Promise.all([
    supabase.from("quiz_results")
      .select("topic, score_percent, questions_total, questions_correct, created_at")
      .eq("google_id", googleId)
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("flashcard_activity")
      .select("formula_id, created_at")
      .eq("google_id", googleId)
      .neq("formula_id", "sys_streak")
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const days = {};

  (qRes.data || []).forEach(row => {
    const date = vietnamDateOf(row.created_at);
    if (!days[date]) days[date] = { quizzes: [], flashcardIds: [] };
    days[date].quizzes.push({
      topic: row.topic,
      scorePercent: row.score_percent,
      questionsTotal: row.questions_total,
      questionsCorrect: row.questions_correct,
    });
  });

  (fRes.data || []).forEach(row => {
    const date = vietnamDateOf(row.created_at);
    if (!days[date]) days[date] = { quizzes: [], flashcardIds: [] };
    if (!days[date].flashcardIds.includes(row.formula_id)) {
      days[date].flashcardIds.push(row.formula_id);
    }
  });

  return Object.entries(days)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Notifications ──────────────────────────────────────────────────────────
// Thông báo thật, tính từ dữ liệu học tập đã có (streak, chủ đề yếu, mốc thành tích) —
// không phải dữ liệu admin gửi. Sinh ra 1 lần mỗi khi app tải xong dữ liệu người dùng,
// chặn trùng qua dedupe_key (unique theo google_id + dedupe_key).

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

function formatRelativeTime(isoString) {
  const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export async function checkAndGenerateNotifications(googleId, notifPrefs = {}) {
  if (!googleId) return;
  const today = vietnamToday(); // cùng kiểu ngày với activityDates (giờ Việt Nam)

  const [{ topicPerformance, streak, activityDates }, existingRes, quizCountRes] = await Promise.all([
    getAnalyticsSummary(googleId),
    supabase.from("notifications").select("dedupe_key").eq("google_id", googleId).gte("created_at", vietnamDayStartISO(today)),
    supabase.from("quiz_results").select("*", { count: "exact", head: true }).eq("google_id", googleId),
  ]);

  const existingKeys = new Set((existingRes.data || []).map(r => r.dedupe_key));
  const toInsert = [];

  // 1. Nhắc giữ chuỗi học — còn chuỗi sống nhưng hôm nay chưa học
  if (notifPrefs.streak !== false && streak > 0 && !activityDates.includes(today)) {
    const key = `streak_${today}`;
    if (!existingKeys.has(key)) {
      toInsert.push({ google_id: googleId, category: "streak", dedupe_key: key,
        message: `Đừng để mất chuỗi ${streak} ngày! Học hoặc ôn 1 thẻ hôm nay để giữ chuỗi.` });
    }
  }

  // 2. Gợi ý ôn chủ đề yếu nhất (loại "Đề thi THPT" giống trang Tiến độ học tập)
  if (notifPrefs.weakTopic !== false) {
    const weakest = topicPerformance.find(t => t.topic !== "Đề thi THPT" && t.rate < 60);
    if (weakest) {
      const key = `weak_topic_${weakest.topic}_${today}`;
      if (!existingKeys.has(key)) {
        toInsert.push({ google_id: googleId, category: "weakTopic", dedupe_key: key,
          message: `Chủ đề ${weakest.topic} đang yếu (${weakest.rate}% đúng) — ôn lại ngay?` });
      }
    }
  }

  // 3. Chào mừng / mốc thành tích — mốc streak hoặc quiz đầu tiên
  if (notifPrefs.milestone !== false) {
    if (STREAK_MILESTONES.includes(streak)) {
      const key = `milestone_streak_${streak}_${today}`;
      if (!existingKeys.has(key)) {
        toInsert.push({ google_id: googleId, category: "milestone", dedupe_key: key,
          message: `Chúc mừng! Bạn đã duy trì chuỗi học ${streak} ngày liên tiếp 🎉` });
      }
    }
    if ((quizCountRes.count || 0) === 1) {
      const key = "milestone_first_quiz";
      if (!existingKeys.has(key)) {
        toInsert.push({ google_id: googleId, category: "milestone", dedupe_key: key,
          message: "Chúc mừng bạn đã hoàn thành bài quiz đầu tiên trên FormulaX! 🎉" });
      }
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("notifications").insert(toInsert);
    if (error) console.error("[Supabase] checkAndGenerateNotifications:", error);
  }
}

export async function getNotifications(googleId, limit = 20) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("google_id", googleId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) { console.error("[Supabase] getNotifications:", error); return []; }
  return data.map(n => ({
    id: n.id,
    category: n.category,
    text: n.message,
    unread: !n.read,
    time: formatRelativeTime(n.created_at),
  }));
}

export async function markAllNotificationsRead(googleId) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("google_id", googleId).eq("read", false);
  if (error) console.error("[Supabase] markAllNotificationsRead:", error);
}

// ─── Gợi ý công thức (Dashboard) ────────────────────────────────────────────
// Dữ liệu để tính "Gợi ý hôm nay": chủ đề đang yếu (giống trang Tiến độ học tập)
// và chủ đề vừa học gần đây nhất (quiz hoặc flashcard, lấy theo timestamp mới nhất).

export async function getRecommendationContext(googleId) {
  const [topicPerf, recentQuizRes, recentFlashRes] = await Promise.all([
    getTopicPerformance(googleId),
    supabase.from("quiz_results").select("topic, created_at").eq("google_id", googleId)
      .order("created_at", { ascending: false }).limit(1),
    supabase.from("flashcard_activity").select("topic, created_at").eq("google_id", googleId)
      .neq("formula_id", "sys_streak").order("created_at", { ascending: false }).limit(1),
  ]);

  const weakTopics = topicPerf.filter(t => t.topic !== "Đề thi THPT" && t.rate < 60).map(t => t.topic);

  const recentCandidates = [...(recentQuizRes.data || []), ...(recentFlashRes.data || [])]
    .filter(r => r.topic)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return { weakTopics, recentTopic: recentCandidates[0]?.topic || null };
}
