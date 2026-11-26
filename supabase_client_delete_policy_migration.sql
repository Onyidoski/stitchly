-- =============================================
-- CLIENT DELETE POLICY: let a business delete its own clients
-- =============================================
-- Powers the "Delete Client" button and Settings -> "Clear all data".
-- Same rule the expenses table uses: a signed-in user may only delete rows
-- that belong to their own business (tenant).
--
-- Safe to run more than once. If your database already allows deleting
-- clients, this simply replaces itself with the same rule.

DROP POLICY IF EXISTS "Users can delete their own tenant clients" ON public.clients;

CREATE POLICY "Users can delete their own tenant clients"
    ON public.clients FOR DELETE
    USING (tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    ));
