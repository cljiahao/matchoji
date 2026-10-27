-- Photo credit: who a tea's packshot comes from, shown under it on the tea's page. Set by
-- admins together with the photo, so a suggested tea arrives without one, like its photo.

alter table public.products
add column image_credit text
  check (image_credit is null or char_length(btrim(image_credit)) between 1 and 120);

drop policy "signed-in users can suggest teas for review" on public.products;
create policy "signed-in users can suggest teas for review"
  on public.products for insert
  to authenticated
  with check (
    status = 'pending'
    and added_by = auth.uid ()
    and reviewed_at is null
    and image_url is null
    and image_credit is null
    and shop_url is null
    and merged_into is null
    and review_note is null
    and price_sgd is null
    and pack_grams is null
  );

-- A null image keeps the current photo (the credit argument still applies, so a credit can
-- be corrected on its own); an empty image clears the photo and the credit together.
drop function public.set_tea_links (uuid, text, text);
create function public.set_tea_links (tea uuid, image text, shop text, credit text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin ();
  update public.products
  set image_url = case when image is null then image_url else nullif(btrim(image), '') end,
    image_credit = case when btrim(image) = '' then null else nullif(btrim(credit), '') end,
    shop_url = nullif(btrim(shop), '')
  where id = tea;
  if not found then
    raise exception 'No such tea.' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.set_tea_links (uuid, text, text, text) from public, anon;
grant execute on function public.set_tea_links (uuid, text, text, text) to authenticated;
