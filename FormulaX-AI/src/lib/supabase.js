import { createClient } from "@supabase/supabase-js";

// Strip BOM (﻿) và whitespace — PowerShell có thể thêm BOM khi set env var qua CLI
const supabaseUrl  = (import.meta.env.VITE_SUPABASE_URL  || "").replace(/^﻿/, "").trim();
const supabaseKey  = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").replace(/^﻿/, "").trim();

export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Tải toàn bộ dữ liệu của một user */
export async function loadUserData(googleId) {
  const today = new Date().toISOString().slice(0, 10);

  const [bRes, nRes, sRes, hRes, qRes] = await Promise.all([
    supabase.from("bookmarks").select("formula_id").eq("google_id", googleId),
    supabase.from("user_notes").select("formula_id, note_text").eq("google_id", googleId),
    // Dùng limit(1) + order thay vì maybeSingle() để tránh throw khi có duplicate rows
    supabase.from("learning_stats").select("*").eq("google_id", googleId)
      .order("updated_at", { ascending: false }).limit(1),
    supabase.from("search_history").select("query").eq("google_id", googleId)
      .order("searched_at", { ascending: false }).limit(20),
    supabase.from("quiz_daily").select("*").eq("google_id", googleId).limit(1),
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

  return { bookmarkedIds, userNotes, stats, searchHistory, remainingQuizzes, displayName: displayNameFromDB };
}

// ─── Bookmark ───────────────────────────────────────────────────────────────

export async function addBookmark(googleId, formulaId) {
  await supabase.from("bookmarks").upsert({ google_id: googleId, formula_id: formulaId });
}

export async function removeBookmark(googleId, formulaId) {
  await supabase.from("bookmarks").delete()
    .eq("google_id", googleId).eq("formula_id", formulaId);
}

// ─── Notes ──────────────────────────────────────────────────────────────────

export async function saveNote(googleId, formulaId, noteText) {
  await supabase.from("user_notes").upsert(
    { google_id: googleId, formula_id: formulaId, note_text: noteText, updated_at: new Date().toISOString() },
    { onConflict: "google_id,formula_id" }
  );
}

// ─── Stats ──────────────────────────────────────────────────────────────────

export async function saveStats(googleId, stats, displayName) {
  const payload = { google_id: googleId, formulas_viewed: stats.formulasViewed, flashcards_studied: stats.flashcardsStudied, quizzes_completed: stats.quizzesCompleted, updated_at: new Date().toISOString() };
  if (displayName !== undefined) payload.display_name = displayName;
  const { error } = await supabase.from("learning_stats").upsert(payload, { onConflict: "google_id" });
  if (error) console.error("[Supabase] saveStats error:", error);
}

export async function saveDisplayName(googleId, displayName) {
  await supabase.from("learning_stats").upsert(
    { google_id: googleId, display_name: displayName, updated_at: new Date().toISOString() },
    { onConflict: "google_id" }
  );
}

export async function resetStats(googleId) {
  await supabase.from("learning_stats").upsert(
    { google_id: googleId, formulas_viewed: 0, flashcards_studied: 0, quizzes_completed: 0, updated_at: new Date().toISOString() },
    { onConflict: "google_id" }
  );
}

// ─── Search history ──────────────────────────────────────────────────────────

export async function addSearchHistoryEntry(googleId, query) {
  await supabase.from("search_history").insert({ google_id: googleId, query });
}

// ─── Quiz daily ──────────────────────────────────────────────────────────────

export async function saveQuizDaily(googleId, remaining) {
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("quiz_daily").upsert(
    { google_id: googleId, remaining_count: remaining, reset_date: today },
    { onConflict: "google_id" }
  );
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
  if (error) console.error("[Supabase] upsertChatSession:", error);
}

export async function deleteChatSession(googleId, sessionId) {
  const { error } = await supabase.from("chat_sessions").delete()
    .eq("google_id", googleId).eq("id", sessionId);
  if (error) console.error("[Supabase] deleteChatSession:", error);
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
  if (error) console.error("[Supabase] upsertFlashcardDeck:", error);
}

export async function deleteFlashcardDeck(googleId, deckId) {
  const { error } = await supabase.from("flashcard_decks").delete()
    .eq("google_id", googleId).eq("id", deckId);
  if (error) console.error("[Supabase] deleteFlashcardDeck:", error);
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
  if (error) console.error("[Supabase] saveQuizResult:", error);
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
  if (error) console.error("[Supabase] saveFlashcardActivity:", error);
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

export async function getActivityStreak(googleId) {
  const [qRes, fRes] = await Promise.all([
    supabase.from("quiz_results").select("created_at").eq("google_id", googleId),
    supabase.from("flashcard_activity").select("created_at").eq("google_id", googleId),
  ]);

  const dateSet = new Set();
  [...(qRes.data || []), ...(fRes.data || [])].forEach(row => {
    dateSet.add(new Date(row.created_at).toISOString().slice(0, 10));
  });

  const sorted = [...dateSet].sort().reverse();
  if (sorted.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    prev.setDate(prev.getDate() - 1);
    if (sorted[i] === prev.toISOString().slice(0, 10)) streak++;
    else break;
  }
  return streak;
}

export async function getAnalyticsSummary(googleId) {
  const [topicPerformance, streak] = await Promise.all([
    getTopicPerformance(googleId),
    getActivityStreak(googleId),
  ]);
  return { topicPerformance, streak };
}
