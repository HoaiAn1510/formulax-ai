import React, { useState } from "react";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, LayoutGrid, AlertCircle } from "lucide-react";
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

export default function LoginView() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("login");

  // Email/password fields (demo only — no real backend auth)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [legalDoc, setLegalDoc] = useState(null); // "terms" | "privacy" | null

  // Đăng nhập Google qua Supabase Auth. Khác luồng cũ ở hai điểm: (1) đây là redirect cả
  // trang sang Google rồi quay lại, không phải popup — nên không cần xử lý trường hợp người
  // dùng đóng popup; (2) khi quay về, phiên do Supabase cấp và AuthContext tự nhận qua
  // onAuthStateChange, không cần gọi login() thủ công nữa.
  const googleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await loginWithGoogle();
      // Nếu chuyển hướng thành công thì trang này bị thay thế, không chạy tiếp tới đây.
    } catch (err) {
      console.error("Đăng nhập Google thất bại:", err);
      setError("Đăng nhập Google thất bại. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  const handleEmailLogin = (e) => {
    e.preventDefault();
    setError("Tính năng đăng nhập bằng email đang phát triển. Vui lòng dùng Google.");
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

        {/* Tab */}
        <div className="flex bg-[#F1F5F9] dark:bg-[#0F172A] rounded-[10px] p-1">
          {["login", "register"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 border-none rounded-[7px] text-[0.85rem] cursor-pointer transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white dark:bg-[#1E293B] text-[#1E3A5F] dark:text-[#E2E8F0] font-bold shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                  : "bg-transparent text-text-muted dark:text-[#94A3B8] font-semibold"
              }`}
            >
              {tab === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          ))}
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={googleLogin}
          disabled={loading}
          className={`flex items-center justify-center gap-2.5 w-full h-[46px] rounded-[10px] border-[1.5px] border-[#E2E8F0] dark:border-[#334155] text-[0.9rem] font-bold text-[#1E3A5F] dark:text-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-200 hover:bg-[#F8FAFC] dark:hover:bg-[#334155] ${
            loading ? "bg-[#F8FAFC] dark:bg-[#0F172A] cursor-not-allowed" : "bg-white dark:bg-[#1E293B] cursor-pointer"
          }`}
        >
          {loading ? (
            <div className="w-[18px] h-[18px] rounded-full border-2 border-[#CBD5E1] border-t-accent animate-spin" />
          ) : <GoogleIcon />}
          <span>{loading ? "Đang đăng nhập..." : `${activeTab === "login" ? "Đăng nhập" : "Đăng ký"} với Google`}</span>
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
          <span className="text-[0.72rem] text-[#94A3B8] font-medium">hoặc dùng email</span>
          <div className="flex-1 h-px bg-[#E2E8F0] dark:bg-[#334155]" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailLogin} className="flex flex-col gap-3.5">
          <div>
            <label className="text-[0.78rem] font-bold text-[#1E3A5F] dark:text-[#E2E8F0] block mb-1.5">Email</label>
            <div className="relative flex items-center">
              <Mail size={15} className="absolute left-3 text-[#94A3B8]" />
              <input
                type="email"
                placeholder="ban@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-[38px] w-full h-[42px] rounded-lg border-[1.5px] border-[#E2E8F0] dark:border-[#334155] text-[0.85rem] text-[#1E3A5F] dark:text-[#E2E8F0] bg-white dark:bg-[#0F172A] outline-none box-border focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-[0.78rem] font-bold text-[#1E3A5F] dark:text-[#E2E8F0] block mb-1.5">Mật khẩu</label>
            <div className="relative flex items-center">
              <Lock size={15} className="absolute left-3 text-[#94A3B8]" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-[38px] pr-[38px] w-full h-[42px] rounded-lg border-[1.5px] border-[#E2E8F0] dark:border-[#334155] text-[0.85rem] text-[#1E3A5F] dark:text-[#E2E8F0] bg-white dark:bg-[#0F172A] outline-none box-border focus:border-accent"
              />
              <button aria-label="Hiện hoặc ẩn mật khẩu"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 bg-transparent border-none cursor-pointer text-[#94A3B8] flex"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-[42px] rounded-lg text-[0.88rem] font-bold mt-1 bg-accent text-white border-none cursor-pointer"
          >
            {activeTab === "login" ? "Đăng nhập" : "Đăng ký"}
          </button>
        </form>
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
