-- Community stock reports: signed-in tea drinkers say whether a tea was in stock or sold out
-- when they checked its official shop. This replaces the retailer stock scrape the design spec
-- floated: Marukyu Koyamaen's robots.txt disallows all crawling and Ippodo's terms forbid
-- scraping and reusing site information without approval, so Matchoji only links to shops.

alter table public.products
add column shop_url text check (shop_url ~ '^https://');

create table public.stock_reports (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null default auth.uid () references public.profiles (id) on delete cascade,
  status text not null check (status in ('in_stock', 'sold_out')),
  created_at timestamptz not null default now()
);

create index stock_reports_product_created_idx on public.stock_reports (
  product_id,
  created_at desc
);

alter table public.stock_reports enable row level security;

create policy "stock reports are viewable by everyone"
  on public.stock_reports for select
  using (true);

create policy "stock reports are insertable by their author"
  on public.stock_reports for insert
  to authenticated
  with check (auth.uid () = user_id);

-- Reports are a timeline, so there is no update or delete policy: a changed answer is a new
-- report. A brake on repeats stops one person flooding a tea's history with taps.
create function public.limit_stock_report_rate () returns trigger language plpgsql
set search_path = '' as $$
begin
  if exists (
    select 1 from public.stock_reports
    where product_id = new.product_id
      and user_id = new.user_id
      and created_at > now() - interval '10 minutes'
  ) then
    raise exception 'You reported this tea a moment ago. Try again later.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger stock_reports_rate_limit
before insert on public.stock_reports
for each row execute function public.limit_stock_report_rate ();

create trigger audit_stock_reports
after insert or update or delete on public.stock_reports
for each row execute function public.audit_row_change ();
