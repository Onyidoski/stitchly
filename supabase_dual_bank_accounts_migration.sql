-- =============================================
-- DUAL BANK ACCOUNTS: optional second account on tenants
-- =============================================
-- Account 1 stays bank_name / account_name / account_number.
-- Account 2 is optional and shown on invoices/receipts when set.

ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS bank_name_2 text NULL,
    ADD COLUMN IF NOT EXISTS account_name_2 text NULL,
    ADD COLUMN IF NOT EXISTS account_number_2 text NULL;
