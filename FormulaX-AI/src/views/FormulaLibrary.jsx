import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, Heart, HelpCircle, XCircle, BookOpen, Layers, Lock } from "lucide-react";
import { normalizeVi } from "../utils/textSearch";
import { useGuestGate } from "../utils/useGuestGate";
import PageShell from "../components/PageShell";
import FilterPicker from "../components/FilterPicker";
import { CARD, LABEL, CHIP, CHIP_OFF, CHIP_ON } from "../utils/shellStyle";

// Ô biểu tượng của từng chủ đề (mockup Thư viện): ký hiệu toán + màu nhạt. Chủ đề lấy đúng enum của formulas.js.
const TOPIC_STYLE = {
  "Đại số": { glyph: "x²", tone: "bg-[#DBEAFE] text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-[#93C5FD]" },
  "Hình học": { glyph: "△", tone: "bg-[#DCFCE7] text-[#059669] dark:bg-[#059669]/20 dark:text-[#6EE7B7]" },
  "Giải tích": { glyph: "f′", tone: "bg-[#FFE4E6] text-[#E11D48] dark:bg-[#E11D48]/20 dark:text-[#FDA4AF]" },
  "Lượng giác": { glyph: "sin", tone: "bg-[#EDE9FE] text-[#7C3AED] dark:bg-[#7C3AED]/20 dark:text-[#C4B5FD]" },
  "Xác suất & Thống kê": { glyph: "P(A)", tone: "bg-[#FFEDD5] text-[#EA580C] dark:bg-[#EA580C]/20 dark:text-[#FDBA74]" },
  "Mở rộng": { glyph: "∑", tone: "bg-[#F1F5F9] text-[#475569] dark:bg-[#475569]/30 dark:text-[#CBD5E1]" },
};
const TOPIC_TEXT = {
  "Đại số": "text-[#2563EB] dark:text-[#93C5FD]", "Hình học": "text-[#059669] dark:text-[#6EE7B7]",
  "Giải tích": "text-[#E11D48] dark:text-[#FDA4AF]", "Lượng giác": "text-[#7C3AED] dark:text-[#C4B5FD]",
  "Xác suất & Thống kê": "text-[#EA580C] dark:text-[#FDBA74]", "Mở rộng": "text-[#475569] dark:text-[#CBD5E1]",
};

