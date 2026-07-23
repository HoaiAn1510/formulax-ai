import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

/**
 * Trước đây app đăng nhập Google hoàn toàn ở phía client (@react-oauth/google) rồi tự lưu
 * profile vào localStorage. Hệ quả: request gửi lên Supabase không mang JWT nào, nên không thể
 * bật Row Level Security — policy không có gì để đối chiếu, và bất kỳ ai có anon key (nằm sẵn
 * trong bundle JS, vốn là thông tin công khai) đều đọc/sửa được dữ liệu của người khác.
 *
 * Giờ đăng nhập đi qua Supabase Auth: mỗi request mang JWT do Supabase ký, RLS đối chiếu được
 * (xem backend/migrations/003_rls_supabase_auth.sql). Phần còn lại của app vẫn dùng `googleId`
 * như cũ — khác ở chỗ nó được lấy ra từ phiên đăng nhập chứ không do client tự khai.
 */

// Google `sub` nằm trong danh sách identity của phiên. Ưu tiên đọc từ `identities` vì đó là dữ
// liệu do Supabase quản lý; `user_metadata` chỉ là phương án dự phòng để hiển thị — KHÔNG
// được dùng user_metadata để phân quyền (người dùng tự ghi đè được). Việc phân quyền do RLS
// đối chiếu với bảng auth.identities ở phía Postgres đảm nhiệm.
function extractGoogleId(u) {
  const fromIdentity = u.identities?.find((i) => i.provider === "google")?.id;
  return fromIdentity || u.user_metadata?.provider_id || u.user_metadata?.sub || null;
}

function mapSessionToUser(session) {
  const u = session?.user;
  if (!u) return null;
  const meta = u.user_metadata || {};
  return {
    name: meta.full_name || meta.name || u.email || "Bạn",
    email: u.email || "",
    picture: meta.avatar_url || meta.picture || "",
    googleId: extractGoogleId(u),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Phiên đăng nhập được khôi phục bất đồng bộ từ Supabase. Trong lúc chờ thì chưa biết người
  // dùng đã đăng nhập hay chưa — render ngay sẽ nháy màn hình đăng nhập rồi mới nhảy vào app.
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!alive) return;
      setUser(mapSessionToUser(session));
      setAuthLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapSessionToUser(session));
      setAuthLoading(false);
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // Vẫn giữ bản sao trong localStorage: nhiều chỗ ở App.jsx đọc googleId ngay lúc khởi tạo
  // state (tên hiển thị, khối lớp) trước khi context kịp trả về. Đây chỉ là bộ nhớ đệm hiển
  // thị — nguồn sự thật là phiên Supabase, dữ liệu thật vẫn do RLS bảo vệ phía server.
  useEffect(() => {
    if (user) {
      localStorage.setItem("formulax_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("formulax_user");
    }
  }, [user]);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, loginWithGoogle, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
