-- Contact page messages are saved as enquiries too; a phone number is optional for them.
alter table public.enquiries drop constraint if exists enquiries_type_check;
alter table public.enquiries add constraint enquiries_type_check check (type in ('Sponsorship', 'Exhibition', 'Volunteer', 'Contact'));
alter table public.enquiries alter column phone drop not null;
