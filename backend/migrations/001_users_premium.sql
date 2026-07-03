-- Chạy file này trong Supabase Dashboard → SQL Editor (project FormulaX AI).
-- Idempotent: chạy lại nhiều lần không lỗi, không mất dữ liệu cũ.

-- Bảng users: chưa tồn tại trong DB hiện tại (mọi bảng khác chỉ lưu google_id rời rạc).
-- Dùng làm nơi lưu trạng thái Premium tập trung theo google_id.
create table if not exists public.users (
  google_id text primary key,
  email text,
  is_premium boolean not null default false,
  premium_expiry timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users add column if not exists is_premium boolean not null default false;
alter table public.users add column if not exists premium_expiry timestamptz;

-- Bảng payments: log từng đơn hàng MoMo để chống xử lý trùng khi MoMo gọi IPN nhiều lần
-- (idempotency) và để đối soát giao dịch sau này.
create table if not exists public.payments (
  order_id text primary key,
  request_id text not null,
  google_id text not null,
  plan text not null,
  amount integer not null,
  status text not null default 'pending', -- pending | success | failed
  momo_trans_id text,
  result_code integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_google_id_idx on public.payments (google_id);

-- RLS: is_premium/premium_expiry chỉ được GHI bởi backend qua Supabase service role key
-- (service role bỏ qua RLS). Cho phép ĐỌC công khai qua anon key để khớp với mô hình bảo mật
-- hiện tại của app (các bảng bookmarks/user_notes/... cũng đọc/ghi trực tiếp bằng anon key,
-- lọc theo google_id ở phía client, không có Supabase Auth JWT để ràng buộc RLS theo user).
alter table public.users enable row level security;
alter table public.payments enable row level security;

create policy "Cho phép đọc công khai" on public.users
  for select
  using (true);
-- Không tạo policy insert/update/delete cho anon: chỉ service role (bỏ qua RLS) mới ghi được,
-- đảm bảo is_premium chỉ đổi qua route IPN đã xác minh chữ ký MoMo.

-- GRANT: bảng tạo mới qua SQL Editor không tự thừa hưởng quyền service_role của project —
-- cấp thủ công để service role key (dùng ở backend) đọc/ghi được (service_role vẫn bỏ qua RLS,
-- nhưng vẫn cần GRANT ở tầng Postgres trước, RLS là lớp chặn thứ hai phía trên GRANT).
grant select, insert, update, delete on public.users to service_role;
grant select, insert, update, delete on public.payments to service_role;
grant select on public.users to anon, authenticated;
