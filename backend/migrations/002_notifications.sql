-- Chạy file này trong Supabase Dashboard → SQL Editor (project FormulaX AI).
-- Idempotent: chạy lại nhiều lần không lỗi, không mất dữ liệu cũ.

-- Bảng notifications: thông báo thật tính từ dữ liệu học tập (streak, chủ đề yếu, mốc thành
-- tích), sinh ra khi app tải dữ liệu người dùng. Đọc/ghi trực tiếp từ frontend bằng anon key,
-- lọc theo google_id ở phía client — giống mô hình bảo mật của bookmarks/quiz_results/... hiện tại
-- (không dùng Supabase Auth JWT nên không ràng buộc RLS theo user thật sự).
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  google_id text not null,
  category text not null,       -- 'streak' | 'weakTopic' | 'milestone'
  message text not null,
  dedupe_key text not null,     -- chặn tạo trùng cùng 1 sự kiện/ngày, vd 'streak_2026-07-12'
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists notifications_dedupe_idx on public.notifications (google_id, dedupe_key);
create index if not exists notifications_google_id_idx on public.notifications (google_id, created_at desc);

alter table public.notifications enable row level security;

-- CREATE POLICY không hỗ trợ IF NOT EXISTS trong Postgres — drop trước rồi tạo lại để idempotent.
drop policy if exists "Cho phép đọc/ghi công khai, lọc google_id ở client" on public.notifications;
create policy "Cho phép đọc/ghi công khai, lọc google_id ở client" on public.notifications
  for all using (true) with check (true);

grant select, insert, update, delete on public.notifications to anon, authenticated, service_role;
grant usage, select on sequence notifications_id_seq to anon, authenticated, service_role;
