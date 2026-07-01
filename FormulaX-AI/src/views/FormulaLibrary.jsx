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

  const topics = ["Tất cả", "Đã lưu", "Đại số", "Hình học", "Giải tích", "Lượng giác", "Xác suất & Thống kê", "Mở rộng"];

  const handleTopicClick = (topic) => {
    if (topic === "Tất cả") {
      setTopicMode("all");
      setSelectedTopics([]);
      return;
    }
    if (topic === "Đã lưu") {
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
      {/* Breadcrumb Back */}
      <button className="breadcrumb-back" onClick={() => setActiveTab("dashboard")}>
        <ArrowLeft size={12} />
        <span>Về trang chủ</span>
      </button>

      {/* Page Title & Subtitle */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#1E3A5F", letterSpacing: "-0.5px" }}>
          Thư viện công thức
        </h2>
        <p style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: "500", marginTop: "4px" }}>
          {topicMode === "saved"
            ? `${filteredFormulas.length} công thức đã lưu`
            : `Khám phá ${filteredFormulas.length} công thức Toán THPT`}
        </p>
      </div>

      {/* Autocomplete Search Bar */}
      <div className="library-search-container" ref={searchContainerRef}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-input-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Tìm công thức theo tên hoặc từ khóa..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.trim() !== "" && setShowSuggestions(true)}
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(""); setShowSuggestions(false); }}
              style={{ position: "absolute", right: "12px", background: "none", border: "none", color: "#666", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <XCircle size={16} />
            </button>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="autocomplete-dropdown">
            {suggestions.map((item) => (
              <div 
                key={item.id} 
                className="suggestion-item"
                onClick={() => selectSuggestion(item.name)}
              >
                <span className="suggestion-name">{item.name}</span>
                <span className="suggestion-topic">{item.topic} Lớp {item.grade}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter chips & Grade pills */}
      <div className="filters-container">
        {/* Topics row */}
        <div className="filter-row">
          {topics.map((topic) => {
            const isActive = topic === "Tất cả"
              ? topicMode === "all"
              : topic === "Đã lưu"
                ? topicMode === "saved"
                : topicMode === "custom" && selectedTopics.includes(topic);
            return (
              <button
                key={topic}
                className={`filter-pill ${isActive ? "active" : ""}`}
                onClick={() => handleTopicClick(topic)}
                style={topic === "Đã lưu" && !isActive ? {
                  borderColor: "#E74C3C", color: "#E74C3C"
                } : {}}
              >
                {topic === "Đã lưu" ? <><Heart size={11} fill={isActive ? "white" : "#E74C3C"} color={isActive ? "white" : "#E74C3C"} style={{ display: "inline", marginRight: "3px", verticalAlign: "middle" }} /> Đã lưu</> : topic}
              </button>
            );
          })}
        </div>

        {/* Grade filters matching Screenshot 2 */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#1E3A5F" }}>Lớp:</span>
          <div style={{ display: "flex", gap: "8px" }}>
            {["Tất cả", "10", "11", "12"].map((grade) => {
              const isActive = grade === "Tất cả"
                ? gradeMode === "all"
                : gradeMode === "custom" && selectedGrades.includes(grade);
              return (
                <button
                  key={grade}
                  onClick={() => handleGradeClick(grade)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "1px solid #cbd5e1",
                    backgroundColor: isActive ? "#3B82F6" : "white",
                    color: isActive ? "white" : "#1E3A5F",
                    fontWeight: "800",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                    boxShadow: isActive ? "0 2px 6px rgba(59,130,246,0.3)" : "none"
                  }}
                >
                  {grade === "Tất cả" ? "Cả" : grade}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3-Column Library Cards List (NO math equations on cards!) */}
      <div className="library-grid-figma">
        {filteredFormulas.length > 0 ? (
          filteredFormulas.map((formula) => {
            const isBookmarked = bookmarkedIds.includes(formula.id);
            return (
              <div key={formula.id} className="library-card-figma">
                {/* Header: Title and Heart */}
                <div className="library-card-header">
                  <h3 className="library-card-title">{formula.name}</h3>
                  <button 
                    className={`bookmark-btn ${isBookmarked ? "bookmarked" : ""}`}
                    onClick={() => onToggleBookmark(formula.id)}
                    title={isBookmarked ? "Bỏ bookmark" : "Thêm bookmark"}
                  >
                    <Heart size={18} fill={isBookmarked ? "#E74C3C" : "none"} />
                  </button>
                </div>

                {/* Subtitle: Category and Grade tags */}
                <div style={{ display: "flex", gap: "8px", marginTop: "-4px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#3B82F6" }}>
                    {formula.topic}
                  </span>
                  <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748B" }}>
                    Lớp {formula.grade}
                  </span>
                </div>

                {/* Footer Actions: Chi tiết & Tạo Flashcard side-by-side */}
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button 
                    className="btn-action-outline-blue"
                    onClick={() => onViewDetail(formula)}
                  >
                    <BookOpen size={12} />
                    <span>Chi tiết</span>
                  </button>
                  <button 
                    className="btn-action-outline-green"
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
          <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
            <HelpCircle size={48} className="empty-state-icon" />
            <h3 style={{ fontSize: "1rem", fontWeight: "800", color: "#1E3A5F" }}>Không tìm thấy công thức</h3>
            <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "4px" }}>
              Hãy thử tìm kiếm với các từ khóa khác hoặc thay đổi bộ lọc.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
