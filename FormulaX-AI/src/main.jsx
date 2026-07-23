import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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

// Đăng nhập Google giờ đi qua Supabase Auth (xem context/AuthContext.jsx) nên không còn cần
// GoogleOAuthProvider của @react-oauth/google. Client ID được khai báo ở Supabase Dashboard →
// Authentication → Providers → Google, không nằm trong code frontend nữa.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
