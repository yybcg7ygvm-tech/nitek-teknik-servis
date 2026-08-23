-- NİTEK PRO V21: Yeni Servis randevu alanları
alter table public.servis_kayitlari add column if not exists servis_saati time;
alter table public.servis_kayitlari add column if not exists servis_adresi text;
alter table public.servis_kayitlari add column if not exists cihaz_turu text;
alter table public.servis_kayitlari add column if not exists marka text;
alter table public.servis_kayitlari add column if not exists model text;
alter table public.servis_kayitlari add column if not exists ariza_kodu text;
alter table public.servis_kayitlari add column if not exists odeme_durumu text default 'Ödenmedi';
alter table public.servis_kayitlari add column if not exists parca_ucreti numeric(12,2) default 0;
alter table public.servis_kayitlari add column if not exists iscilik_ucreti numeric(12,2) default 0;
alter table public.servis_kayitlari add column if not exists degisen_parca text;
