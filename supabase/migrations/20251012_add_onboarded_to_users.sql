-- Add onboarded flag to users to track onboarding completion
alter table public.users
  add column if not exists onboarded boolean default false;

comment on column public.users.onboarded is 'Has the user completed onboarding?';
