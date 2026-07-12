-- Spaced repetition state cho Flashcard, theo (google_id, formula_id) — không theo bộ thẻ,
-- vì cùng 1 công thức có thể nằm trong nhiều bộ thẻ khác nhau.
create table if not exists public.flashcard_progress (
  id uuid primary key default gen_random_uuid(),
  google_id text not null,
  formula_id text not null,
  repetitions int not null default 0,
  interval_days numeric not null default 0,
  ease_factor numeric not null default 2.5,
  next_review_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (google_id, formula_id)
);

alter table public.flashcard_progress enable row level security;

drop policy if exists "flashcard_progress_all" on public.flashcard_progress;
create policy "flashcard_progress_all" on public.flashcard_progress
  for all using (true) with check (true);

grant all on public.flashcard_progress to anon, authenticated, service_role;
