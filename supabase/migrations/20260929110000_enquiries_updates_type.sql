-- Footer "Updates" sign-ups are stored as enquiries of type 'Updates'.
alter table public.enquiries drop constraint if exists enquiries_type_check;
alter table public.enquiries add constraint enquiries_type_check check (type in ('Sponsorship', 'Exhibition', 'Volunteer', 'Contact', 'Updates'));
