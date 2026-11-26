-- =============================================
-- CLIENT GENDER: allow "child"
-- =============================================
-- The Add Client / Edit Client forms offer Female, Male, Child and Other,
-- but the original database rule only accepted male, female and other, so
-- saving a client as "Child" was rejected by the database.
--
-- Already applied to the live Stitchly Supabase project (migration name:
-- allow_child_gender_on_clients). Kept here so a fresh database can be set up
-- the same way. Safe to run more than once.

ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_gender_check;

ALTER TABLE public.clients
    ADD CONSTRAINT clients_gender_check
    CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'child'::text, 'other'::text]));
