-- Price history: every reference price a tea has had, so the tea page can show a trend while
-- matcha gets dearer. Filled by a trigger on products, so any price edit is recorded without
-- the app writing history itself; nothing else can write to the table.

create table public.tea_price_history (
  id uuid primary key default gen_random_uuid (),
  product_id uuid not null references public.products (id) on delete cascade,
  price numeric(8, 2) not null check (price > 0),
  pack_grams numeric(6, 1) not null check (pack_grams > 0 and pack_grams <= 5000),
  currency text not null default 'SGD' check (currency = 'SGD'),
  recorded_at timestamptz not null default now()
);

create index tea_price_history_product_idx
  on public.tea_price_history (product_id, recorded_at desc);

alter table public.tea_price_history enable row level security;

create policy "price history is viewable by everyone"
  on public.tea_price_history for select
  using (true);

-- Security definer so a price edit by any role the products policies allow still records;
-- with no insert policy, clients cannot write history directly.
create function public.record_tea_price () returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  if new.price_sgd is not null and new.pack_grams is not null
    and (tg_op = 'INSERT'
      or new.price_sgd is distinct from old.price_sgd
      or new.pack_grams is distinct from old.pack_grams) then
    insert into public.tea_price_history (product_id, price, pack_grams)
    values (new.id, new.price_sgd, new.pack_grams);
  end if;
  return null;
end;
$$;

create trigger products_record_price
after insert or update of price_sgd, pack_grams on public.products
for each row execute function public.record_tea_price ();

create trigger audit_tea_price_history
after insert or update or delete on public.tea_price_history
for each row execute function public.audit_row_change ();

-- Teas priced before this existed start their history now.
insert into public.tea_price_history (product_id, price, pack_grams, recorded_at)
select id, price_sgd, pack_grams, now ()
from public.products
where price_sgd is not null and pack_grams is not null;
