-- Township Card Manager — initial schema
-- Run this once in the Supabase SQL editor for a new project.

create extension if not exists pgcrypto;

create table catalog_versions (
  id text primary key,          -- e.g. '2026-07'
  label text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table categories (
  id text primary key,          -- e.g. '2026-07-garden'
  catalog_version_id text not null references catalog_versions(id),
  name text not null,
  sort_order int not null default 0
);

create table cards (
  id text primary key,          -- e.g. '2026-07-garden-shovel'
  category_id text not null references categories(id),
  catalog_version_id text not null references catalog_versions(id),
  name text not null,
  rarity text not null check (rarity in
    ('one_star', 'two_star', 'three_star', 'four_star', 'five_star', 'gold', 'diamond')),
  sort_order int not null default 0
);

create table roster (
  name text primary key,
  created_at timestamptz not null default now()
);

create table ownership (
  member_name text not null references roster(name),
  card_id text not null references cards(id),
  owned boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (member_name, card_id)
);

create table send_log (
  id bigserial primary key,
  sender_name text not null references roster(name),
  recipient_name text not null references roster(name),
  card_id text not null references cards(id),
  sent_at timestamptz not null default now(),
  undone boolean not null default false,
  undone_at timestamptz,
  owned_before_send boolean not null default false
);

-- Single-row table holding the shared passphrase hash. Populate manually after
-- running this migration:
--   insert into app_secrets (passphrase_hash) values (crypt('choose-a-passphrase', gen_salt('bf')));
create table app_secrets (
  id boolean primary key default true check (id),
  passphrase_hash text not null
);

-- Row Level Security -----------------------------------------------------

alter table catalog_versions enable row level security;
alter table categories enable row level security;
alter table cards enable row level security;
alter table roster enable row level security;
alter table ownership enable row level security;
alter table send_log enable row level security;
alter table app_secrets enable row level security;

-- Catalog/roster: public read only. All writes happen via the service-role
-- sync script (scripts/syncCatalog.ts), which bypasses RLS.
create policy "read catalog_versions" on catalog_versions for select using (true);
create policy "read categories" on categories for select using (true);
create policy "read cards" on cards for select using (true);
create policy "read roster" on roster for select using (true);

-- Ownership & send_log: public read. No direct insert/update policies are
-- defined for the anon role, so all writes must go through the
-- SECURITY DEFINER RPC functions below, which check the shared passphrase.
create policy "read ownership" on ownership for select using (true);
create policy "read send_log" on send_log for select using (true);

-- app_secrets: no policies at all — not even select — so it is completely
-- inaccessible to the anon role. Only SECURITY DEFINER functions can read it.

-- Passphrase check ---------------------------------------------------------

create or replace function check_passphrase(p_passphrase text) returns void as $$
begin
  if not exists (
    select 1 from app_secrets where passphrase_hash = crypt(p_passphrase, passphrase_hash)
  ) then
    raise exception 'Invalid passphrase';
  end if;
end;
$$ language plpgsql security definer;

-- Gold/diamond send guard (defense in depth; UI also filters these out) ---

create or replace function trg_a_prevent_gold_diamond_send() returns trigger as $$
declare
  v_rarity text;
begin
  select rarity into v_rarity from cards where id = new.card_id;
  if v_rarity in ('gold', 'diamond') then
    raise exception 'Gold and Diamond cards cannot be sent';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_a_prevent_gold_diamond_send
before insert on send_log for each row
execute function trg_a_prevent_gold_diamond_send();

-- Auto-set recipient ownership on send ------------------------------------

create or replace function trg_b_handle_send_insert() returns trigger as $$
declare
  v_owned boolean;
begin
  select coalesce(owned, false) into v_owned
    from ownership where member_name = new.recipient_name and card_id = new.card_id;
  new.owned_before_send := coalesce(v_owned, false);

  insert into ownership (member_name, card_id, owned)
  values (new.recipient_name, new.card_id, true)
  on conflict (member_name, card_id) do update set owned = true, updated_at = now();

  return new;
end;
$$ language plpgsql;

-- trg_a_/trg_b_ prefixes ensure Postgres's alphabetical BEFORE-trigger
-- ordering runs the gold/diamond guard before the ownership side-effect.
create trigger trg_b_handle_send_insert
before insert on send_log for each row
execute function trg_b_handle_send_insert();

-- Write RPCs (gated by shared passphrase) ---------------------------------

create or replace function set_ownership(
  p_member text, p_card_id text, p_owned boolean, p_passphrase text
) returns void as $$
begin
  perform check_passphrase(p_passphrase);
  insert into ownership (member_name, card_id, owned)
  values (p_member, p_card_id, p_owned)
  on conflict (member_name, card_id) do update set owned = p_owned, updated_at = now();
end;
$$ language plpgsql security definer;

create or replace function log_send(
  p_sender text, p_recipient text, p_card_id text, p_passphrase text
) returns void as $$
begin
  perform check_passphrase(p_passphrase);
  insert into send_log (sender_name, recipient_name, card_id) values (p_sender, p_recipient, p_card_id);
end;
$$ language plpgsql security definer;

create or replace function undo_send(p_send_id bigint, p_passphrase text) returns void as $$
declare
  v_send send_log%rowtype;
  v_other_active int;
begin
  perform check_passphrase(p_passphrase);

  select * into v_send from send_log where id = p_send_id and undone = false;
  if not found then
    raise exception 'Send not found or already undone';
  end if;

  update send_log set undone = true, undone_at = now() where id = p_send_id;

  if v_send.owned_before_send = false then
    select count(*) into v_other_active
      from send_log
      where recipient_name = v_send.recipient_name
        and card_id = v_send.card_id
        and undone = false
        and id != p_send_id;
    if v_other_active = 0 then
      update ownership set owned = false, updated_at = now()
        where member_name = v_send.recipient_name and card_id = v_send.card_id;
    end if;
  end if;
end;
$$ language plpgsql security definer;
