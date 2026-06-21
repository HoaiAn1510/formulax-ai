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
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      width: "100%",
      backgroundColor: "#F8FAFC",
      padding: "20px",
    }}>
      {/* Card */}
      <div style={{
        maxWidth: "400px",
        width: "100%",
        padding: "32px 28px",
        backgroundColor: "white",
        borderRadius: "20px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 10px 40px rgba(30,58,95,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <img src="/favicon.svg" alt="FormulaX" style={{
            width: "52px", height: "52px", borderRadius: "14px",
            boxShadow: "0 4px 12px rgba(59,130,246,0.3)"
          }} />
          <div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#1E3A5F", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
              FormulaX AI
            </h2>
            <p style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "500", margin: 0 }}>
              Đăng nhập để tiếp tục học tập
            </p>
          </div>
        </div>

        {/* Tab */}
        <div style={{ display: "flex", backgroundColor: "#F1F5F9", borderRadius: "10px", padding: "4px" }}>
          {["login", "register"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: "8px 0", border: "none", borderRadius: "7px",
                backgroundColor: activeTab === tab ? "white" : "transparent",
                color: activeTab === tab ? "#1E3A5F" : "#64748B",
                fontWeight: activeTab === tab ? "700" : "600",
                fontSize: "0.85rem",
                boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                cursor: "pointer", transition: "all 0.2s"
              }}
            >
              {tab === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          ))}
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={() => { setError(""); setLoading(true); googleLogin(); }}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            width: "100%", height: "46px", borderRadius: "10px",
            border: "1.5px solid #E2E8F0", backgroundColor: loading ? "#F8FAFC" : "white",
            fontSize: "0.9rem", fontWeight: "700", color: "#1E3A5F",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#F8FAFC"; }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "white"; }}
        >
          {loading ? (
            <div style={{
              width: "18px", height: "18px", borderRadius: "50%",
              border: "2px solid #CBD5E1", borderTopColor: "#3B82F6",
              animation: "spin 0.7s linear infinite"
            }} />
          ) : <GoogleIcon />}
          <span>{loading ? "Đang đăng nhập..." : `${activeTab === "login" ? "Đăng nhập" : "Đăng ký"} với Google`}</span>
        </button>

        {/* Error message */}
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 12px", borderRadius: "8px",
            backgroundColor: "#FEF2F2", border: "1px solid #FECACA",
            color: "#DC2626", fontSize: "0.78rem", fontWeight: "500"
          }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }}></div>
          <span style={{ fontSize: "0.72rem", color: "#94A3B8", fontWeight: "500" }}>hoặc dùng email</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }}></div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#1E3A5F", display: "block", marginBottom: "6px" }}>Email</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Mail size={15} style={{ position: "absolute", left: "12px", color: "#94A3B8" }} />
              <input
                type="email"
                placeholder="ban@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  paddingLeft: "38px", width: "100%", height: "42px",
                  borderRadius: "8px", border: "1.5px solid #E2E8F0",
                  fontSize: "0.85rem", color: "#1E3A5F", backgroundColor: "white",
                  outline: "none", boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#1E3A5F", display: "block", marginBottom: "6px" }}>Mật khẩu</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Lock size={15} style={{ position: "absolute", left: "12px", color: "#94A3B8" }} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  paddingLeft: "38px", paddingRight: "38px",
                  width: "100%", height: "42px",
                  borderRadius: "8px", border: "1.5px solid #E2E8F0",
                  fontSize: "0.85rem", color: "#1E3A5F", backgroundColor: "white",
                  outline: "none", boxSizing: "border-box"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex" }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{
              width: "100%", height: "42px", borderRadius: "8px",
              fontSize: "0.88rem", fontWeight: "700", marginTop: "4px",
              backgroundColor: "#3B82F6", color: "white", border: "none", cursor: "pointer"
            }}
          >
            {activeTab === "login" ? "Đăng nhập" : "Đăng ký"}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p style={{ marginTop: "20px", fontSize: "0.7rem", color: "#94A3B8", textAlign: "center", maxWidth: "320px", lineHeight: "1.5" }}>
        Bằng cách đăng nhập, bạn đồng ý với{" "}
        <span style={{ color: "#3B82F6", cursor: "pointer" }}>Điều khoản dịch vụ</span>{" "}
        và{" "}
        <span style={{ color: "#3B82F6", cursor: "pointer" }}>Chính sách bảo mật</span>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
