import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.jsx'

// Đăng ký service worker qua virtual:pwa-register (thay vì injectRegister mặc định của
// vite-plugin-pwa, chỉ gọi navigator.serviceWorker.register() trần — không có logic phát
// hiện bản mới). Thiếu bước này, tab đang mở có thể tiếp tục chạy bundle JS cũ dù server đã
// deploy bản mới, phải tự reload thủ công nhiều lần mới thấy code mới — reload ngay khi phát
// hiện service worker mới để tránh tình trạng đó.
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        window.location.reload();
      },
    });
  });
}

// Thay YOUR_GOOGLE_CLIENT_ID bằng Client ID lấy từ Google Cloud Console
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