export default function FormulaLibrary({
  formulas,
  bookmarkedIds,
  onToggleBookmark,
  onCreateFlashcard,
  onViewDetail,
  setActiveTab
}) {
  // Tra cứu mở cho khách; chỉ Yêu thích + Tạo Flashcard (dữ liệu theo người dùng) bị khóa.
  // Bấm tim / Tạo Flashcard đi qua handler ở App.jsx vốn đã chặn khách, ở đây chỉ đổi biểu tượng.
  const { isGuest, requireGoogle } = useGuestGate();

  // Precompute bản không dấu 1 lần cho mỗi công thức thay vì normalize lại toàn bộ danh sách mỗi lần gõ phím
  const searchIndex = useMemo(() => formulas.map(f => ({
    formula: f,
    name: normalizeVi(f.name),
    topic: normalizeVi(f.topic),
    explanation: normalizeVi(f.explanation),
    tags: f.tags.map(normalizeVi),
  })), [formulas]);

  const [searchQuery, setSearchQuery] = useState("");
  // topicMode: "all" | "saved" | "custom" (custom uses selectedTopics array, multi-select)
  const [topicMode, setTopicMode] = useState("all");
  const [selectedTopics, setSelectedTopics] = useState([]);
  // gradeMode: "all" | "custom" (custom uses selectedGrades array, multi-select)
  const [gradeMode, setGradeMode] = useState("all");
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const searchContainerRef = useRef(null);

  const topics = ["Tất cả", "Yêu thích", "Đại số", "Hình học", "Giải tích", "Lượng giác", "Xác suất & Thống kê", "Mở rộng"];

  const handleTopicClick = (topic) => {
    if (topic === "Tất cả") {
      setTopicMode("all");
      setSelectedTopics([]);
      return;
    }
    if (topic === "Yêu thích") {
      if (!requireGoogle()) return;
      setTopicMode("saved");
      setSelectedTopics([]);
      return;
    }
    if (topicMode !== "custom") {
      setTopicMode("custom");
      setSelectedTopics([topic]);
      return;
    }
    const next = selectedTopics.includes(topic)
      ? selectedTopics.filter(t => t !== topic)
      : [...selectedTopics, topic];
    if (next.length === 0) {
      setTopicMode("all");
      setSelectedTopics([]);
    } else {
      setSelectedTopics(next);
    }
  };

  const handleGradeClick = (grade) => {
    if (grade === "Tất cả") {
      setGradeMode("all");
      setSelectedGrades([]);
      return;
    }
    if (gradeMode !== "custom") {
      setGradeMode("custom");
      setSelectedGrades([grade]);
      return;
    }
    const next = selectedGrades.includes(grade)
      ? selectedGrades.filter(g => g !== grade)
      : [...selectedGrades, grade];
    if (next.length === 0) {
      setGradeMode("all");
      setSelectedGrades([]);
    } else {
      setSelectedGrades(next);
    }
  };

  // Click outside listener for suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length > 0) {
      const query = normalizeVi(value);
      const filtered = searchIndex.filter(entry =>
        entry.name.includes(query) ||
        entry.topic.includes(query) ||
        entry.tags.some(tag => tag.includes(query))
      ).slice(0, 5).map(entry => entry.formula);

      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (formulaName) => {
    setSearchQuery(formulaName);
    setShowSuggestions(false);
  };

  // Filter formulas
  const normalizedQuery = normalizeVi(searchQuery);
  const filteredFormulas = searchIndex.filter(entry => {
    const f = entry.formula;
    const matchesTopic = topicMode === "all"
      ? true
      : topicMode === "saved"
        ? bookmarkedIds.includes(f.id)
        : selectedTopics.includes(f.topic);
    const matchesGrade = gradeMode === "all" || selectedGrades.includes(f.grade.toString());
    const matchesSearch = searchQuery.trim() === "" ||
      entry.name.includes(normalizedQuery) ||
      entry.explanation.includes(normalizedQuery) ||
      entry.tags.some(tag => tag.includes(normalizedQuery));

    return matchesTopic && matchesGrade && matchesSearch;
  }).map(entry => entry.formula).sort((a, b) => {
    const aBookmarked = bookmarkedIds.includes(a.id);
    const bBookmarked = bookmarkedIds.includes(b.id);
    if (aBookmarked && !bBookmarked) return -1;
    if (!aBookmarked && bBookmarked) return 1;
    return 0;
  });

  const searchBox = (
    <div className="relative w-full md:w-[420px]" ref={searchContainerRef}>
      <div className="relative flex items-center w-full h-[46px] px-4 rounded-[14px] bg-white dark:bg-[#1E293B] border border-line dark:border-[#334155] focus-within:border-accent transition-colors">
        <Search size={18} className="text-text-muted dark:text-[#94A3B8] mr-2.5 shrink-0" />
        <input
          type="text"
          aria-label="Tìm công thức"
          className="flex-1 min-w-0 border-none outline-none bg-transparent text-[0.92rem] text-primary dark:text-[#E2E8F0] placeholder:text-text-muted dark:placeholder:text-[#94A3B8]"
          placeholder="Tìm công thức, ví dụ: đạo hàm, cos..."
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => searchQuery.trim() !== "" && setShowSuggestions(true)}
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Xoá từ khoá"
            onClick={() => { setSearchQuery(""); setShowSuggestions(false); }}
            className="ml-2 bg-transparent border-none text-text-muted cursor-pointer flex items-center p-0"
          >
            <XCircle size={16} />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#1E293B] rounded-[14px] border border-line dark:border-[#334155] shadow-[0_12px_28px_-12px_rgba(15,23,42,0.2)] z-20 max-h-[280px] overflow-y-auto">
          {suggestions.map((item) => (
            <button
              type="button"
              key={item.id}
              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left bg-transparent border-none border-b border-[#F1F5F9] dark:border-[#334155] last:border-b-0 cursor-pointer hover:bg-page dark:hover:bg-white/5"
              onClick={() => selectSuggestion(item.name)}
            >
              <span className="text-[0.85rem] font-semibold text-primary dark:text-[#E2E8F0] truncate">{item.name}</span>
              <span className="text-[0.7rem] text-text-muted dark:text-[#94A3B8] shrink-0 whitespace-nowrap">{item.topic} · Lớp {item.grade}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const savedActive = topicMode === "saved";

  return (
    <PageShell
      title="Thư viện công thức"
      description={savedActive
        ? `${filteredFormulas.length} công thức yêu thích`
        : `${formulas.length} công thức Toán THPT, sắp xếp theo chủ đề. Đang hiện ${filteredFormulas.length}.`}
      onBack={() => setActiveTab("dashboard")}
      actions={searchBox}
    >
      {/* Điện thoại: hai ô chọn (Lớp, Chủ đề) mở danh sách khi bấm + nút Yêu thích — thay cho các hàng chip
          trải ngang. Máy tính giữ hàng chip bên dưới. Cùng dùng handleGradeClick / handleTopicClick. */}
      <div className="md:hidden flex items-stretch gap-2 mb-5">
        <FilterPicker
          label="Lớp"
          summary={gradeMode === "all" || selectedGrades.length === 0 ? "Tất cả các lớp" : selectedGrades.map((g) => `Lớp ${g}`).join(", ")}
          highlighted={gradeMode === "custom"}
          options={["Tất cả", "10", "11", "12"].map((g) => ({
            value: g,
            label: g === "Tất cả" ? "Tất cả các lớp" : `Lớp ${g}`,
            active: g === "Tất cả" ? gradeMode === "all" : gradeMode === "custom" && selectedGrades.includes(g),
          }))}
          onToggle={handleGradeClick}
        />
        <FilterPicker
          label="Chủ đề"
          summary={topicMode === "custom" ? (selectedTopics.length > 1 ? `${selectedTopics[0]} +${selectedTopics.length - 1}` : selectedTopics[0]) : "Tất cả chủ đề"}
          highlighted={topicMode === "custom"}
          options={[
            { value: "Tất cả", label: "Tất cả chủ đề", active: topicMode !== "custom" },
            ...topics.filter((t) => TOPIC_STYLE[t]).map((t) => ({
              value: t, label: t, glyph: TOPIC_STYLE[t].glyph, tone: TOPIC_STYLE[t].tone,
              active: topicMode === "custom" && selectedTopics.includes(t),
            })),
          ]}
          onToggle={handleTopicClick}
        />
        <button
          type="button"
          aria-pressed={savedActive}
          aria-label="Yêu thích"
          title="Yêu thích"
          onClick={() => handleTopicClick(savedActive ? "Tất cả" : "Yêu thích")}
          className={`w-11 h-11 shrink-0 rounded-[12px] border flex items-center justify-center cursor-pointer transition-colors ${savedActive ? "bg-navy-btn border-navy-btn text-white dark:bg-accent dark:border-accent" : "bg-white dark:bg-[#1E293B] border-line dark:border-[#334155] text-[#E11D48]"}`}
        >
          {isGuest ? <Lock size={16} className="text-accent" /> : <Heart size={17} fill={savedActive ? "currentColor" : "none"} />}
        </button>
      </div>

      {/* Lớp + Yêu thích (máy tính) */}
      <div className="hidden md:flex gap-2 overflow-x-auto pb-1 mb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {["Tất cả", "10", "11", "12"].map((grade) => {
          const isActive = grade === "Tất cả" ? gradeMode === "all" : gradeMode === "custom" && selectedGrades.includes(grade);
          return (
            <button
              key={grade}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleGradeClick(grade)}
              className={`${CHIP} shrink-0 ${isActive ? CHIP_ON : CHIP_OFF}`}
            >
              {grade === "Tất cả" ? "Tất cả các lớp" : `Lớp ${grade}`}
            </button>
          );
        })}
        <span className="w-px shrink-0 bg-line dark:bg-[#334155] mx-1" aria-hidden="true" />
        <button
          type="button"
          aria-pressed={savedActive}
          onClick={() => handleTopicClick(savedActive ? "Tất cả" : "Yêu thích")}
          className={`${CHIP} shrink-0 ${savedActive ? CHIP_ON : CHIP_OFF}`}
        >
          {isGuest ? <Lock size={13} className="text-accent" /> : <Heart size={13} className={savedActive ? "" : "text-[#E11D48]"} fill={savedActive ? "currentColor" : "none"} />}
          Yêu thích
        </button>
      </div>

      {/* Chủ đề — bấm để lọc (chọn được nhiều chủ đề) — máy tính */}
      <div className="hidden md:block">
      <div className="flex items-center justify-between mb-3">
        <div className={LABEL}>Chủ đề</div>
        {topicMode === "custom" && (
          <button type="button" onClick={() => handleTopicClick("Tất cả")} className="bg-transparent border-none p-0 text-[0.78rem] font-semibold text-accent cursor-pointer">
            Bỏ lọc chủ đề
          </button>
        )}
      </div>
      {/* Nút gọn (biểu tượng + tên) — số công thức đã hiện ở tiêu đề danh sách bên dưới, không lặp lại ở đây. */}
      <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
        {topics.filter((t) => TOPIC_STYLE[t]).map((topic) => {
          const isActive = topicMode === "custom" && selectedTopics.includes(topic);
          const { glyph, tone } = TOPIC_STYLE[topic];
          return (
            <button
              key={topic}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleTopicClick(topic)}
              className={`inline-flex items-center gap-2 h-10 pl-1 pr-3.5 rounded-full border text-[0.85rem] font-semibold cursor-pointer transition-colors ${
                isActive
                  ? "border-accent bg-accent-light text-[#92400E] dark:bg-accent/15 dark:text-[#FCD34D]"
                  : "border-line dark:border-[#334155] bg-white dark:bg-[#1E293B] text-primary dark:text-[#E2E8F0] hover:border-[#CBD5E1] dark:hover:border-[#475569]"
              }`}
            >
              <span className={`min-w-8 h-8 px-1.5 rounded-full flex items-center justify-center font-[Georgia,serif] italic font-bold text-[0.78rem] shrink-0 ${tone}`}>{glyph}</span>
              {topic}
            </button>
          );
        })}
      </div>
      </div>

      {/* Danh sách công thức (không vẽ LaTeX trên thẻ — 249 công thức KaTeX cùng lúc rất nặng) */}
      <div className="flex justify-between items-baseline mb-3">
        <h2 className="m-0 text-[1.05rem] md:text-[1.15rem] font-bold tracking-[-0.01em] text-primary dark:text-[#E2E8F0]">
          {savedActive ? "Công thức yêu thích" : topicMode === "custom" ? selectedTopics.join(" · ") : "Tất cả công thức"}
        </h2>
        <span className="text-[0.78rem] text-text-muted dark:text-[#94A3B8]">{filteredFormulas.length} công thức</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
        {filteredFormulas.length > 0 ? (
          filteredFormulas.map((formula) => {
            const isBookmarked = bookmarkedIds.includes(formula.id);
            return (
              <div key={formula.id} className={`${CARD} p-4 md:p-5 flex flex-col gap-3`}>
                <div className="flex justify-between items-start gap-2">
                  <span className="flex items-center gap-2 text-[0.72rem] font-semibold">
                    <span className={TOPIC_TEXT[formula.topic] || "text-text-muted"}>{formula.topic}</span>
                    <span className="text-text-muted dark:text-[#94A3B8]">· Lớp {formula.grade}</span>
                  </span>
                  <button
                    type="button"
                    className={`relative -mt-1 -mr-1 w-8 h-8 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer transition-colors shrink-0 hover:bg-[#FFE4E6] dark:hover:bg-white/5 ${isBookmarked ? "text-[#E11D48]" : "text-[#94A3B8]"}`}
                    onClick={() => onToggleBookmark(formula.id)}
                    title={isGuest ? "Đăng nhập Google để lưu yêu thích" : isBookmarked ? "Bỏ bookmark" : "Thêm bookmark"}
                    aria-label={isGuest ? "Đăng nhập Google để lưu yêu thích" : isBookmarked ? "Bỏ bookmark" : "Thêm bookmark"}
                  >
                    <Heart size={18} fill={isBookmarked ? "currentColor" : "none"} />
                    {isGuest && (
                      <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-[#1E293B] flex items-center justify-center">
                        <Lock size={9} className="text-accent" />
                      </span>
                    )}
                  </button>
                </div>

                <h3 className="m-0 text-[0.98rem] md:text-[1.02rem] font-semibold leading-[1.4] text-primary dark:text-[#E2E8F0]">{formula.name}</h3>

                <div className="flex gap-2 mt-auto pt-1">
                  <button
                    type="button"
                    className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-[11px] bg-navy-btn dark:bg-accent text-white text-[0.8rem] font-semibold border-none cursor-pointer transition-colors hover:bg-navy-btn-hover dark:hover:bg-accent-hover"
                    onClick={() => onViewDetail(formula)}
                  >
                    <BookOpen size={14} />
                    <span>Chi tiết</span>
                  </button>
                  <button
                    type="button"
                    className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-[11px] bg-white dark:bg-[#0F172A] text-primary dark:text-[#E2E8F0] text-[0.8rem] font-semibold border border-[#D5DAE5] dark:border-[#475569] cursor-pointer transition-colors hover:border-accent"
                    onClick={() => onCreateFlashcard(formula)}
                  >
                    {isGuest ? <Lock size={14} /> : <Layers size={14} />}
                    <span>Tạo Flashcard</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className={`${CARD} flex flex-col items-center justify-center text-center gap-2 py-12 px-4 col-[1/-1]`}>
            <HelpCircle size={40} className="text-[#CBD5E1]" />
            <h3 className="m-0 text-base font-bold text-primary dark:text-[#E2E8F0]">Không tìm thấy công thức</h3>
            <p className="m-0 text-[0.82rem] text-text-muted dark:text-[#94A3B8]">
              Hãy thử từ khoá khác hoặc đổi bộ lọc lớp, chủ đề.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
