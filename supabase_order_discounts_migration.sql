-- =============================================
-- ORDER DISCOUNTS: fixed ₦ or % off per order
-- =============================================
-- total_amount stays the pre-discount charge.
-- discount_type: 'fixed' | 'percent' | NULL (no discount)
-- discount_value: Naira amount when fixed, 0–100 when percent

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS discount_type text NULL,
    ADD COLUMN IF NOT EXISTS discount_value numeric NOT NULL DEFAULT 0;

ALTER TABLE public.orders
    DROP CONSTRAINT IF EXISTS orders_discount_type_check;

ALTER TABLE public.orders
    ADD CONSTRAINT orders_discount_type_check
    CHECK (discount_type IS NULL OR discount_type IN ('fixed', 'percent'));
