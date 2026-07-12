import React, { useState, useRef, useEffect } from "react";
import { Search, Heart, HelpCircle, XCircle, ArrowLeft, BookOpen, Layers } from "lucide-react";

export default function FormulaLibrary({
  formulas,
  bookmarkedIds,
  onToggleBookmark,
  onCreateFlashcard,
  onViewDetail,
  setActiveTab
}) {
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
      const filtered = formulas.filter(f =>
        f.name.toLowerCase().includes(value.toLowerCase()) ||
        f.topic.toLowerCase().includes(value.toLowerCase()) ||
        f.tags.some(tag => tag.toLowerCase().includes(value.toLowerCase()))
      ).slice(0, 5);

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
  const filteredFormulas = formulas.filter(f => {
    const matchesTopic = topicMode === "all"
      ? true
      : topicMode === "saved"
        ? bookmarkedIds.includes(f.id)
        : selectedTopics.includes(f.topic);
    const matchesGrade = gradeMode === "all" || selectedGrades.includes(f.grade.toString());
    const matchesSearch = searchQuery.trim() === "" ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTopic && matchesGrade && matchesSearch;
  }).sort((a, b) => {
    const aBookmarked = bookmarkedIds.includes(a.id);
    const bBookmarked = bookmarkedIds.includes(b.id);
    if (aBookmarked && !bBookmarked) return -1;
    if (!aBookmarked && bBookmarked) return 1;
    return 0;
  });

  return (
    <div className="view-container">
      <div className="relative overflow-hidden min-h-full bg-page-gradient dark:bg-[#0F172A] -mt-6 md:-mt-8 -mx-4 md:-mx-8 -mb-8 md:-mb-12 pt-6 md:pt-8 px-4 pb-8 md:pb-12">
        <div className="relative z-[1]">
          {/* Breadcrumb Back */}
          <button className="bg-transparent border-none text-text-muted dark:text-[#94A3B8] text-[0.8rem] font-bold inline-flex items-center gap-1 cursor-pointer mb-3 transition duration-200 hover:text-primary dark:hover:text-[#E2E8F0]" onClick={() => setActiveTab("dashboard")}>
            <ArrowLeft size={12} />
            <span>Về trang chủ</span>
          </button>

          {/* Page Title & Subtitle */}
          <div className="mb-5">
            <h2 className="text-[1.6rem] font-extrabold text-primary dark:text-[#E2E8F0] tracking-[-0.5px]">
              Thư viện công thức
            </h2>
            <p className="text-[0.85rem] text-text-muted dark:text-[#94A3B8] font-medium mt-1">
              {topicMode === "saved"
                ? `${filteredFormulas.length} công thức yêu thích`
                : `Khám phá ${filteredFormulas.length} công thức Toán THPT`}
            </p>
          </div>

          {/* Autocomplete Search Bar */}
          <div className="relative w-full mb-4" ref={searchContainerRef}>
            <div className="glass-card-sm relative flex items-center w-full px-4">
              <Search size={18} className="text-[#94A3B8] mr-3 shrink-0" />
              <input
                type="text"
                className="flex-1 border-none outline-none bg-transparent text-[0.9rem] font-medium text-primary dark:text-[#E2E8F0] py-3 placeholder:text-[#94A3B8]"
                placeholder="Tìm công thức theo tên hoặc từ khóa..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.trim() !== "" && setShowSuggestions(true)}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setShowSuggestions(false); }}
                  className="absolute right-3 bg-transparent border-none text-[#666] cursor-pointer flex items-center"
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-[0_8px_24px_rgba(30,58,95,0.08)] z-20 max-h-[280px] overflow-y-auto overflow-hidden">
                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 px-4 py-2.5 cursor-pointer transition-colors duration-150 hover:bg-[#f8fafc] dark:hover:bg-white/5 border-b border-[#f1f5f9] dark:border-[#334155] last:border-b-0"
                    onClick={() => selectSuggestion(item.name)}
                  >
                    <span className="text-[0.85rem] font-semibold text-primary dark:text-[#E2E8F0] truncate">{item.name}</span>
                    <span className="text-[0.7rem] text-text-muted dark:text-[#94A3B8] shrink-0 whitespace-nowrap ml-2">{item.topic} Lớp {item.grade}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filter chips & Grade pills */}
          <div className="flex flex-col gap-3 mb-4">
            {/* Topics row */}
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {topics.map((topic) => {
                const isActive = topic === "Tất cả"
                  ? topicMode === "all"
                  : topic === "Yêu thích"
                    ? topicMode === "saved"
                    : topicMode === "custom" && selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    className={`whitespace-nowrap px-4 py-2 rounded-full border-[1.5px] text-[0.8rem] font-bold cursor-pointer transition duration-200 ${
                      isActive
                        ? "bg-primary border-primary text-white dark:bg-accent dark:border-accent"
                        : "bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155] text-[#475569] dark:text-[#94A3B8] hover:border-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155]"
                    }`}
                    onClick={() => handleTopicClick(topic)}
                    style={topic === "Yêu thích" && !isActive ? {
                      borderColor: "#E74C3C", color: "#E74C3C"
                    } : {}}
                  >
                    {topic === "Yêu thích" ? <><Heart size={11} fill={isActive ? "white" : "#E74C3C"} color={isActive ? "white" : "#E74C3C"} className="inline mr-[3px] align-middle" /> Yêu thích</> : topic}
                  </button>
                );
              })}
            </div>

            {/* Grade filters matching Screenshot 2 */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[0.85rem] font-extrabold text-primary dark:text-[#E2E8F0]">Lớp:</span>
              <div className="flex gap-2">
                {["Tất cả", "10", "11", "12"].map((grade) => {
                  const isActive = grade === "Tất cả"
                    ? gradeMode === "all"
                    : gradeMode === "custom" && selectedGrades.includes(grade);
                  const isAll = grade === "Tất cả";
                  return (
                    <button
                      key={grade}
                      onClick={() => handleGradeClick(grade)}
                      style={{
                        width: isAll ? "auto" : "36px",
                        height: "36px",
                        padding: isAll ? "0 14px" : "0",
                        borderRadius: isAll ? "18px" : "50%",
                        border: "1px solid #cbd5e1",
                        backgroundColor: isActive ? "#D97706" : "white",
                        color: isActive ? "white" : "#0F172A",
                        fontWeight: "800",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                        boxShadow: isActive ? "0 2px 6px rgba(217,119,6,0.3)" : "none"
                      }}
                    >
                      {grade}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3-Column Library Cards List (NO math equations on cards!) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {filteredFormulas.length > 0 ? (
              filteredFormulas.map((formula) => {
                const isBookmarked = bookmarkedIds.includes(formula.id);
                return (
                  <div key={formula.id} className="glass-card dark:bg-[#1E293B] dark:border-[#334155] p-4 flex flex-col gap-3 relative">
                    {/* Header: Title and Heart */}
                    <div className="flex justify-between items-start">
                      <h3 className="text-[1.05rem] font-extrabold text-primary dark:text-[#E2E8F0]">{formula.name}</h3>
                      <button
                        className={`w-8 h-8 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer transition-colors duration-150 shrink-0 hover:bg-error/8 hover:text-error ${isBookmarked ? "text-error" : "text-[#94A3B8]"}`}
                        onClick={() => onToggleBookmark(formula.id)}
                        title={isBookmarked ? "Bỏ bookmark" : "Thêm bookmark"}
                      >
                        <Heart size={18} fill={isBookmarked ? "#E74C3C" : "none"} />
                      </button>
                    </div>

                    {/* Subtitle: Category and Grade tags */}
                    <div className="flex gap-2 -mt-1">
                      <span className="text-[0.75rem] font-bold text-secondary">
                        {formula.topic}
                      </span>
                      <span className="text-[0.75rem] font-bold text-text-muted dark:text-[#94A3B8]">
                        Lớp {formula.grade}
                      </span>
                    </div>

                    {/* Footer Actions: Chi tiết & Tạo Flashcard side-by-side */}
                    <div className="flex gap-2 mt-3">
                      <button
                        className="flex-1 bg-secondary/4 text-secondary border border-secondary/15 text-[0.8rem] font-bold py-2 px-3 rounded-xl min-h-[38px] inline-flex items-center justify-center gap-1.5 cursor-pointer transition duration-200 hover:bg-secondary/8 hover:-translate-y-px"
                        onClick={() => onViewDetail(formula)}
                      >
                        <BookOpen size={12} />
                        <span>Chi tiết</span>
                      </button>
                      <button
                        className="flex-1 bg-success/4 text-success border border-success/15 text-[0.8rem] font-bold py-2 px-3 rounded-xl min-h-[38px] inline-flex items-center justify-center gap-1.5 cursor-pointer transition duration-200 hover:bg-success/8 hover:-translate-y-px"
                        onClick={() => onCreateFlashcard(formula)}
                      >
                        <Layers size={12} />
                        <span>Tạo Flashcard</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-2 py-12 px-4 col-[1/-1]">
                <HelpCircle size={48} className="text-[#cbd5e1] mb-2" />
                <h3 className="text-base font-extrabold text-primary dark:text-[#E2E8F0]">Không tìm thấy công thức</h3>
                <p className="text-[0.8rem] text-text-muted dark:text-[#94A3B8] mt-1">
                  Hãy thử tìm kiếm với các từ khóa khác hoặc thay đổi bộ lọc.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
