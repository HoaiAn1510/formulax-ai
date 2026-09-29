import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LegalModal from "../components/LegalModal";

// Google icon SVG
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
      <path d="M6.3 14.7l7 5.1C15.2 16.4 19.3 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z" fill="#FF3D00"/>
      <path d="M24 46c5.5 0 10.4-1.9 14.3-5l-6.6-5.6C29.8 36.8 27 37.8 24 37.8c-6 0-10.6-4-11.7-9.3l-7.1 5.5C8 40.6 15.4 46 24 46z" fill="#4CAF50"/>
      <path d="M44.5 20H24v8.5h11.8c-.9 2.5-2.5 4.6-4.7 6l6.6 5.6c3.8-3.5 6.3-8.8 6.3-15.1 0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
    </svg>
  );
}

function Spinner() {
  return <div className="w-[18px] h-[18px] rounded-full border-2 border-[#CBD5E1] border-t-accent animate-spin" />;
}

export default function LoginView() {
  const { loginWithGoogle, loginAsGuest } = useAuth();
  // "google" | "guest" | null — chỉ 1 trong 2 nút có thể đang xử lý cùng lúc.
  const [loadingAction, setLoadingAction] = useState(null);
  const [error, setError] = useState("");
  const [legalDoc, setLegalDoc] = useState(null); // "terms" | "privacy" | null

  // Đăng nhập Google qua Supabase Auth. Khác luồng cũ ở hai điểm: (1) đây là redirect cả
  // trang sang Google rồi quay lại, không phải popup — nên không cần xử lý trường hợp người
  // dùng đóng popup; (2) khi quay về, phiên do Supabase cấp và AuthContext tự nhận qua
  // onAuthStateChange, không cần gọi login() thủ công nữa.
  const googleLogin = async () => {
    setLoadingAction("google");
    setError("");
    try {
      await loginWithGoogle();
      // Nếu chuyển hướng thành công thì trang này bị thay thế, không chạy tiếp tới đây.
    } catch (err) {
      console.error("Đăng nhập Google thất bại:", err);
      setError("Đăng nhập Google thất bại. Vui lòng thử lại.");
      setLoadingAction(null);
    }
  };

  // "Dùng thử không cần đăng nhập" — không redirect, AuthContext tự nhận phiên ẩn danh mới qua
  // onAuthStateChange và App.jsx tự chuyển sang màn hình chính (isLoggedIn = !!user đã đúng cho
  // cả phiên ẩn danh, xem AuthContext.jsx).
  const guestLogin = async () => {
    setLoadingAction("guest");
    setError("");
    try {
      await loginAsGuest();
    } catch (err) {
      console.error("Vào chế độ khách thất bại:", err);
      setError(
        err.message?.includes("Anonymous sign-ins are disabled")
          ? "Chế độ khách hiện chưa mở. Vui lòng đăng nhập bằng Google."
          : "Không vào được chế độ khách. Vui lòng thử lại."
      );
      setLoadingAction(null);
    }
  };

  return (
    <div className="relative overflow-hidden flex flex-col items-center justify-center min-h-screen w-full bg-page-gradient dark:bg-[#0F172A] p-5">

      {/* Card */}
      <div className="glass-card dark:bg-[#1E293B] dark:border-[#334155] relative z-[1] max-w-[400px] w-full py-8 px-7 flex flex-col gap-5">
        {/* Logo */}
        <div className="text-center flex flex-col items-center gap-2.5">
          <img src="/favicon.svg" alt="FormulaX" className="w-[52px] h-[52px] rounded-2xl shadow-[0_2px_6px_rgba(15,23,42,0.05)]" />
          <div>
            <h2 className="text-[1.3rem] font-extrabold text-[#1E3A5F] dark:text-[#E2E8F0] mb-1 tracking-[-0.5px]">
              FormulaX AI
            </h2>
            <p className="text-[0.8rem] text-text-muted dark:text-[#94A3B8] font-medium m-0">
              Đăng nhập để tiếp tục học tập
            </p>
          </div>
        </div>

        {/* Google Sign-In — nút chính */}
        <button
          onClick={googleLogin}
          disabled={!!loadingAction}
          className={`flex items-center justify-center gap-2.5 w-full h-[46px] rounded-[10px] border-[1.5px] border-[#E2E8F0] dark:border-[#334155] text-[0.9rem] font-bold text-[#1E3A5F] dark:text-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-200 hover:bg-[#F8FAFC] dark:hover:bg-[#334155] ${
            loadingAction ? "bg-[#F8FAFC] dark:bg-[#0F172A] cursor-not-allowed" : "bg-white dark:bg-[#1E293B] cursor-pointer"
          }`}
        >
          {loadingAction === "google" ? <Spinner /> : <GoogleIcon />}
          <span>{loadingAction === "google" ? "Đang đăng nhập..." : "Đăng nhập với Google"}</span>
        </button>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 py-2.5 px-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[0.78rem] font-medium">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-2.5">
          <div className="flex-1 h-px bg-[#E2E8F0] dark:bg-[#334155]" />
          <span className="text-[0.72rem] text-[#94A3B8] font-medium">hoặc</span>
          <div className="flex-1 h-px bg-[#E2E8F0] dark:bg-[#334155]" />
        </div>

        {/* Dùng thử không cần đăng nhập — nút phụ: chỉ viền, không tô nền */}
        <div className="flex flex-col gap-2">
          <button
            onClick={guestLogin}
            disabled={!!loadingAction}
            className={`flex items-center justify-center gap-2 w-full h-[46px] rounded-[10px] border-[1.5px] border-[#E2E8F0] dark:border-[#334155] bg-transparent text-[0.85rem] font-bold text-text-muted dark:text-[#94A3B8] transition-all duration-200 hover:bg-[#F8FAFC] dark:hover:bg-[#334155]/40 ${
              loadingAction ? "cursor-not-allowed opacity-70" : "cursor-pointer"
            }`}
          >
            {loadingAction === "guest" && <Spinner />}
            <span>{loadingAction === "guest" ? "Đang vào..." : "Dùng thử không cần đăng nhập"}</span>
          </button>
          <p className="text-[0.72rem] text-[#94A3B8] text-center leading-[1.5] m-0">
            Chế độ khách: tra cứu đầy đủ và 10 lượt Quiz mỗi ngày. Đăng nhập Google để dùng AI và lưu tiến độ.
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-[1] mt-5 text-[0.7rem] text-[#94A3B8] text-center max-w-[320px] leading-[1.5]">
        Bằng cách đăng nhập, bạn đồng ý với{" "}
        <button
          type="button"
          onClick={() => setLegalDoc("terms")}
          className="text-accent bg-transparent border-none p-0 cursor-pointer underline text-[0.7rem] font-medium"
        >
          Điều khoản dịch vụ
        </button>{" "}
        và{" "}
        <button
          type="button"
          onClick={() => setLegalDoc("privacy")}
          className="text-accent bg-transparent border-none p-0 cursor-pointer underline text-[0.7rem] font-medium"
        >
          Chính sách bảo mật
        </button>
      </p>

      {legalDoc && <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />}
    </div>
  );
}
