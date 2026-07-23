-- Mở rộng bảng payments (đã tồn tại, tạo thủ công trước khi có thư mục migrations) để hỗ trợ
-- PayOS thay cho MoMo. Không đổi/xoá cột momo_trans_id/result_code cũ để tránh rủi ro với dữ
-- liệu lịch sử, dù từ nay các cột đó không còn được ghi mới nữa.
alter table public.payments add column if not exists provider text default 'payos';
alter table public.payments add column if not exists payos_order_code bigint;
alter table public.payments add column if not exists payos_payment_link_id text;
alter table public.payments add column if not exists payos_reference text;

create index if not exists idx_payments_payos_order_code on public.payments (payos_order_code);
