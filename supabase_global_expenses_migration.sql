-- =============================================
-- GLOBAL EXPENSES: Allow expenses not tied to an order
-- =============================================
-- Bulk purchases (e.g. accessories bought in bulk, not for a
-- specific order) are stored as rows where order_id IS NULL.
-- tenant_id stays NOT NULL so RLS and aggregation keep working.

ALTER TABLE public.expenses ALTER COLUMN order_id DROP NOT NULL;

-- Partial index to speed up "global expenses" lookups
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_global
    ON public.expenses(tenant_id)
    WHERE order_id IS NULL;
