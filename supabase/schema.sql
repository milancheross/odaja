-- Run once in the ODAJA Supabase SQL editor.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 40),
  city text not null default 'Beograd' check (city in ('Beograd', 'Novi Sad')),
  kind text not null default 'solo' check (kind in ('solo', 'couple')),
  bio text not null default '' check (char_length(bio) <= 1000),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select, update on public.profiles to authenticated;
create policy "Read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Edit own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create function public.create_member_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, nickname)
  values(new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'nickname'), ''), 'Član'), 40));
  return new;
end;
$$;
revoke execute on function public.create_member_profile() from public, anon, authenticated;
create trigger on_member_created after insert on auth.users for each row execute function public.create_member_profile();

-- Three fixed object paths enforce the limit during concurrent uploads.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos','profile-photos',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy "Own three photo slots" on storage.objects for insert to authenticated
with check (bucket_id = 'profile-photos' and name in (auth.uid()::text || '/1', auth.uid()::text || '/2', auth.uid()::text || '/3'));
create policy "Read own photos" on storage.objects for select to authenticated
using (bucket_id = 'profile-photos' and name in (auth.uid()::text || '/1', auth.uid()::text || '/2', auth.uid()::text || '/3'));
create policy "Replace own photos" on storage.objects for update to authenticated
using (bucket_id = 'profile-photos' and name in (auth.uid()::text || '/1', auth.uid()::text || '/2', auth.uid()::text || '/3'))
with check (bucket_id = 'profile-photos' and name in (auth.uid()::text || '/1', auth.uid()::text || '/2', auth.uid()::text || '/3'));
create policy "Delete own photos" on storage.objects for delete to authenticated
using (bucket_id = 'profile-photos' and name in (auth.uid()::text || '/1', auth.uid()::text || '/2', auth.uid()::text || '/3'));
