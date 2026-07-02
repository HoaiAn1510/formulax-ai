import React, { useState } from "react";
import { Crown, Check, X, ShieldCheck, Heart, Sparkles, Smartphone, Landmark, Award, Target, Zap, ChevronDown, ChevronUp, Gem } from "lucide-react";
import { glassCard, orbs, orbStyle, pageWrapper, contentLayer } from "../styles/theme";

export default function PremiumUpgrade({ isPremium, setIsPremium, setActiveTab }) {
  const [openFaqIdx, setOpenFaqIdx] = useState(null);

  const handleUpgrade = () => {
    setIsPremium(true);
    alert("Chúc mừng! Bạn đã kích hoạt tài khoản FormulaX Pro giả lập thành công! Hãy trải nghiệm tính năng giải toán AI, luyện đề trắc nghiệm và tải tài liệu không giới hạn.");
    setActiveTab("dashboard");
  };

  const handleDowngrade = () => {
    setIsPremium(false);
    alert("Đã chuyển tài khoản về phiên bản Free.");
  };

  const toggleFaq = (idx) => {
    setOpenFaqIdx(openFaqIdx === idx ? null : idx);
  };

  const goals = [
    {
      icon: Target,
      title: "Hiểu sâu bản chất",
      desc: "Finder AI phân tích ngữ nghĩa, giải thích chi tiết ý nghĩa từng ký hiệu và ví dụ minh họa trực quan."
    },
    {
      icon: Zap,
      title: "Tối ưu hóa thời gian",
      desc: "Học tập thông minh hơn, rút ngắn 50% thời gian ôn luyện ghi nhớ công thức toán học phổ thông."
    },
    {
      icon: Award,
      title: "Luyện đề không giới hạn",
      desc: "Ngân hàng đề thi trắc nghiệm phong phú, tự do tùy biến cấu trúc đề theo lớp và chủ đề ôn thi."
    },
    {
      icon: Heart,
      title: "Yêu thích & Lưu trữ",
      desc: "Lưu trữ toàn bộ công thức quan trọng, dễ dàng ôn tập lại bất cứ khi nào bạn cần mà không sợ thất lạc."
    },
    {
      icon: Sparkles,
      title: "Trợ lý Finder AI",
      desc: "Giải đáp chi tiết mọi thắc mắc toán học, hỗ trợ đắc lực trong suốt quá trình ôn thi của bạn."
    },
    {
      icon: Smartphone,
      title: "Xuất PDF & Offline",
      desc: "Kết xuất flashcard ra file PDF/Ảnh chất lượng cao phục vụ in ấn học tập offline mọi lúc mọi nơi."
    }
  ];

  const features = [
    { name: "Luyện đề trắc nghiệm", free: "Giới hạn 10 câu/ngày", premium: "Không giới hạn câu hỏi" },
    { name: "Độ khó tự chọn & Điền đáp án", free: "Khóa", premium: "Mở khóa toàn bộ" },
    { name: "Trợ lý giải toán Finder AI", free: "Tra cứu công thức cơ bản", premium: "Giải chi tiết từng bước & gợi ý nâng cao" },
    { name: "Thống kê tiến trình học tập", free: "Thống kê cơ bản", premium: "Phân tích chi tiết điểm yếu & thế mạnh" },
    { name: "Xuất PDF/Ảnh Flashcard", free: "Khóa", premium: "Tải về chất lượng cao" }
  ];

  const faqs = [
    {
      q: "Tôi có thể hủy gói đăng ký bất cứ lúc nào không?",
      a: "Có, bạn hoàn toàn có thể hủy gia hạn gói Premium bất cứ lúc nào trong mục Cài đặt tài khoản mà không bị phạt hay tính thêm bất kỳ khoản phí ẩn nào."
    },
    {
      q: "Tài liệu PDF/Ảnh kết xuất ra có giới hạn số lượng không?",
      a: "Hoàn toàn không. Tài khoản Premium cho phép bạn xuất không giới hạn số lượng thẻ ghi nhớ cá nhân ra định dạng tệp PDF/Ảnh độ nét cao để ôn thi offline."
    },
    {
      q: "Trợ lý Finder AI hỗ trợ những môn học nào khác ngoài Toán không?",
      a: "Hiện tại FormulaX AI tối ưu hóa dữ liệu chuyên sâu cho chương trình Toán THPT (Đại số, Giải tích, Hình học, Xác suất). Các môn Vật lý và Hóa học dự kiến sẽ ra mắt trong quý sau."
    },
    {
      q: "Cách thanh toán và nhận tài khoản Premium thế nào?",
      a: "Bạn có thể thanh toán qua MoMo, ZaloPay, VNPay hoặc Chuyển khoản ngân hàng. Tài khoản sẽ được nâng cấp lên Premium ngay lập tức sau khi giao dịch hoàn tất."
    },
    {
      q: "Tôi có thể dùng chung tài khoản trên nhiều thiết bị không?",
      a: "Có, tài khoản Premium hỗ trợ đăng nhập và đồng bộ dữ liệu ôn tập trên 3 thiết bị cùng một lúc (Điện thoại, Máy tính bảng, Máy tính cá nhân)."
    }
  ];

  return (
    <div className="view-container">
    <div style={pageWrapper}>
      {orbs.map((orb, idx) => (
        <div key={idx} style={orbStyle(orb)} />
      ))}
      <div style={contentLayer}>
      <div className="premium-upgrade-container" style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
        
        {/* Section 1: Hero Banner */}
        <div className="upgrade-header-hero" style={{ 
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", 
          padding: "40px 24px", 
          borderRadius: "16px", 
          textAlign: "center",
          color: "white",
          position: "relative",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
          overflow: "hidden"
        }}>
          <div style={{ marginBottom: "12px" }}>
            <span className="tier-badge-pill" style={{ 
              background: "rgba(245, 158, 11, 0.15)", 
              color: "#F59E0B",
              fontSize: "0.75rem",
              fontWeight: "700",
              padding: "4px 12px",
              borderRadius: "20px"
            }}>CHƯƠNG TRÌNH KHUYÊN DÙNG</span>
          </div>
          
          <Crown size={36} fill="#F59E0B" color="#F59E0B" style={{ margin: "0 auto 12px auto" }} />
          
          <h1 style={{ fontSize: "1.45rem", fontWeight: "800", color: "#FFFFFF", margin: "0 0 8px 0" }}>
            Mở khóa toàn bộ sức mạnh <span style={{ color: "#F59E0B" }}>FormulaX AI</span>
          </h1>
          
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "6px", margin: "12px 0" }}>
            <span style={{ fontSize: "2.2rem", fontWeight: "800", color: "#F59E0B" }}>49.000 ₫</span>
            <span style={{ fontSize: "0.9rem", color: "#94A3B8", fontWeight: "600" }}>/ tháng</span>
          </div>

          <p style={{ fontSize: "0.85rem", color: "#CBD5E1", maxWidth: "480px", margin: "0 auto 20px auto", lineHeight: "1.5" }}>
            Đột phá điểm số môn Toán THPT Quốc gia cùng lộ trình ôn tập công thức thông minh bậc nhất và trợ lý giải toán AI đắc lực.
          </p>

          {!isPremium ? (
            <button 
              className="btn btn-premium vibrate" 
              onClick={handleUpgrade}
              style={{ width: "100%", maxWidth: "300px", height: "46px", fontSize: "0.95rem", borderRadius: "8px" }}
            >
              <span>Nâng cấp Pro ngay</span>
              <Crown size={14} fill="white" />
            </button>
          ) : (
            <button 
              className="btn btn-secondary" 
              onClick={handleDowngrade}
              style={{ width: "100%", maxWidth: "300px", height: "46px", fontSize: "0.95rem", borderRadius: "8px" }}
            >
              <span>Trở về gói Free (Giả lập)</span>
            </button>
          )}
        </div>

        {/* Section 2: Account Progress Tracker Links */}
        <div style={{ 
          backgroundColor: "#F1F5F9", 
          padding: "12px 16px", 
          borderRadius: "12px", 
          textAlign: "center",
          fontSize: "0.8rem",
          fontWeight: "600",
          color: "#475569"
        }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
            <span>• 1. Thư viện công thức</span>
            <span>• 2. Flashcard ghi nhớ</span>
            <span>• 3. Đánh giá kiểm tra</span>
          </div>
        </div>

        {/* Section 3: Goals Grid */}
        <div>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#1E3A5F", margin: 0 }}>
              Mọi thứ bạn cần để đạt điểm cao
            </h2>
            <p style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "4px" }}>Đầy đủ tính năng hỗ trợ thi THPT Quốc gia tốt nhất</p>
          </div>
          <div className="goals-grid">
            {goals.map((goal, idx) => {
              const GoalIcon = goal.icon;
              return (
                <div key={idx} className="goal-card" style={{ ...glassCard, display: "flex", gap: "12px", padding: "16px" }}>
                  <div style={{ 
                    width: "36px", 
                    height: "36px", 
                    borderRadius: "8px", 
                    backgroundColor: "rgba(245, 158, 11, 0.08)", 
                    color: "#F59E0B", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <GoalIcon size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: "800", color: "#1E3A5F", margin: "0 0 4px 0" }}>{goal.title}</h3>
                    <p style={{ fontSize: "0.75rem", color: "#64748B", margin: 0, lineHeight: "1.4" }}>{goal.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Detailed Compare Table */}
        <div>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#1E3A5F", margin: 0 }}>
              So sánh các gói học tập
            </h2>
            <p style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "4px" }}>
              Lựa chọn thông minh để bứt phá điểm số tối đa
            </p>
          </div>
          
          <div className="plan-compare-table-wrapper" style={glassCard}>
            <table className="plan-compare-table">
              <thead>
                <tr>
                  <th className="feature-name">Tính năng</th>
                  <th>Bản Free</th>
                  <th className="premium-col-header">Bản Pro</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feat, idx) => (
                  <tr key={idx}>
                    <td className="feature-name">{feat.name}</td>
                    <td>
                      {feat.free === "Khóa" ? (
                        <div className="compare-icon-x">
                          <X size={12} />
                        </div>
                      ) : (
                        <span style={{ color: "#64748B", fontWeight: "500" }}>{feat.free}</span>
                      )}
                    </td>
                    <td className="premium-col-cell">
                      {feat.premium === "Mở khóa toàn bộ" || feat.premium === "Tải về chất lượng cao" ? (
                        <div className="compare-icon-check">
                          <Check size={12} />
                        </div>
                      ) : (
                        <span>{feat.premium}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Gold Card - Nâng cấp trải nghiệm học */}
        {!isPremium && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ marginBottom: "8px" }}>
              <span style={{ 
                backgroundColor: "#10B981", 
                color: "white", 
                fontSize: "0.7rem", 
                fontWeight: "800", 
                padding: "2px 8px", 
                borderRadius: "4px" 
              }}>MỞ KHÓA NGAY</span>
            </div>
            
            <div className="upgrade-pricing-card" style={{
              border: "2px solid #F59E0B",
              borderRadius: "20px",
              padding: "24px",
              maxWidth: "400px",
              width: "100%",
              backgroundColor: "rgba(255,255,255,0.75)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 10px 25px rgba(245, 158, 11, 0.15)"
            }}>
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <Crown size={28} fill="#F59E0B" color="#F59E0B" style={{ margin: "0 auto 6px auto" }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#1E3A5F", margin: 0 }}>Premium hàng tháng</h3>
                <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "2px 0 0 0" }}>Gói tài khoản ưu việt nhất</p>
                <h3 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#F59E0B", margin: "10px 0 0 0" }}>49.000 ₫</h3>
                <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: "600" }}>/tháng</span>
              </div>
              
              <div style={{ height: "1px", backgroundColor: "#E2E8F0", margin: "16px 0" }}></div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#334155" }}>
                  <Check size={14} style={{ color: "#10B981", flexShrink: 0 }} />
                  <span>Tra cứu & Giải toán Finder AI không giới hạn</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#334155" }}>
                  <Check size={14} style={{ color: "#10B981", flexShrink: 0 }} />
                  <span>Mở khóa toàn bộ ngân hàng câu hỏi trắc nghiệm tự điền</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#334155" }}>
                  <Check size={14} style={{ color: "#10B981", flexShrink: 0 }} />
                  <span>Không có quảng cáo & ưu tiên máy chủ AI tốc độ cao</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#334155" }}>
                  <Check size={14} style={{ color: "#10B981", flexShrink: 0 }} />
                  <span>Xuất PDF/Ảnh Flashcard chất lượng cao ôn offline</span>
                </div>
              </div>

              <button 
                className="btn btn-premium vibrate" 
                onClick={handleUpgrade}
                style={{ width: "100%", height: "44px", fontSize: "0.9rem", borderRadius: "8px", border: "none" }}
              >
                <span>Mua ngay với Momo / Thẻ</span>
              </button>
            </div>
          </div>
        )}

        {/* Section 6: Nhiều cách thanh toán */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
            Nhiều cách thanh toán
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "24px", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#A20067", display: "flex", alignItems: "center", justifyCenter: "center", color: "white", fontWeight: "800", fontSize: "0.7rem" }}>MoMo</div>
              <span style={{ fontSize: "0.65rem", color: "#64748B", fontWeight: "600" }}>Ví MoMo</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#007DFF", display: "flex", alignItems: "center", justifyCenter: "center", color: "white", fontWeight: "800", fontSize: "0.7rem" }}>Zalo</div>
              <span style={{ fontSize: "0.65rem", color: "#64748B", fontWeight: "600" }}>ZaloPay</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#EA2027", display: "flex", alignItems: "center", justifyCenter: "center", color: "white", fontWeight: "800", fontSize: "0.7rem" }}>VN</div>
              <span style={{ fontSize: "0.65rem", color: "#64748B", fontWeight: "600" }}>VNPay</span>
            </div>
          </div>
        </div>

        {/* Section 7: FAQs Accordion */}
        <div>
          <h2 className="section-title" style={{ justifyContent: "center", fontSize: "1.15rem", fontWeight: "800" }}>Câu hỏi thường gặp</h2>
          <div className="faq-accordion">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx} className="faq-item" style={{ borderBottom: "1px solid #E2E8F0", padding: "8px 0" }}>
                  <button className="faq-question" onClick={() => toggleFaq(idx)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", padding: "12px 4px", fontSize: "0.85rem", fontWeight: "700", color: "#1E3A5F", cursor: "pointer", textAlign: "left" }}>
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isOpen && (
                    <div className="faq-answer" style={{ padding: "4px 4px 12px 4px", fontSize: "0.8rem", color: "#475569", lineHeight: "1.5" }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 9: Bottom CTA Banner */}
        {!isPremium && (
          <div className="bottom-cta-banner" style={{ 
            backgroundColor: "#FFFBEB", 
            border: "1.5px solid #F59E0B",
            borderRadius: "16px",
            padding: "24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px"
          }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#1E3A5F", margin: 0 }}>Điểm cao không chờ đợi</h3>
            <p style={{ fontSize: "0.8rem", color: "#64748B", margin: 0, maxWidth: "340px", lineHeight: "1.4" }}>
              Đăng ký ngay tài khoản Premium để đạt kết quả tốt nhất trong kỳ thi sắp tới.
            </p>
            <div style={{ display: "flex", gap: "12px", width: "100%", justifyContent: "center", flexWrap: "wrap", marginTop: "4px" }}>
              <button 
                className="btn btn-premium vibrate" 
                onClick={handleUpgrade}
                style={{ height: "42px", fontSize: "0.85rem", padding: "0 20px", borderRadius: "8px" }}
              >
                <span>Nâng cấp Premium</span>
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => alert("Bạn đã ở trang so sánh các gói!")}
                style={{ height: "42px", fontSize: "0.85rem", padding: "0 20px", borderRadius: "8px" }}
              >
                <span>Xem so sánh</span>
              </button>
            </div>
          </div>
        )}

      </div>
      </div>
    </div>
    </div>
  );
}
