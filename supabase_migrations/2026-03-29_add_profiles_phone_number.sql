alter table profiles add column if not exists phone_number text;
create unique index if not exists profiles_phone_number_key on profiles(phone_number);
