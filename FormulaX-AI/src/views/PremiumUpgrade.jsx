import React, { useState, useEffect, lazy, Suspense } from "react";
import { Crown, Check, X, ShieldCheck, Heart, Sparkles, Smartphone, Landmark, Award, Target, Zap, ChevronDown, ChevronUp, Gem, Loader2, CheckCircle2, XCircle, Clock, FileDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { showToast } from "../components/Toast";

// three.js/@react-three/fiber/@react-three/drei chỉ tải khi người dùng thực sự mở trang
// Premium — lazy-load để không đội thêm bundle chính cho toàn app.
const PremiumGem3D = lazy(() => import("../components/PremiumGem3D"));

// Kiểm tra WebGL 1 lần khi module load — máy/trình duyệt không hỗ trợ thì không tải cả
// ~267KB chunk Three.js làm gì, dùng thẳng icon Crown tĩnh thay thế.
function detectWebGLSupport() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch {
    return false;
  }
}
const WEBGL_SUPPORTED = typeof window !== "undefined" && detectWebGLSupport();

// Bắt lỗi runtime nếu Canvas 3D crash vì lý do khác (driver GPU crash, context mất và
// không phục hồi được...) — không để cả banner Premium trắng xoá, rơi về icon tĩnh.
class Gem3DErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.error("[PremiumGem3D] Lỗi khi render, chuyển sang icon tĩnh:", error);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

const GEM_FALLBACK = (
  <div className="absolute inset-0 flex items-start justify-center pt-10">
    <Crown size={100} fill="#F59E0B" color="#F59E0B" />
  </div>
);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// Nguồn giá duy nhất — dùng chung cho banner hero và Gold card để không bao giờ lệch nhau.
// Khớp PLAN_CONFIG thật ở backend/lib/payos.js.
const PLAN_DISPLAY = {
  monthly: { price: "49.000 ₫", unit: "/tháng", label: "1 tháng" },
  "6months": { price: "249.000 ₫", unit: "/6 tháng", label: "6 tháng" },
};
const MONTHLY_PRICE = 49000;
const SIX_MONTH_PRICE = 249000;
const SIX_MONTH_SAVINGS_PERCENT = Math.round((1 - SIX_MONTH_PRICE / (MONTHLY_PRICE * 6)) * 100);

// Định dạng ngày hết hạn kiểu Việt Nam + số ngày còn lại — trả về null nếu chưa có dữ liệu
// (user chưa từng mua, hoặc premiumExpiry chưa tải xong).
function formatExpiry(premiumExpiry) {
  if (!premiumExpiry) return null;
  const expiryDate = new Date(premiumExpiry);
  if (Number.isNaN(expiryDate.getTime())) return null;
  const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / 86400000);
  const formatted = expiryDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  return { formatted, daysLeft };
}

