import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Tách thư viện ít đổi ra chunk riêng: mỗi lần deploy code app, trình duyệt cũ chỉ
        // phải tải lại chunk app, còn react/supabase vẫn dùng bản đã cache.
        // Lưu ý: Vite 8 chạy trên Rolldown, ở đây manualChunks CHỈ nhận dạng hàm — dạng
        // object { tên: [package] } của Rollup cũ sẽ lỗi "manualChunks is not a function".
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "react-vendor";
          if (id.includes("@supabase")) return "supabase";
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // đăng ký thủ công qua virtual:pwa-register trong main.jsx để có logic tự reload khi có bản mới
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'FormulaX AI - Ôn thi Công thức Toán THPT',
        short_name: 'FormulaX AI',
        description: 'Tra cứu, ghi nhớ và luyện tập công thức Toán THPT — chống AI hallucination.',
        lang: 'vi',
        theme_color: '#0F172A',
        background_color: '#F8FAFC',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        // PremiumGem3D kéo theo three.js (~980 KB, 264 KB gzip) nhưng chỉ là hiệu ứng 3D trang
        // trí ở màn Premium và đã có sẵn fallback khi thiếu WebGL. Để nó trong precache đồng
        // nghĩa mọi người dùng tải về gần 1 MB ngay lần ghé đầu dù không vào màn đó — chuyển
        // sang cache lúc chạy (bên dưới), tải khi thực sự cần rồi mới giữ lại cho lần sau.
        globIgnores: ['**/PremiumGem3D-*.js'],
        // KaTeX (render công thức) và Google Fonts load qua CDN, không nằm trong bundle Vite —
        // phải cache riêng runtime, nếu không offline sẽ mất khả năng hiển thị công thức toán.
        runtimeCaching: [
          {
            // Chunk 3D của màn Premium — bị loại khỏi precache ở trên, cache khi dùng tới.
            urlPattern: ({ url }) => /\/assets\/PremiumGem3D-.*\.js$/.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'premium-3d',
              expiration: { maxEntries: 3, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://cdn.jsdelivr.net',
            handler: 'CacheFirst',
            options: {
              cacheName: 'katex-cdn',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
