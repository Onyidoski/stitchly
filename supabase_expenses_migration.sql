-- =============================================
-- EXPENSES TABLE: Track per-order expenses
-- =============================================

-- Create the expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'other',
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_order_id ON public.expenses(order_id);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON public.expenses(tenant_id);

-- Enable Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/manage expenses for their own tenant
CREATE POLICY "Users can view their own tenant expenses"
    ON public.expenses FOR SELECT
    USING (tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert expenses for their own tenant"
    ON public.expenses FOR INSERT
    WITH CHECK (tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update their own tenant expenses"
    ON public.expenses FOR UPDATE
    USING (tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete their own tenant expenses"
    ON public.expenses FOR DELETE
    USING (tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    ));
