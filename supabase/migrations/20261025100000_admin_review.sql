-- M1 of docs/superpowers/specs/2026-10-24-vivino-parity-roadmap-design.md: an admin review
-- list instead of hand-written SQL. Admins approve or reject suggested teas and shop
-- applications with a reason the submitter sees (Vivino's "statement of reasons"), set a
-- tea's photo and shop link, and merge a duplicate tea into the one it repeats.
--
-- Admin writes go through security-definer functions that check profiles.is_admin, because
-- column grants cannot say "only admins may write status". The flag is set once by hand:
--   update profiles set is_admin = true where id = '…';

alter table public.profiles add column is_admin boolean not null default false;

create function public.is_admin () returns boolean language sql stable security definer
set search_path = '' as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid ()), false)
$$;

-- === review outcome on teas and shops ===
alter table public.products
add column review_note text check (char_length(review_note) <= 500),
-- Set when a duplicate is merged; its page then forwards to the tea it repeats.
add column merged_into uuid references public.products (id) on delete set null,
add constraint products_image_url_https check (image_url ~ '^https://');

alter table public.vendors
add column review_note text check (char_length(review_note) <= 500);

-- Admins see every tea and shop, whatever its status.
create policy "admins can view every tea"
  on public.products for select
  to authenticated
  using (public.is_admin ());

create policy "admins can view every shop"
  on public.vendors for select
  to authenticated
  using (public.is_admin ());

create function public.require_admin () returns void language plpgsql stable security definer
set search_path = '' as $$
begin
  if not public.is_admin () then
    raise exception 'Only admins can do that.' using errcode = '42501';
  end if;
end;
$$;

-- === teas ===
create function public.review_tea (tea uuid, decision text, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin ();
  if decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected.' using errcode = '22023';
  end if;
  update public.products
  set status = decision, reviewed_at = now(), review_note = nullif(btrim(note), '')
  where id = tea;
  if not found then
    raise exception 'No such tea.' using errcode = 'P0002';
  end if;
end;
$$;

create function public.set_tea_links (tea uuid, image text, shop text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin ();
  update public.products
  set image_url = nullif(btrim(image), ''), shop_url = nullif(btrim(shop), '')
  where id = tea;
  if not found then
    raise exception 'No such tea.' using errcode = 'P0002';
  end if;
end;
$$;

-- Moves everything that points at the duplicate onto the tea it repeats, then rejects the
-- duplicate with a note and a forward link. Where a person or shop already has the kept tea
-- (want-to-try, listing), the duplicate's row is dropped rather than doubled.
create function public.merge_tea (duplicate uuid, keep uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  kept_name text;
begin
  perform public.require_admin ();
  if duplicate = keep then
    raise exception 'A tea cannot be merged into itself.' using errcode = '22023';
  end if;
  select name into kept_name from public.products where id = keep and status = 'approved';
  if kept_name is null then
    raise exception 'Merge into an approved tea.' using errcode = '22023';
  end if;

  update public.reviews set product_id = keep where product_id = duplicate;
  update public.stock_reports set product_id = keep where product_id = duplicate;

  insert into public.wishlist (user_id, product_id, created_at)
  select user_id, keep, created_at from public.wishlist where product_id = duplicate
  on conflict (user_id, product_id) do nothing;
  delete from public.wishlist where product_id = duplicate;

  delete from public.listings d
  where d.product_id = duplicate
    and exists (
      select 1 from public.listings k where k.vendor_id = d.vendor_id and k.product_id = keep
    );
  update public.listings set product_id = keep where product_id = duplicate;

  update public.products
  set
    status = 'rejected',
    reviewed_at = now(),
    merged_into = keep,
    review_note = 'Duplicate of ' || kept_name
  where id = duplicate;
end;
$$;

-- === shops ===
create function public.review_vendor (vendor uuid, decision text, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin ();
  if decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected.' using errcode = '22023';
  end if;
  update public.vendors
  set status = decision, reviewed_at = now(), review_note = nullif(btrim(note), '')
  where id = vendor;
  if not found then
    raise exception 'No such shop.' using errcode = 'P0002';
  end if;
end;
$$;

-- A rejected shop can fix its details and ask again; it goes back in the queue as pending.
create function public.reapply_as_vendor () returns void language plpgsql security definer
set search_path = '' as $$
begin
  update public.vendors
  set status = 'pending', reviewed_at = null, review_note = null
  where user_id = auth.uid () and status = 'rejected';
  if not found then
    raise exception 'There is no rejected application to resubmit.' using errcode = 'P0002';
  end if;
end;
$$;

-- Functions are executable by PUBLIC by default; only signed-in callers need these, and the
-- admin ones check the flag themselves.
revoke execute on function public.is_admin () from public, anon;
revoke execute on function public.require_admin () from public, anon, authenticated;
revoke execute on function public.review_tea (uuid, text, text) from public, anon;
revoke execute on function public.set_tea_links (uuid, text, text) from public, anon;
revoke execute on function public.merge_tea (uuid, uuid) from public, anon;
revoke execute on function public.review_vendor (uuid, text, text) from public, anon;
revoke execute on function public.reapply_as_vendor () from public, anon;
grant execute on function public.is_admin () to authenticated;
grant execute on function public.review_tea (uuid, text, text) to authenticated;
grant execute on function public.set_tea_links (uuid, text, text) to authenticated;
grant execute on function public.merge_tea (uuid, uuid) to authenticated;
grant execute on function public.review_vendor (uuid, text, text) to authenticated;
grant execute on function public.reapply_as_vendor () to authenticated;
