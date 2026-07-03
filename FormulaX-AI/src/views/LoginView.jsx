import React, { useState } from "react";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, LayoutGrid, AlertCircle } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

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
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("login");

  // Email/password fields (demo only — no real backend auth)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Google OAuth — fetches user profile after getting access token
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();
        login(userInfo);
      } catch {
        setError("Không thể lấy thông tin tài khoản Google. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError("Đăng nhập Google thất bại. Vui lòng thử lại.");
      setLoading(false);
    },
  });

  const handleEmailLogin = (e) => {
    e.preventDefault();
    setError("Tính năng đăng nhập bằng email đang phát triển. Vui lòng dùng Google.");
  };

  return (
    <div className="relative overflow-hidden flex flex-col items-center justify-center min-h-screen w-full bg-page-gradient p-5">
      <div className="absolute -top-[8%] -left-[6%] w-[260px] h-[260px] rounded-full pointer-events-none z-0 blur-[50px] bg-[radial-gradient(circle,rgba(196,132,252,0.45)_0%,transparent_70%)]" />
      <div className="absolute top-[6%] -right-[10%] w-[300px] h-[300px] rounded-full pointer-events-none z-0 blur-[50px] bg-[radial-gradient(circle,rgba(251,207,232,0.55)_0%,transparent_70%)]" />
      <div className="absolute -bottom-[12%] left-[18%] w-[320px] h-[320px] rounded-full pointer-events-none z-0 blur-[50px] bg-[radial-gradient(circle,rgba(147,197,253,0.45)_0%,transparent_70%)]" />

      {/* Card */}
      <div className="glass-card relative z-[1] max-w-[400px] w-full py-8 px-7 flex flex-col gap-5">
        {/* Logo */}
        <div className="text-center flex flex-col items-center gap-2.5">
          <img src="/favicon.svg" alt="FormulaX" className="w-[52px] h-[52px] rounded-2xl shadow-[0_4px_12px_rgba(59,130,246,0.3)]" />
          <div>
            <h2 className="text-[1.3rem] font-extrabold text-[#1E3A5F] mb-1 tracking-[-0.5px]">
              FormulaX AI
            </h2>
            <p className="text-[0.8rem] text-text-muted font-medium m-0">
              Đăng nhập để tiếp tục học tập
            </p>
          </div>
        </div>

        {/* Tab */}
        <div className="flex bg-[#F1F5F9] rounded-[10px] p-1">
          {["login", "register"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 border-none rounded-[7px] text-[0.85rem] cursor-pointer transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white text-[#1E3A5F] font-bold shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                  : "bg-transparent text-text-muted font-semibold"
              }`}
            >
              {tab === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          ))}
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={() => { setError(""); setLoading(true); googleLogin(); }}
          disabled={loading}
          className={`flex items-center justify-center gap-2.5 w-full h-[46px] rounded-[10px] border-[1.5px] border-[#E2E8F0] text-[0.9rem] font-bold text-[#1E3A5F] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-200 hover:bg-[#F8FAFC] ${
            loading ? "bg-[#F8FAFC] cursor-not-allowed" : "bg-white cursor-pointer"
          }`}
        >
          {loading ? (
            <div className="w-[18px] h-[18px] rounded-full border-2 border-[#CBD5E1] border-t-secondary animate-spin" />
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
          <div className="flex-1 h-px bg-[#E2E8F0]" />
          <span className="text-[0.72rem] text-[#94A3B8] font-medium">hoặc dùng email</span>
          <div className="flex-1 h-px bg-[#E2E8F0]" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailLogin} className="flex flex-col gap-3.5">
          <div>
            <label className="text-[0.78rem] font-bold text-[#1E3A5F] block mb-1.5">Email</label>
            <div className="relative flex items-center">
              <Mail size={15} className="absolute left-3 text-[#94A3B8]" />
              <input
                type="email"
                placeholder="ban@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-[38px] w-full h-[42px] rounded-lg border-[1.5px] border-[#E2E8F0] text-[0.85rem] text-[#1E3A5F] bg-white outline-none box-border"
              />
            </div>
          </div>

          <div>
            <label className="text-[0.78rem] font-bold text-[#1E3A5F] block mb-1.5">Mật khẩu</label>
            <div className="relative flex items-center">
              <Lock size={15} className="absolute left-3 text-[#94A3B8]" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-[38px] pr-[38px] w-full h-[42px] rounded-lg border-[1.5px] border-[#E2E8F0] text-[0.85rem] text-[#1E3A5F] bg-white outline-none box-border"
              />
              <button
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
            className="w-full h-[42px] rounded-lg text-[0.88rem] font-bold mt-1 bg-secondary text-white border-none cursor-pointer"
          >
            {activeTab === "login" ? "Đăng nhập" : "Đăng ký"}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="relative z-[1] mt-5 text-[0.7rem] text-[#94A3B8] text-center max-w-[320px] leading-[1.5]">
        Bằng cách đăng nhập, bạn đồng ý với{" "}
        <span className="text-secondary cursor-pointer">Điều khoản dịch vụ</span>{" "}
        và{" "}
        <span className="text-secondary cursor-pointer">Chính sách bảo mật</span>
      </p>
    </div>
  );
}
