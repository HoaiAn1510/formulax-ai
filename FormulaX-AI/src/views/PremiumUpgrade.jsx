import React, { useState } from "react";
import { Crown, Check, X, ShieldCheck, Heart, Sparkles, Smartphone, Landmark, Award, Target, Zap, ChevronDown, ChevronUp, Gem } from "lucide-react";

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
      <div className="relative overflow-hidden min-h-full bg-page-gradient -mt-6 md:-mt-8 -mx-4 -mb-8 md:-mb-12 pt-6 md:pt-8 px-4 pb-8 md:pb-12">
        <div className="absolute -top-[8%] -left-[6%] w-[260px] h-[260px] rounded-full pointer-events-none z-0 blur-[50px] bg-[radial-gradient(circle,rgba(196,132,252,0.45)_0%,transparent_70%)]" />
        <div className="absolute top-[6%] -right-[10%] w-[300px] h-[300px] rounded-full pointer-events-none z-0 blur-[50px] bg-[radial-gradient(circle,rgba(251,207,232,0.55)_0%,transparent_70%)]" />
        <div className="absolute -bottom-[12%] left-[18%] w-[320px] h-[320px] rounded-full pointer-events-none z-0 blur-[50px] bg-[radial-gradient(circle,rgba(147,197,253,0.45)_0%,transparent_70%)]" />
        <div className="relative z-[1]">
          <div className="max-w-full md:max-w-full mx-auto flex flex-col gap-12">

            {/* Section 1: Hero Banner */}
            <div className="bg-[linear-gradient(135deg,#0f172a_0%,#1e3a5f_100%)] py-10 px-6 rounded-2xl text-center text-white relative shadow-[0_10px_30px_rgba(15,23,42,0.15)] overflow-hidden">
              <div className="mb-3">
                <span className="bg-premium/15 text-premium text-xs font-bold py-1 px-3 rounded-[20px]">CHƯƠNG TRÌNH KHUYÊN DÙNG</span>
              </div>

              <Crown size={36} fill="#F59E0B" color="#F59E0B" className="mx-auto mb-3" />

              <h1 className="text-[1.45rem] font-extrabold text-white mb-2">
                Mở khóa toàn bộ sức mạnh <span className="text-premium">FormulaX AI</span>
              </h1>

              <div className="flex items-baseline justify-center gap-1.5 my-3">
                <span className="text-[2.2rem] font-extrabold text-premium">49.000 ₫</span>
                <span className="text-[0.9rem] text-[#94A3B8] font-semibold">/ tháng</span>
              </div>

              <p className="text-[0.85rem] text-[#CBD5E1] max-w-[480px] mx-auto mb-5 leading-[1.5]">
                Đột phá điểm số môn Toán THPT Quốc gia cùng lộ trình ôn tập công thức thông minh bậc nhất và trợ lý giải toán AI đắc lực.
              </p>

              {!isPremium ? (
                <button
                  className="btn btn-premium vibrate w-full max-w-[300px] h-[46px] text-[0.95rem] rounded-lg"
                  onClick={handleUpgrade}
                >
                  <span>Nâng cấp Pro ngay</span>
                  <Crown size={14} fill="white" />
                </button>
              ) : (
                <button
                  className="btn btn-secondary w-full max-w-[300px] h-[46px] text-[0.95rem] rounded-lg"
                  onClick={handleDowngrade}
                >
                  <span>Trở về gói Free (Giả lập)</span>
                </button>
              )}
            </div>

            {/* Section 2: Account Progress Tracker Links */}
            <div className="bg-[#F1F5F9] py-3 px-4 rounded-xl text-center text-[0.8rem] font-semibold text-[#475569]">
              <div className="flex justify-center gap-4 flex-wrap">
                <span>• 1. Thư viện công thức</span>
                <span>• 2. Flashcard ghi nhớ</span>
                <span>• 3. Đánh giá kiểm tra</span>
              </div>
            </div>

            {/* Section 3: Goals Grid */}
            <div>
              <div className="text-center mb-6">
                <h2 className="text-[1.25rem] font-extrabold text-primary m-0">
                  Mọi thứ bạn cần để đạt điểm cao
                </h2>
                <p className="text-[0.8rem] text-text-muted mt-1">Đầy đủ tính năng hỗ trợ thi THPT Quốc gia tốt nhất</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {goals.map((goal, idx) => {
                  const GoalIcon = goal.icon;
                  return (
                    <div key={idx} className="glass-card flex gap-3 p-4">
                      <div className="w-9 h-9 rounded-lg bg-premium/8 text-premium flex items-center justify-center shrink-0">
                        <GoalIcon size={18} />
                      </div>
                      <div>
                        <h3 className="text-[0.9rem] font-extrabold text-primary mb-1">{goal.title}</h3>
                        <p className="text-xs text-text-muted m-0 leading-[1.4]">{goal.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Detailed Compare Table */}
            <div>
              <div className="text-center mb-5">
                <h2 className="text-[1.3rem] font-extrabold text-primary m-0">
                  So sánh các gói học tập
                </h2>
                <p className="text-[0.8rem] text-text-muted mt-1">
                  Lựa chọn thông minh để bứt phá điểm số tối đa
                </p>
              </div>

              <div className="glass-card overflow-x-auto">
                <table className="w-full border-collapse text-[0.85rem] text-left">
                  <thead>
                    <tr>
                      <th className="text-left py-4 px-5 font-extrabold text-primary border-b-2 border-[#f1f5f9] text-[0.9rem]">Tính năng</th>
                      <th className="text-center py-4 px-5 font-extrabold text-primary border-b-2 border-[#f1f5f9] text-[0.9rem]">Bản Free</th>
                      <th className="text-center py-4 px-5 font-black text-[#d97706] bg-premium/4 border-b-2 border-premium/15 text-[0.9rem]">Bản Pro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feat, idx) => (
                      <tr key={idx} className="hover:bg-[#f8fafc] last:[&>td]:border-b-0">
                        <td className="text-left py-4 px-5 border-b border-[#f1f5f9] align-middle leading-[1.5] font-bold text-primary text-[0.85rem]">{feat.name}</td>
                        <td className="text-center py-4 px-5 border-b border-[#f1f5f9] align-middle leading-[1.5]">
                          {feat.free === "Khóa" ? (
                            <div className="inline-flex items-center justify-center bg-error/8 text-error w-6 h-6 rounded-full mx-auto">
                              <X size={12} />
                            </div>
                          ) : (
                            <span className="text-text-muted font-medium">{feat.free}</span>
                          )}
                        </td>
                        <td className="text-center py-4 px-5 border-b border-[#f1f5f9] align-middle leading-[1.5] bg-premium/[0.015] font-bold text-primary">
                          {feat.premium === "Mở khóa toàn bộ" || feat.premium === "Tải về chất lượng cao" ? (
                            <div className="inline-flex items-center justify-center bg-success/8 text-success w-6 h-6 rounded-full mx-auto">
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
              <div className="flex flex-col items-center">
                <div className="mb-2">
                  <span className="bg-success text-white text-[0.7rem] font-extrabold py-0.5 px-2 rounded">MỞ KHÓA NGAY</span>
                </div>

                <div className="border-2 border-premium rounded-[20px] p-6 max-w-[400px] w-full bg-white/75 backdrop-blur-[20px] shadow-[0_10px_25px_rgba(245,158,11,0.15)]">
                  <div className="text-center mb-4">
                    <Crown size={28} fill="#F59E0B" color="#F59E0B" className="mx-auto mb-1.5" />
                    <h3 className="text-[1.1rem] font-extrabold text-primary m-0">Premium hàng tháng</h3>
                    <p className="text-xs text-text-muted mt-0.5 mb-0">Gói tài khoản ưu việt nhất</p>
                    <h3 className="text-[1.8rem] font-extrabold text-premium mt-2.5 mb-0">49.000 ₫</h3>
                    <span className="text-[0.7rem] text-text-muted font-semibold">/tháng</span>
                  </div>

                  <div className="h-px bg-[#E2E8F0] my-4" />

                  <div className="flex flex-col gap-2.5 mb-5">
                    <div className="flex items-center gap-2 text-[0.8rem] text-[#334155]">
                      <Check size={14} className="text-success shrink-0" />
                      <span>Tra cứu & Giải toán Finder AI không giới hạn</span>
                    </div>
                    <div className="flex items-center gap-2 text-[0.8rem] text-[#334155]">
                      <Check size={14} className="text-success shrink-0" />
                      <span>Mở khóa toàn bộ ngân hàng câu hỏi trắc nghiệm tự điền</span>
                    </div>
                    <div className="flex items-center gap-2 text-[0.8rem] text-[#334155]">
                      <Check size={14} className="text-success shrink-0" />
                      <span>Không có quảng cáo & ưu tiên máy chủ AI tốc độ cao</span>
                    </div>
                    <div className="flex items-center gap-2 text-[0.8rem] text-[#334155]">
                      <Check size={14} className="text-success shrink-0" />
                      <span>Xuất PDF/Ảnh Flashcard chất lượng cao ôn offline</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-premium vibrate w-full h-11 text-[0.9rem] rounded-lg border-none"
                    onClick={handleUpgrade}
                  >
                    <span>Mua ngay với Momo / Thẻ</span>
                  </button>
                </div>
              </div>
            )}

            {/* Section 6: Nhiều cách thanh toán */}
            <div className="text-center">
              <div className="text-xs text-text-muted font-bold uppercase tracking-[0.5px] mb-3">
                Nhiều cách thanh toán
              </div>
              <div className="flex justify-center gap-6 items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-[#A20067] flex items-center justify-center text-white font-extrabold text-[0.7rem]">MoMo</div>
                  <span className="text-[0.65rem] text-text-muted font-semibold">Ví MoMo</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-[#007DFF] flex items-center justify-center text-white font-extrabold text-[0.7rem]">Zalo</div>
                  <span className="text-[0.65rem] text-text-muted font-semibold">ZaloPay</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-[#EA2027] flex items-center justify-center text-white font-extrabold text-[0.7rem]">VN</div>
                  <span className="text-[0.65rem] text-text-muted font-semibold">VNPay</span>
                </div>
              </div>
            </div>

            {/* Section 7: FAQs Accordion */}
            <div>
              <h2 className="text-[1.15rem] font-extrabold text-primary flex items-center justify-center gap-2 mb-2">Câu hỏi thường gặp</h2>
              <div className="flex flex-col">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaqIdx === idx;
                  return (
                    <div key={idx} className="border-b border-[#E2E8F0] py-2">
                      <button onClick={() => toggleFaq(idx)} className="w-full flex justify-between items-center bg-transparent border-none py-3 px-1 text-[0.85rem] font-bold text-primary cursor-pointer text-left">
                        <span>{faq.q}</span>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      {isOpen && (
                        <div className="py-1 px-1 pb-3 text-[0.8rem] text-[#475569] leading-[1.5]">
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
              <div className="bg-[#FFFBEB] border-[1.5px] border-premium rounded-2xl p-6 text-center flex flex-col items-center gap-3">
                <h3 className="text-[1.1rem] font-extrabold text-primary m-0">Điểm cao không chờ đợi</h3>
                <p className="text-[0.8rem] text-text-muted m-0 max-w-[340px] leading-[1.4]">
                  Đăng ký ngay tài khoản Premium để đạt kết quả tốt nhất trong kỳ thi sắp tới.
                </p>
                <div className="flex gap-3 w-full justify-center flex-wrap mt-1">
                  <button
                    className="btn btn-premium vibrate h-[42px] text-[0.85rem] px-5 rounded-lg"
                    onClick={handleUpgrade}
                  >
                    <span>Nâng cấp Premium</span>
                  </button>
                  <button
                    className="btn btn-secondary h-[42px] text-[0.85rem] px-5 rounded-lg"
                    onClick={() => alert("Bạn đã ở trang so sánh các gói!")}
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
