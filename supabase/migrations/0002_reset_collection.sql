-- Township Card Manager — "complete the set, go again" (lap) support
-- Run this once in the Supabase SQL editor after 0001_init.sql.

create table collection_resets (
  id bigserial primary key,
  member_name text not null references roster(name),
  catalog_version_id text not null references catalog_versions(id),
  lap_number int not null,
  reset_at timestamptz not null default now()
);

alter table collection_resets enable row level security;

-- Public read, same as ownership/send_log — everyone can see everyone's lap.
-- No insert/update policy: writes only happen via the reset_collection RPC below.
create policy "read collection_resets" on collection_resets for select using (true);

create or replace function reset_collection(p_member text, p_passphrase text) returns void as $$
declare
  v_catalog_version_id text;
  v_lap int;
begin
  perform check_passphrase(p_passphrase);

  select id into v_catalog_version_id from catalog_versions where is_active = true limit 1;
  if v_catalog_version_id is null then
    raise exception 'No active catalog version found';
  end if;

  select count(*) + 1 into v_lap
    from collection_resets
    where member_name = p_member and catalog_version_id = v_catalog_version_id;

  insert into collection_resets (member_name, catalog_version_id, lap_number)
  values (p_member, v_catalog_version_id, v_lap);

  update ownership set owned = false, updated_at = now()
    where member_name = p_member
      and card_id in (select id from cards where catalog_version_id = v_catalog_version_id);
end;
$$ language plpgsql security definer;
