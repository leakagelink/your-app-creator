create table public.app_release (
  id int primary key default 1 check (id = 1),
  apk_path text, version text, file_size bigint,
  updated_at timestamptz not null default now()
);
insert into public.app_release (id) values (1);
alter table public.app_release enable row level security;
grant select on public.app_release to anon, authenticated;
grant update on public.app_release to authenticated;
create policy "anyone reads release" on public.app_release for select using (true);
create policy "admin updates release" on public.app_release for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "anyone reads apk" on storage.objects for select using (bucket_id = 'app-apk');
create policy "admin upload apk" on storage.objects for insert to authenticated with check (bucket_id = 'app-apk' and public.has_role(auth.uid(),'admin'));
create policy "admin delete apk" on storage.objects for delete to authenticated using (bucket_id = 'app-apk' and public.has_role(auth.uid(),'admin'));