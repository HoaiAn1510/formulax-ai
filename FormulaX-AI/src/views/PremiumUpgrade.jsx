import { useState, useEffect } from "react";
import { Crown, Check, X, ShieldCheck, Smartphone, Landmark, Award, Target, Zap, ChevronDown, ChevronUp, Gem, Loader2, CheckCircle2, XCircle, Clock, FileDown, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useGuestGate } from "../utils/useGuestGate";
import { supabase, checkPremiumStatus } from "../lib/supabase";
import { showToast } from "../components/Toast";
import PageShell from "../components/PageShell";
import MimiMascot from "../components/MimiMascot";

// Tiêu đề từng phần của trang — canh trái như các trang khác (trước đây canh giữa, chữ đậm hơn).
function SectionTitle({ title, sub }) {
  return (
    <div className="mb-4 md:mb-5">
      <h2 className="m-0 text-[1.1rem] md:text-[1.25rem] font-bold tracking-[-0.01em] text-primary dark:text-[#E2E8F0]">{title}</h2>
      {sub && <p className="m-0 mt-1 text-[0.82rem] text-text-muted dark:text-[#94A3B8]">{sub}</p>}
    </div>
  );
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// Sau khi PayOS trả về payment=success: kiểm tra lại trạng thái Premium mỗi 3 giây, tối đa 10 lần
// (khoảng 30 giây) chờ webhook, rồi mới báo "đang cập nhật".
const PAYMENT_RECHECK_MS = 3000;
const PAYMENT_RECHECK_MAX = 10;

// Nguồn giá duy nhất — dùng chung cho banner hero và Gold card để không bao giờ lệch nhau.
// Khớp PLAN_CONFIG thật ở backend/lib/payos.js.
const PLAN_DISPLAY = {
  monthly: { price: "49.000 ₫", unit: "/tháng", label: "1 tháng" },
  "6months": { price: "249.000 ₫", unit: "/6 tháng", label: "6 tháng" },
};
const MONTHLY_PRICE = 49000;
const SIX_MONTH_PRICE = 249000;
const SIX_MONTH_SAVINGS_PERCENT = Math.round((1 - SIX_MONTH_PRICE / (MONTHLY_PRICE * 6)) * 100);

// Dữ liệu tĩnh, không phụ thuộc props/state — đặt ở module scope để (1) không tạo lại mảng
// mỗi lần render, (2) dùng làm dependency ổn định cho effect bơm JSON-LD FAQPage bên dưới.
const FAQS = [
  {
    q: "Gói Premium có tự động gia hạn không?",
    a: "FormulaX không tự động gia hạn: bạn chỉ trả khi tự mua gói. Hết hạn, tài khoản về gói Free và dữ liệu học tập được giữ nguyên.",
    icon: XCircle
  },
  {
    q: "Xuất PDF bộ thẻ có giới hạn số lượng không?",
    a: "Không. Tài khoản Premium xuất được mọi bộ thẻ của bạn ra trang in, rồi lưu thành PDF bằng chức năng in của trình duyệt.",
    icon: FileDown
  },
  {
    q: "Cách thanh toán và nhận tài khoản Premium thế nào?",
    a: "Bạn thanh toán qua payOS — chuyển khoản ngân hàng hoặc quét mã VietQR. Premium được bật sau khi hệ thống nhận xác nhận từ payOS, thường trong vài phút. Nếu chậm, tải lại trang hoặc liên hệ formulaxadmin@gmail.com.",
    icon: Landmark
  }
];

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
  // Khách xem được bảng giá nhưng không tạo được đơn: backend (/payos/create) vốn đã từ chối
  // token không có Google identity; ở đây chặn sớm để hiện hộp thoại mời đăng nhập thay vì lỗi 401.
  const { isGuest, promptLogin } = useGuestGate();
  const [openFaqIdx, setOpenFaqIdx] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState(null); // { type: "success" | "error" | "pending" | "checking", text }
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const expiryInfo = formatExpiry(premiumExpiry);

  // Kết quả PayOS trả về qua /api/payment/payos/return → /?payment=success|failed (App.jsx mở thẳng
  // trang này khi URL có tham số đó). Đọc MỘT lần lúc khởi tạo: effect bên dưới xoá tham số khỏi URL
  // ngay, và StrictMode (dev) chạy effect hai lần — lần sau vẫn phải biết kết quả.
  const [paymentReturn] = useState(() => new URLSearchParams(window.location.search).get("payment"));

  useEffect(() => {
    if (!paymentReturn) return;

    // Xoá tham số ngay để tải lại trang không hiện lại thông báo.
    const url = new URL(window.location.href);
    ["payment", "orderId", "message"].forEach((k) => url.searchParams.delete(k));
    window.history.replaceState({}, "", url.pathname + url.search);

    if (paymentReturn === "failed") {
      setPaymentNotice({ type: "error", text: "Thanh toán không thành công hoặc đã bị hủy. Bạn có thể thử lại." });
      return;
    }
    if (paymentReturn !== "success" || !user?.googleId) return;

    // Nguồn sự thật là webhook PayOS ghi bảng users — không tự bật Premium chỉ vì có payment=success.
    // Webhook có thể về sau người dùng vài giây: kiểm tra ngay, rồi lại mỗi 3 giây (tối đa 10 lần)
    // trước khi báo "đang cập nhật".
    let cancelled = false;
    let timer = null;
    let rechecks = 0;
    setPaymentNotice({ type: "checking", text: "Đang xác nhận thanh toán với payOS…" });
    const check = async () => {
      const result = await checkPremiumStatus(user.googleId).catch(() => null);
      if (cancelled) return;
      if (result?.isPremium) {
        setIsPremium(true);
        setPremiumExpiry?.(result.premiumExpiry);
        setPaymentNotice({ type: "success", text: "Thanh toán thành công! Tài khoản của bạn đã được nâng cấp lên Premium." });
        return;
      }
      if (rechecks >= PAYMENT_RECHECK_MAX) {
        setPaymentNotice({
          type: "pending",
          text: "Hệ thống đã ghi nhận giao dịch, đang cập nhật tài khoản Premium. Nếu sau vài phút vẫn chưa thấy cập nhật, hãy tải lại trang này.",
        });
        return;
      }
      rechecks++;
      timer = setTimeout(check, PAYMENT_RECHECK_MS);
    };
    check();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [paymentReturn, user?.googleId, setIsPremium, setPremiumExpiry]);

  const handleUpgrade = async (plan = "monthly") => {
    if (isGuest) {
      promptLogin("Đăng nhập Google để nâng cấp Premium. Chế độ khách không tạo được đơn thanh toán.");
      return;
    }
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
      // Lấy Supabase access token từ phiên đăng nhập hiện tại để backend có thể xác minh
      // danh tính (verify JWT → lấy Google sub, đối chiếu với userId gửi lên).
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
      }

      const res = await fetch(`${BACKEND_URL}/api/payment/payos/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
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

  // Rút còn 4 lý do mạnh nhất, mỗi lý do phủ 1 giá trị riêng biệt (AI chuyên sâu, thời gian,
  // khối lượng luyện đề, offline) — tránh trùng lặp như "Trợ lý Finder AI" với "Hiểu sâu bản
  // chất" (cùng nói về Finder AI) hay "Yêu thích & Lưu trữ" (giá trị chung chung, không đặc thù Premium).
  const goals = [
    {
      icon: Target,
      title: "Hiểu sâu bản chất",
      desc: "Finder AI chỉ ra công thức phù hợp trong thư viện và hướng dẫn từng bước để bạn tự giải — Premium hỏi không giới hạn lượt.",
      color: "secondary"
    },
    {
      icon: Zap,
      title: "Tối ưu hóa thời gian",
      desc: "Ôn đúng chỗ yếu: trang Tiến độ chỉ ra chủ đề dưới 60% đúng và gợi ý công thức cần xem lại.",
      color: "premium"
    },
    {
      icon: Award,
      title: "Luyện đề không giới hạn",
      desc: "Làm Quiz không giới hạn lượt mỗi ngày, thêm dạng Điền đáp án và Kết hợp; tự chọn chủ đề, lớp, số câu và thời gian.",
      color: "success"
    },
    {
      icon: Smartphone,
      title: "Xuất PDF & Offline",
      desc: "Xuất bộ thẻ Flashcard (tên, công thức, giải thích) ra trang in và lưu thành PDF để ôn ngoài ứng dụng.",
      color: "error"
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

  // free === "Khóa" hiện dấu ✗, premium === "Mở" hiện dấu ✓.
  const features = [
    { name: "Luyện đề trắc nghiệm", free: "Quiz: 10 lượt/ngày", premium: "Quiz: không giới hạn" },
    { name: "Trợ lý AI Finder", free: "10 lượt hỏi mỗi ngày", premium: "Không giới hạn lượt hỏi" },
    { name: "Quét ảnh đề bài", free: "5 lần/ngày", premium: "50 lần/ngày" },
    { name: "Quiz Điền đáp án, Kết hợp", free: "Khóa", premium: "Mở" },
    { name: "Trang Tiến độ: Hiệu suất theo chủ đề, Coach", free: "Khóa", premium: "Mở" },
    { name: "Xuất bộ thẻ Flashcard ra PDF", free: "Khóa", premium: "Mở" }
  ];

  // Bơm JSON-LD FAQPage vào <head> khi mở trang Premium — giúp Google có thể hiện thẳng
  // câu hỏi/trả lời trong kết quả tìm kiếm (rich snippet), không đổi giao diện gì cả. Dọn
  // lại script khi rời trang để không tích script trùng nếu người dùng quay lại nhiều lần.
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a }
      }))
    });
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, []);

  return (
    <PageShell
      width="wide"
      title="Premium"
      description="Hỏi AI không giới hạn, luyện đề đủ dạng và xem phân tích tiến độ chi tiết."
      top={(<>
      {/* Thanh CTA dính - phải nằm NGOÀI div overflow-hidden bên dưới, vì position:sticky
          không hoạt động nếu có tổ tiên nào đó overflow:hidden/auto/scroll (giới hạn CSS). */}
      {!isPremium && (
        <div className="sticky top-[65px] md:top-0 z-20 -mx-4 md:-mx-8 -mt-6 md:-mt-8 mb-6 flex items-center justify-between gap-3 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-sm border-b border-line dark:border-[#334155] py-2.5 px-4 md:px-8">
          <div className="flex items-center gap-2 min-w-0">
            <Crown size={16} fill="#F59E0B" color="#F59E0B" className="shrink-0" />
            <span className="text-[0.8rem] font-bold text-primary dark:text-[#E2E8F0] truncate">Premium chỉ từ {PLAN_DISPLAY.monthly.price}{PLAN_DISPLAY.monthly.unit}</span>
          </div>
          <button
            onClick={() => handleUpgrade(selectedPlan)}
            disabled={isProcessing}
            className="btn btn-premium h-9 px-4 text-[0.8rem] shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <>{isGuest && <Lock size={13} />}<span>Nâng cấp</span></>}
          </button>
        </div>
      )}

      </>)}>
          <div className="max-w-full md:max-w-full mx-auto flex flex-col gap-8 md:gap-10">

            {/* Payment notice — hiện sau khi PayOS redirect người dùng quay lại */}
            {paymentNotice && (
              <div
                role="status"
                className={`flex items-center gap-2.5 py-3 px-4 rounded-xl text-[0.85rem] font-semibold ${paymentNotice.type === "success"
                    ? "bg-success/10 text-success border border-success/20"
                    : paymentNotice.type === "pending" || paymentNotice.type === "checking"
                      ? "bg-premium/10 text-[#92400E] border border-premium/20"
                      : "bg-error/10 text-error border border-error/20"
                  }`}
              >
                {paymentNotice.type === "success" ? (
                  <CheckCircle2 size={18} className="shrink-0" />
                ) : paymentNotice.type === "checking" ? (
                  <Loader2 size={18} className="shrink-0 animate-spin" />
                ) : paymentNotice.type === "pending" ? (
                  <Clock size={18} className="shrink-0" />
                ) : (
                  <XCircle size={18} className="shrink-0" />
                )}
                <span>{paymentNotice.text}</span>
              </div>
            )}

            {/* Section 1: Hero — MỘT khung (chủ dự án chốt 2026-11-02, trước đó chia đôi với ô navy): nền amber nhạt như
                khung lời chào Dashboard, chữ + chọn gói bên trái, Mimi đội vương miện ló lên ở góc dưới bên phải.
                Điện thoại: Mimi nhỏ ngồi trên mép trên của khung (giống Dashboard). */}
            <div className="relative mt-[56px] lg:mt-0 fx-card bg-hero-amber dark:bg-none dark:bg-[#1E293B] dark:border-[#78350F]/60 dark:shadow-none flex">
              <MimiMascot crown width={140} className="lg:hidden absolute right-2 -top-[70px] pointer-events-none" />
              {/* Màn rộng (xl): phần chữ chia 2 cột — lời chào + hạn dùng | chọn gói + nút — cho đỡ trống giữa khung. */}
              <div className="flex-1 min-w-0 p-6 md:p-10 grid grid-cols-1 xl:grid-cols-2 xl:gap-10 xl:items-center">
                <div className="flex flex-col min-w-0">
                <span className="self-start text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-[#B45309] dark:text-[#FCD34D] bg-white/70 dark:bg-accent/15 border border-[#F1E3BF] dark:border-accent/30 rounded-full py-1 px-3">
                  {isPremium ? "Thành viên Premium" : "Chương trình khuyên dùng"}
                </span>

                {isPremium ? (
                  <h2 className="mt-4 mb-0 text-[1.6rem] md:text-[2.1rem] leading-[1.2] font-bold tracking-[-0.03em] text-primary dark:text-[#E2E8F0]">
                    Bạn đang là <span className="text-accent dark:text-[#FCD34D]">Premium</span>!
                  </h2>
                ) : (
                  <h2 className="mt-4 mb-0 text-[1.6rem] md:text-[2.1rem] leading-[1.2] font-bold tracking-[-0.03em] text-primary dark:text-[#E2E8F0]">
                    Mở khóa toàn bộ sức mạnh <span className="text-accent dark:text-[#FCD34D]">FormulaX AI</span>
                  </h2>
                )}

                <p className="m-0 mt-2.5 text-[0.88rem] md:text-[0.95rem] text-text-muted dark:text-[#94A3B8] leading-[1.6] max-w-[520px]">
                  {isPremium
                    ? "Cảm ơn bạn đã đồng hành cùng FormulaX AI! Gia hạn sớm để việc ôn tập không bị gián đoạn."
                    : "Đột phá điểm số môn Toán THPT Quốc gia cùng lộ trình ôn tập công thức thông minh bậc nhất và trợ lý AI hướng dẫn cách giải."}
                </p>

                {/* Trạng thái gói — chỉ hiện khi đã là Premium và biết ngày hết hạn */}
                {isPremium && expiryInfo && (
                  <div
                    className={`self-start inline-flex items-center gap-2 mt-4 py-2 px-3.5 rounded-[12px] text-[0.8rem] font-semibold border ${expiryInfo.daysLeft <= 7
                        ? "bg-accent-light/70 text-[#92400E] border-[#F1E3BF] dark:bg-accent/15 dark:text-[#FCD34D] dark:border-accent/30"
                        : "bg-[#DCFCE7]/70 text-[#047857] border-[#BBF7D0] dark:bg-success/15 dark:text-[#6EE7B7] dark:border-success/30"
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

                </div>

                <div className="flex flex-col min-w-0">
                {/* Plan selector — user Premium cũng dùng để gia hạn thêm (thời gian cộng dồn vào hạn hiện có) */}
                <div className="grid grid-cols-2 gap-2.5 md:gap-3 mt-6 xl:mt-0 max-w-[560px]">
                  {["monthly", "6months"].map((planId) => {
                    const isSelected = selectedPlan === planId;
                    return (
                      <button
                        key={planId}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedPlan(planId)}
                        className={`relative rounded-[14px] py-3 px-3.5 text-left border-[1.5px] transition-colors duration-200 cursor-pointer ${isSelected
                            ? "border-accent bg-white dark:bg-[#0F172A] shadow-[0_8px_20px_-12px_rgba(217,119,6,0.6)]"
                            : "border-line bg-white/70 dark:border-[#334155] dark:bg-[#0F172A]/60 hover:border-[#F1E3BF]"
                          }`}
                      >
                        {planId === "6months" && (
                          <span className="absolute -top-2.5 right-2.5 bg-success text-white text-[0.62rem] font-bold py-0.5 px-2 rounded-full">
                            Tiết kiệm {SIX_MONTH_SAVINGS_PERCENT}%
                          </span>
                        )}
                        <div className="text-[0.68rem] font-semibold tracking-[0.06em] text-text-muted dark:text-[#94A3B8] uppercase">{PLAN_DISPLAY[planId].label}</div>
                        <div className="mt-0.5 text-[1.05rem] md:text-[1.15rem] font-bold text-primary dark:text-[#E2E8F0]">
                          <span className="whitespace-nowrap">{PLAN_DISPLAY[planId].price}</span>
                          {/* Điện thoại: đơn vị xuống dòng riêng — trước đây "49.000 đ /tháng" bị ngắt giữa số và "đ". */}
                          <span className="block sm:inline text-[0.7rem] font-medium text-text-muted dark:text-[#94A3B8] sm:ml-1">{PLAN_DISPLAY[planId].unit}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  className="btn btn-premium vibrate mt-5 w-full max-w-[560px] h-[48px] text-[0.95rem] rounded-[13px] disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => handleUpgrade(selectedPlan)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      {isGuest && <Lock size={14} />}
                      <span>{isPremium ? "Gia hạn ngay" : "Nâng cấp Pro ngay"}</span>
                      <Crown size={14} fill="white" />
                    </>
                  )}
                </button>

                {/* Dòng tin cậy thanh toán đặt ngay dưới nút (trước đây là một phần riêng giữa trang). */}
                <div className="mt-3 flex items-center gap-1.5 text-[0.75rem] text-text-muted dark:text-[#94A3B8]">
                  <ShieldCheck size={14} className="shrink-0 text-success" />
                  <span>Thanh toán an toàn qua PayOS · Chuyển khoản & VietQR</span>
                </div>

                {/* Giả lập hạ cấp — công cụ test nội bộ, chỉ có ở `npm run dev`; bản build production
                    loại hẳn nút này (import.meta.env.DEV = false), người dùng thật không thấy. */}
                {import.meta.env.DEV && isPremium && (
                  <button
                    className="self-start mt-3 bg-transparent border-none p-0 text-[0.72rem] text-text-muted dark:text-[#94A3B8] underline cursor-pointer"
                    onClick={handleDowngrade}
                  >
                    Trở về gói Free (giả lập — chỉ để test)
                  </button>
                )}
                </div>
              </div>

              {/* Máy tính: Mimi lớn sát mép dưới, quầng vàng phía sau. Đáy hình Mimi phẳng nên đặt sát mép để trông như ló lên. */}
              <div className="hidden lg:flex relative w-[34%] xl:w-[28%] shrink-0 items-end justify-center overflow-hidden rounded-r-[18px] pt-10">
                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/3 w-[440px] h-[440px] rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.38)_0%,rgba(251,191,36,0)_62%)] pointer-events-none" />
                <MimiMascot crown width={340} className="relative block max-w-[92%] h-auto -mb-px" />
              </div>
            </div>

            {/* Section 3: Goals Grid */}
            <div>
              <SectionTitle
                title={isPremium ? "Quyền lợi Premium của bạn" : "Mọi thứ bạn cần để đạt điểm cao"}
                sub={isPremium ? "Bạn đang dùng đầy đủ các tính năng dưới đây" : "Đầy đủ tính năng hỗ trợ thi THPT Quốc gia tốt nhất"}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
                {goals.map((goal, idx) => {
                  const GoalIcon = goal.icon;
                  return (
                    <div key={idx} className="fx-card dark:bg-[#1E293B] dark:border-[#334155] dark:shadow-none flex flex-col gap-3 p-5 transition-transform duration-200 hover:-translate-y-0.5">
                      <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${GOAL_COLOR_CLASSES[goal.color]}`}>
                        <GoalIcon size={18} />
                      </div>
                      <div>
                        <h3 className="text-[0.95rem] font-bold text-primary dark:text-[#E2E8F0] mb-1">{goal.title}</h3>
                        <p className="text-[0.78rem] text-text-muted dark:text-[#94A3B8] m-0 leading-[1.5]">{goal.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Detailed Compare Table — chỉ cho tài khoản chưa Premium (Premium đã có đủ quyền lợi ở phần trên) */}
            {!isPremium && (<div>
              <SectionTitle title="So sánh các gói học tập" sub="Lựa chọn thông minh để bứt phá điểm số tối đa" />

              {/* Desktop: bảng đầy đủ. Mobile: bảng cuộn ngang khó đọc — thay bằng thẻ xếp dọc bên dưới. */}
              <div className="hidden md:block fx-card dark:bg-[#1E293B] dark:border-[#334155] dark:shadow-none overflow-x-auto">
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
                          {feat.premium === "Mở" ? (
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

              <div className="md:hidden flex flex-col gap-3">
                {features.map((feat, idx) => (
                  <div key={idx} className="fx-card dark:bg-[#1E293B] dark:border-[#334155] dark:shadow-none p-4 flex flex-col gap-3">
                    <div className="font-bold text-primary dark:text-[#E2E8F0] text-[0.9rem]">{feat.name}</div>
                    <div className="flex gap-2.5">
                      <div className="flex-1 rounded-lg bg-[#f8fafc] dark:bg-[#0F172A]/40 p-2.5">
                        <div className="text-[0.62rem] font-extrabold text-text-muted dark:text-[#94A3B8] uppercase tracking-wide mb-1">Bản Free</div>
                        {feat.free === "Khóa" ? (
                          <div className="flex items-center gap-1.5 text-error font-bold text-[0.8rem]">
                            <X size={13} /> <span>Khóa</span>
                          </div>
                        ) : (
                          <div className="text-text-muted dark:text-[#94A3B8] font-medium text-[0.8rem]">{feat.free}</div>
                        )}
                      </div>
                      <div className="flex-1 rounded-lg bg-premium/8 border border-premium/20 p-2.5">
                        <div className="text-[0.62rem] font-extrabold text-[#D97706] uppercase tracking-wide mb-1">Bản Pro</div>
                        {feat.premium === "Mở" ? (
                          <div className="flex items-center gap-1.5 text-success font-bold text-[0.8rem]">
                            <Check size={13} /> <span>{feat.premium}</span>
                          </div>
                        ) : (
                          <div className="text-primary dark:text-[#E2E8F0] font-bold text-[0.8rem]">{feat.premium}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>)}

            {/* Section 7: FAQs Accordion */}
            <div>
              <SectionTitle title="Câu hỏi thường gặp" />
              <div className="fx-card dark:bg-[#1E293B] dark:border-[#334155] dark:shadow-none flex flex-col px-4 md:px-6 py-1 [&>*:last-child]:border-b-0">
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaqIdx === idx;
                  const FaqIcon = faq.icon;
                  return (
                    <div key={idx} className="border-b border-line dark:border-[#334155] py-2">
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
              <div className="relative mt-16 fx-card bg-hero-amber dark:bg-none dark:bg-[#1E293B] dark:border-[#334155] dark:shadow-none p-6 pt-12 md:p-8 md:pt-14 text-center flex flex-col items-center gap-3">
                {/* Mimi chuyển từ thẻ giá Premium (đã bỏ vì trùng khung đầu trang) xuống banner cuối. */}
                <MimiMascot width={150} className="absolute left-1/2 -translate-x-1/2 -top-[66px] pointer-events-none" />
                <h3 className="text-[1.15rem] md:text-[1.35rem] font-bold tracking-[-0.02em] text-primary dark:text-[#E2E8F0] m-0">Điểm cao không chờ đợi</h3>
                <p className="text-[0.85rem] text-text-muted dark:text-[#94A3B8] m-0 max-w-[380px] leading-[1.5]">
                  Đăng ký ngay tài khoản Premium để đạt kết quả tốt nhất trong kỳ thi sắp tới.
                </p>
                <div className="flex gap-3 w-full justify-center flex-wrap mt-1">
                  <button
                    className="btn btn-premium vibrate h-[42px] text-[0.85rem] px-5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => handleUpgrade(selectedPlan)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <>{isGuest && <Lock size={14} />}<span>Nâng cấp Premium</span></>}
                  </button>
                </div>
              </div>
            )}

          </div>
        </PageShell>
  );
}