export default function PremiumUpgrade({ isPremium, setIsPremium, premiumExpiry, setPremiumExpiry, setActiveTab }) {
  const { user } = useAuth();
  const [openFaqIdx, setOpenFaqIdx] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState(null); // { type: "success" | "error" | "pending", text }
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const expiryInfo = formatExpiry(premiumExpiry);

  // Xử lý khi PayOS redirect người dùng quay lại qua /api/payment/payos/return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    if (!paymentStatus) return;

    const cleanUrl = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      url.searchParams.delete("orderId");
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url.pathname + url.search);
    };

    if (paymentStatus === "failed") {
      setPaymentNotice({ type: "error", text: "Thanh toán không thành công hoặc đã bị hủy. Bạn có thể thử lại." });
      cleanUrl();
      return;
    }

    if (paymentStatus === "success") {
      if (!user?.googleId) {
        cleanUrl();
        return;
      }
      (async () => {
        // Kiểm tra trạng thái is_premium mới nhất từ Supabase — nguồn sự thật là webhook từ PayOS,
        // không tự setIsPremium(true) chỉ vì redirect về có payment=success.
        const { data, error } = await supabase
          .from("users")
          .select("is_premium, premium_expiry")
          .eq("google_id", user.googleId)
          .single();

        if (!error && data?.is_premium) {
          setIsPremium(true);
          setPremiumExpiry?.(data.premium_expiry);
          setPaymentNotice({ type: "success", text: "Thanh toán thành công! Tài khoản của bạn đã được nâng cấp lên Premium." });
        } else {
          setPaymentNotice({
            type: "pending",
            text: "Hệ thống đã ghi nhận giao dịch, đang cập nhật tài khoản Premium. Nếu sau vài phút vẫn chưa thấy cập nhật, hãy tải lại trang này.",
          });
        }
        cleanUrl();
      })();
    }
  }, [user?.googleId, setIsPremium, setPremiumExpiry]);

  const handleUpgrade = async (plan = "monthly") => {
    if (!user?.googleId) {
      showToast("Vui lòng đăng nhập trước khi nâng cấp Premium.", "error");
      return;
    }
    setIsProcessing(true);
    setPaymentNotice(null);
    // Timeout chủ động — nếu không, backend treo/mạng rớt sẽ khiến isProcessing kẹt true
    // mãi mãi, làm "đứng hình" cả 4 nút CTA Premium trên trang (đều dùng chung state này)
    // cho tới khi tải lại trang, không có thông báo lỗi nào cho người dùng biết.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payment/payos/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.googleId, plan }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Không tạo được giao dịch PayOS");
      }
      // Chuyển hướng sang cổng thanh toán PayOS thật — is_premium chỉ được set khi webhook xác nhận.
      window.location.href = data.checkoutUrl;
    } catch (err) {
      const isTimeout = err.name === "AbortError";
      setPaymentNotice({
        type: "error",
        text: isTimeout ? "Hết thời gian chờ kết nối cổng thanh toán PayOS. Vui lòng thử lại." : (err.message || "Không thể kết nối cổng thanh toán PayOS. Vui lòng thử lại sau."),
      });
      setIsProcessing(false);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleDowngrade = () => {
    setIsPremium(false);
    showToast("Đã chuyển tài khoản về phiên bản Free (thao tác cục bộ, không ảnh hưởng trạng thái thanh toán thật).", "info");
  };

  const toggleFaq = (idx) => {
    setOpenFaqIdx(openFaqIdx === idx ? null : idx);
  };

  const goals = [
    {
      icon: Target,
      title: "Hiểu sâu bản chất",
      desc: "Finder AI phân tích ngữ nghĩa, giải thích chi tiết ý nghĩa từng ký hiệu và ví dụ minh họa trực quan.",
      color: "secondary"
    },
    {
      icon: Zap,
      title: "Tối ưu hóa thời gian",
      desc: "Học tập thông minh hơn, rút ngắn 50% thời gian ôn luyện ghi nhớ công thức toán học phổ thông.",
      color: "premium"
    },
    {
      icon: Award,
      title: "Luyện đề không giới hạn",
      desc: "Ngân hàng đề thi trắc nghiệm phong phú, tự do tùy biến cấu trúc đề theo lớp và chủ đề ôn thi.",
      color: "success"
    },
    {
      icon: Heart,
      title: "Yêu thích & Lưu trữ",
      desc: "Lưu trữ toàn bộ công thức quan trọng, dễ dàng ôn tập lại bất cứ khi nào bạn cần mà không sợ thất lạc.",
      color: "error"
    },
    {
      icon: Sparkles,
      title: "Trợ lý Finder AI",
      desc: "Giải đáp chi tiết mọi thắc mắc toán học, hỗ trợ đắc lực trong suốt quá trình ôn thi của bạn.",
      color: "accent"
    },
    {
      icon: Smartphone,
      title: "Xuất PDF & Offline",
      desc: "Kết xuất flashcard ra file PDF/Ảnh chất lượng cao phục vụ in ấn học tập offline mọi lúc mọi nơi.",
      color: "secondary"
    }
  ];

  // Class literal đầy đủ cho từng màu — Tailwind JIT quét text tĩnh trong file, không quét
  // được chuỗi ghép động kiểu `bg-${color}/8`, nên phải khai báo sẵn từng cặp ở đây.
  const GOAL_COLOR_CLASSES = {
    secondary: "bg-secondary/8 text-secondary",
    premium: "bg-premium/8 text-premium",
    success: "bg-success/8 text-success",
    error: "bg-error/8 text-error",
    accent: "bg-accent/8 text-accent",
  };

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
      a: "Có, bạn hoàn toàn có thể hủy gia hạn gói Premium bất cứ lúc nào trong mục Cài đặt tài khoản mà không bị phạt hay tính thêm bất kỳ khoản phí ẩn nào.",
      icon: XCircle
    },
    {
      q: "Tài liệu PDF/Ảnh kết xuất ra có giới hạn số lượng không?",
      a: "Hoàn toàn không. Tài khoản Premium cho phép bạn xuất không giới hạn số lượng thẻ ghi nhớ cá nhân ra định dạng tệp PDF/Ảnh độ nét cao để ôn thi offline.",
      icon: FileDown
    },
    {
      q: "Trợ lý Finder AI hỗ trợ những môn học nào khác ngoài Toán không?",
      a: "Hiện tại FormulaX AI tối ưu hóa dữ liệu chuyên sâu cho chương trình Toán THPT (Đại số, Giải tích, Hình học, Xác suất). Các môn Vật lý và Hóa học dự kiến sẽ ra mắt trong quý sau.",
      icon: Sparkles
    },
    {
      q: "Cách thanh toán và nhận tài khoản Premium thế nào?",
      a: "Bạn thanh toán qua PayOS — hỗ trợ chuyển khoản ngân hàng và quét mã VietQR. Tài khoản sẽ được nâng cấp lên Premium ngay lập tức sau khi giao dịch hoàn tất.",
      icon: Landmark
    },
    {
      q: "Tôi có thể dùng chung tài khoản trên nhiều thiết bị không?",
      a: "Có, tài khoản Premium hỗ trợ đăng nhập và đồng bộ dữ liệu ôn tập trên 3 thiết bị cùng một lúc (Điện thoại, Máy tính bảng, Máy tính cá nhân).",
      icon: Smartphone
    }
  ];

  return (
    <div className="view-container">
      {/* Thanh CTA dính - phải nằm NGOÀI div overflow-hidden bên dưới, vì position:sticky
          không hoạt động nếu có tổ tiên nào đó overflow:hidden/auto/scroll (giới hạn CSS). */}
      {!isPremium && (
        <div className="sticky top-[65px] md:top-0 z-20 -mx-4 md:-mx-8 -mt-6 md:-mt-8 mb-6 flex items-center justify-between gap-3 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-sm border-b border-[rgba(30,58,95,0.07)] dark:border-[#334155] py-2.5 px-4 md:px-8 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 min-w-0">
            <Crown size={16} fill="#F59E0B" color="#F59E0B" className="shrink-0" />
            <span className="text-[0.8rem] font-bold text-primary dark:text-[#E2E8F0] truncate">Premium chỉ từ {PLAN_DISPLAY.monthly.price}{PLAN_DISPLAY.monthly.unit}</span>
          </div>
          <button
            onClick={() => handleUpgrade(selectedPlan)}
            disabled={isProcessing}
            className="btn btn-premium h-9 px-4 text-[0.8rem] shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <span>Nâng cấp</span>}
          </button>
        </div>
      )}

      <div className="relative overflow-hidden min-h-full bg-page-gradient dark:bg-[#0F172A] -mx-4 md:-mx-8 -mb-8 md:-mb-12 pt-6 md:pt-8 px-4 pb-8 md:pb-12">
        <div className="relative z-[1]">
          <div className="max-w-full md:max-w-full mx-auto flex flex-col gap-12">

            {/* Payment notice — hiện sau khi PayOS redirect người dùng quay lại */}
            {paymentNotice && (
              <div
                className={`flex items-center gap-2.5 py-3 px-4 rounded-xl text-[0.85rem] font-semibold ${
                  paymentNotice.type === "success"
                    ? "bg-success/10 text-success border border-success/20"
                    : paymentNotice.type === "pending"
                    ? "bg-premium/10 text-[#92400E] border border-premium/20"
                    : "bg-error/10 text-error border border-error/20"
                }`}
              >
                {paymentNotice.type === "success" ? (
                  <CheckCircle2 size={18} className="shrink-0" />
                ) : paymentNotice.type === "pending" ? (
                  <Clock size={18} className="shrink-0" />
                ) : (
                  <XCircle size={18} className="shrink-0" />
                )}
                <span>{paymentNotice.text}</span>
              </div>
            )}

            {/* Section 1: Hero Banner */}
            <div className="bg-[linear-gradient(135deg,#0f172a_0%,#1e3a5f_100%)] py-10 px-6 rounded-2xl text-center text-white relative shadow-[0_10px_30px_rgba(15,23,42,0.15)] overflow-hidden">
              {/* Lưới chấm mờ trang trí nền — thuần CSS, tạo chiều sâu cho hero, không ảnh hưởng nội dung */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.15]"
                style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "22px 22px" }}
              />

              {/* Viên đá 3D + sao trải kín — canvas full-bleed phủ trọn khung hero, không còn là
                  ô vuông nhỏ. Sparkles bên trong PremiumGem3D.jsx tự lo phần "đầy sao khắp khung". */}
              <div className="absolute inset-0 z-0">
                {WEBGL_SUPPORTED ? (
                  <Gem3DErrorBoundary fallback={GEM_FALLBACK}>
                    <Suspense fallback={GEM_FALLBACK}>
                      <PremiumGem3D />
                    </Suspense>
                  </Gem3DErrorBoundary>
                ) : (
                  GEM_FALLBACK
                )}
              </div>

              {/* pointer-events-none để chuột "xuyên" xuống canvas 3D bên dưới (kéo xoay viên
                  đá) — chỉ bật lại pointer-events-auto cho từng nút thật cần bấm được. */}
              <div className="relative z-[1] pointer-events-none">
              <div className="mb-3">
                <span className="bg-premium/15 text-premium text-xs font-bold py-1 px-3 rounded-[20px]">
                  {isPremium ? "THÀNH VIÊN PREMIUM" : "CHƯƠNG TRÌNH KHUYÊN DÙNG"}
                </span>
              </div>

              {/* Chỗ trống giữ đúng nhịp bố cục cũ — viên đá thật render ở lớp nền phía sau (canvas full-bleed) */}
              <div style={{ height: 260 }} aria-hidden="true" />

              {isPremium ? (
                <h1 className="text-[1.5rem] font-extrabold text-white mb-2">
                  Bạn đang là{" "}
                  <span className="bg-[linear-gradient(90deg,#FCD34D_0%,#D97706_100%)] bg-clip-text text-transparent">Premium</span>
                  !
                </h1>
              ) : (
                <h1 className="text-[1.5rem] font-extrabold text-white mb-2">
                  Mở khóa toàn bộ sức mạnh{" "}
                  <span className="bg-[linear-gradient(90deg,#FCD34D_0%,#D97706_100%)] bg-clip-text text-transparent">FormulaX AI</span>
                </h1>
              )}

              {/* Trạng thái gói — chỉ hiện khi đã là Premium và biết ngày hết hạn */}
              {isPremium && expiryInfo && (
                <div
                  className={`inline-flex items-center gap-2 mx-auto mb-4 py-2 px-4 rounded-xl text-[0.8rem] font-bold ${
                    expiryInfo.daysLeft <= 7 ? "bg-premium/15 text-premium" : "bg-success/15 text-success"
                  }`}
                >
                  <Clock size={15} className="shrink-0" />
                  <span>
                    {expiryInfo.daysLeft > 0
                      ? `Còn hiệu lực đến ${expiryInfo.formatted} (còn ${expiryInfo.daysLeft} ngày)`
                      : `Đã hết hạn từ ${expiryInfo.formatted}`}
                  </span>
                </div>
              )}

              {/* Plan selector — user Premium cũng dùng để gia hạn thêm (thời gian cộng dồn vào hạn hiện có) */}
              <div className="flex items-stretch justify-center gap-2.5 my-4 max-w-[420px] mx-auto">
                {["monthly", "6months"].map((planId) => {
                  const isSelected = selectedPlan === planId;
                  return (
                    <button
                      key={planId}
                      type="button"
                      onClick={() => setSelectedPlan(planId)}
                      className={`relative flex-1 rounded-xl py-2.5 px-3 text-left border-[1.5px] transition-all duration-200 cursor-pointer pointer-events-auto ${
                        isSelected
                          ? "border-premium bg-premium/10"
                          : "border-white/15 bg-white/5 hover:border-white/30"
                      }`}
                    >
                      {planId === "6months" && (
                        <span className="absolute -top-2 right-2 bg-success text-white text-[0.62rem] font-extrabold py-0.5 px-1.5 rounded-full">
                          Tiết kiệm {SIX_MONTH_SAVINGS_PERCENT}%
                        </span>
                      )}
                      <div className="text-[0.72rem] font-bold text-[#CBD5E1] uppercase tracking-[0.03em]">{PLAN_DISPLAY[planId].label}</div>
                      <div className="text-[1.05rem] font-extrabold text-white">
                        {PLAN_DISPLAY[planId].price}
                        <span className="text-[0.68rem] font-semibold text-[#94A3B8] ml-1">{PLAN_DISPLAY[planId].unit}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-[0.85rem] text-[#CBD5E1] max-w-[480px] mx-auto mb-5 leading-[1.5]">
                {isPremium
                  ? "Cảm ơn bạn đã đồng hành cùng FormulaX AI! Gia hạn sớm để việc ôn tập không bị gián đoạn."
                  : "Đột phá điểm số môn Toán THPT Quốc gia cùng lộ trình ôn tập công thức thông minh bậc nhất và trợ lý giải toán AI đắc lực."}
              </p>

              <button
                className="btn btn-premium vibrate w-full max-w-[300px] h-[46px] text-[0.95rem] rounded-lg disabled:opacity-60 disabled:cursor-not-allowed pointer-events-auto"
                onClick={() => handleUpgrade(selectedPlan)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <span>{isPremium ? "Gia hạn ngay" : "Nâng cấp Pro ngay"}</span>
                    <Crown size={14} fill="white" />
                  </>
                )}
              </button>

              {/* Giả lập hạ cấp — công cụ test nội bộ, để nhỏ/phụ để không lẫn với luồng thanh toán thật */}
              {isPremium && (
                <button
                  className="block mx-auto mt-3 bg-transparent border-none text-[0.72rem] text-[#94A3B8] underline cursor-pointer pointer-events-auto"
                  onClick={handleDowngrade}
                >
                  Trở về gói Free (giả lập — chỉ để test)
                </button>
              )}
              </div>
            </div>

            {/* Section 3: Goals Grid */}
            <div>
              <div className="text-center mb-6">
                <h2 className="text-[1.25rem] font-extrabold text-primary dark:text-[#E2E8F0] m-0">
                  Mọi thứ bạn cần để đạt điểm cao
                </h2>
                <p className="text-[0.8rem] text-text-muted dark:text-[#94A3B8] mt-1">Đầy đủ tính năng hỗ trợ thi THPT Quốc gia tốt nhất</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {goals.map((goal, idx) => {
                  const GoalIcon = goal.icon;
                  return (
                    <div key={idx} className="glass-card dark:bg-[#1E293B] dark:border-[#334155] flex gap-3 p-4 transition-transform duration-300 [transform-style:preserve-3d] hover:[transform:perspective(700px)_rotateX(3deg)_rotateY(-3deg)_translateY(-2px)]">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${GOAL_COLOR_CLASSES[goal.color]}`}>
                        <GoalIcon size={18} />
                      </div>
                      <div>
                        <h3 className="text-[0.9rem] font-extrabold text-primary dark:text-[#E2E8F0] mb-1">{goal.title}</h3>
                        <p className="text-xs text-text-muted dark:text-[#94A3B8] m-0 leading-[1.4]">{goal.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Detailed Compare Table */}
            <div>
              <div className="text-center mb-5">
                <h2 className="text-[1.3rem] font-extrabold text-primary dark:text-[#E2E8F0] m-0">
                  So sánh các gói học tập
                </h2>
                <p className="text-[0.8rem] text-text-muted dark:text-[#94A3B8] mt-1">
                  Lựa chọn thông minh để bứt phá điểm số tối đa
                </p>
              </div>

              <div className="glass-card dark:bg-[#1E293B] dark:border-[#334155] overflow-x-auto">
                <table className="w-full border-collapse text-[0.85rem] text-left">
                  <thead>
                    <tr>
                      <th className="text-left py-4 px-5 font-extrabold text-primary dark:text-[#E2E8F0] border-b-2 border-[#f1f5f9] dark:border-[#334155] text-[0.9rem]">Tính năng</th>
                      <th className="text-center py-4 px-5 font-extrabold text-primary dark:text-[#E2E8F0] border-b-2 border-[#f1f5f9] dark:border-[#334155] text-[0.9rem]">Bản Free</th>
                      <th className="text-center py-4 px-5 font-black text-[#d97706] bg-premium/4 border-b-2 border-premium/15 text-[0.9rem]">
                        <span className="inline-flex flex-col items-center gap-1">
                          <span className="text-[0.6rem] font-extrabold text-white bg-accent py-0.5 px-2 rounded-full tracking-wide">ĐƯỢC CHỌN NHIỀU NHẤT</span>
                          <span>Bản Pro</span>
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feat, idx) => (
                      <tr key={idx} className="hover:bg-[#f8fafc] dark:hover:bg-white/5 last:[&>td]:border-b-0">
                        <td className="text-left py-4 px-5 border-b border-[#f1f5f9] dark:border-[#334155] align-middle leading-[1.5] font-bold text-primary dark:text-[#E2E8F0] text-[0.85rem]">{feat.name}</td>
                        <td className="text-center py-4 px-5 border-b border-[#f1f5f9] dark:border-[#334155] align-middle leading-[1.5]">
                          {feat.free === "Khóa" ? (
                            <div className="inline-flex items-center justify-center bg-error/8 text-error w-6 h-6 rounded-full mx-auto">
                              <X size={12} />
                            </div>
                          ) : (
                            <span className="text-text-muted dark:text-[#94A3B8] font-medium">{feat.free}</span>
                          )}
                        </td>
                        <td className="text-center py-4 px-5 border-b border-[#f1f5f9] dark:border-[#334155] align-middle leading-[1.5] bg-premium/[0.015] font-bold text-primary dark:text-[#E2E8F0]">
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

                <div className="border-2 border-premium rounded-[20px] p-6 max-w-[400px] w-full bg-white dark:bg-[#1E293B] shadow-[0_2px_6px_rgba(15,23,42,0.05)] transition-transform duration-300 [transform-style:preserve-3d] hover:[transform:perspective(800px)_rotateX(2deg)_translateY(-3px)]">
                  <div className="text-center mb-4">
                    <Crown size={28} fill="#F59E0B" color="#F59E0B" className="mx-auto mb-1.5" />
                    <h3 className="text-[1.1rem] font-extrabold text-primary dark:text-[#E2E8F0] m-0">Premium {PLAN_DISPLAY[selectedPlan].label}</h3>
                    <p className="text-xs text-text-muted dark:text-[#94A3B8] mt-0.5 mb-0">Gói tài khoản ưu việt nhất</p>
                    <h3 className="text-[1.8rem] font-extrabold text-premium mt-2.5 mb-0">{PLAN_DISPLAY[selectedPlan].price}</h3>
                    <span className="text-[0.7rem] text-text-muted dark:text-[#94A3B8] font-semibold">{PLAN_DISPLAY[selectedPlan].unit}</span>
                  </div>

                  <div className="h-px bg-[#E2E8F0] dark:bg-[#334155] my-4" />

                  <div className="flex flex-col gap-2.5 mb-5">
                    <div className="flex items-center gap-2 text-[0.8rem] text-[#334155] dark:text-[#CBD5E1]">
                      <Check size={14} className="text-success shrink-0" />
                      <span>Tra cứu & Giải toán Finder AI không giới hạn</span>
                    </div>
                    <div className="flex items-center gap-2 text-[0.8rem] text-[#334155] dark:text-[#CBD5E1]">
                      <Check size={14} className="text-success shrink-0" />
                      <span>Mở khóa toàn bộ ngân hàng câu hỏi trắc nghiệm tự điền</span>
                    </div>
                    <div className="flex items-center gap-2 text-[0.8rem] text-[#334155] dark:text-[#CBD5E1]">
                      <Check size={14} className="text-success shrink-0" />
                      <span>Không có quảng cáo & ưu tiên máy chủ AI tốc độ cao</span>
                    </div>
                    <div className="flex items-center gap-2 text-[0.8rem] text-[#334155] dark:text-[#CBD5E1]">
                      <Check size={14} className="text-success shrink-0" />
                      <span>Xuất PDF/Ảnh Flashcard chất lượng cao ôn offline</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-premium vibrate w-full h-11 text-[0.9rem] rounded-lg border-none disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => handleUpgrade(selectedPlan)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <span>Thanh toán qua PayOS</span>}
                  </button>
                </div>
              </div>
            )}

            {/* Section 6: Thanh toán qua PayOS */}
            <div className="text-center">
              <div className="text-xs text-text-muted dark:text-[#94A3B8] font-bold uppercase tracking-[0.5px] mb-3">
                Thanh toán an toàn qua
              </div>
              <button
                type="button"
                onClick={() => handleUpgrade(selectedPlan)}
                disabled={isProcessing}
                className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer mx-auto disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="w-11 h-11 rounded-full bg-[#0F172A] flex items-center justify-center text-white">
                  <Landmark size={20} />
                </div>
                <span className="text-[0.7rem] text-text-muted dark:text-[#94A3B8] font-semibold">PayOS · Chuyển khoản & VietQR</span>
              </button>
              <div className="flex items-center justify-center gap-1.5 mt-2.5 text-[0.7rem] text-text-muted dark:text-[#94A3B8]">
                <ShieldCheck size={13} className="shrink-0 text-success" />
                <span>Thông tin thanh toán được mã hóa và bảo mật</span>
              </div>
            </div>

            {/* Section 7: FAQs Accordion */}
            <div>
              <h2 className="text-[1.15rem] font-extrabold text-primary dark:text-[#E2E8F0] flex items-center justify-center gap-2 mb-2">Câu hỏi thường gặp</h2>
              <div className="flex flex-col">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaqIdx === idx;
                  const FaqIcon = faq.icon;
                  return (
                    <div key={idx} className="border-b border-[#E2E8F0] dark:border-[#334155] py-2">
                      <button onClick={() => toggleFaq(idx)} className="w-full flex justify-between items-center gap-3 bg-transparent border-none py-3 px-1 text-[0.85rem] font-bold text-primary dark:text-[#E2E8F0] cursor-pointer text-left">
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-accent/8 text-accent flex items-center justify-center shrink-0">
                            <FaqIcon size={14} />
                          </span>
                          <span>{faq.q}</span>
                        </span>
                        {isOpen ? <ChevronUp size={16} className="shrink-0" /> : <ChevronDown size={16} className="shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="py-1 pl-[38px] pr-1 pb-3 text-[0.8rem] text-[#475569] dark:text-[#94A3B8] leading-[1.5]">
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
                    className="btn btn-premium vibrate h-[42px] text-[0.85rem] px-5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => handleUpgrade(selectedPlan)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <span>Nâng cấp Premium</span>}
                  </button>
                  <button
                    className="btn btn-secondary h-[42px] text-[0.85rem] px-5 rounded-lg"
                    onClick={() => showToast("Bạn đã ở trang so sánh các gói!", "info")}
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
