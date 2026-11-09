-- Thiệp Đôi — bảng invitations (chạy trong Supabase SQL Editor).
-- RLS BẬT và KHÔNG có policy công khai: chỉ SERVICE_ROLE_KEY mới đọc/ghi
-- được (key này bypass RLS). Anon key KHÔNG đọc được bảng này — app chỉ
-- gọi qua API route máy chủ, không bao giờ gọi Supabase từ trình duyệt.
-- Trạng thái: draft / preview_for_print / locked_for_print / paid_online
-- (luồng cũ) + confirmed / reviewed / printed (bảng duyệt mới, giai đoạn 2):
--   draft            nháp, đang sửa
--   preview_for_print đã gửi khách duyệt in
--   confirmed        khách đã chốt — chờ duyệt
--   reviewed         đã duyệt — chờ in
--   printed          đã in
--   locked_for_print chốt in kiểu cũ (admin chốt) — tương đương confirmed
--   paid_online      đã trả tiền thiệp online
-- confirmed_at = giờ khách bấm Chốt (customerConfirmedAt trong app).

create table if not exists public.invitations (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  custom_texts jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  edit_token text not null default '',
  history jsonb not null default '[]'::jsonb,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  preview_token text not null default '',
  guest_token text not null default '',
  guest_tokens jsonb not null default '{}'::jsonb,
  payment_memo text not null default '',
  locked_at timestamptz,
  preview_expires_at timestamptz,
  paid_at timestamptz,
  paid_amount numeric,
  paid_ref text,
  paid_template_id text,
  paid_memo text,
  reconcile_log jsonb not null default '[]'::jsonb,
  edited_fields jsonb not null default '[]'::jsonb,
  manual_list jsonb not null default '[]'::jsonb
);

create index if not exists invitations_status_idx on public.invitations (status);
create index if not exists invitations_updated_at_idx on public.invitations (updated_at desc);
create index if not exists invitations_confirmed_at_idx on public.invitations (confirmed_at desc nulls last);

alter table public.invitations enable row level security;
-- Cố tình KHÔNG tạo policy: chỉ service_role (bypass RLS) mới truy cập.
-- Đừng thêm policy public/anon cho bảng này.
