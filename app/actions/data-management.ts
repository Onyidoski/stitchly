'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

// Shown when Supabase refuses a delete without raising an error (RLS just
// filters the rows out). The migration file lives in the project root.
const PERMISSION_HINT =
    'Your database may be missing delete permission on clients. ' +
    'Run supabase_client_delete_policy_migration.sql in the Supabase SQL editor, then try again.'

export type DeleteClientResult =
    | { ok: true }
    | { ok: false; error: string }

export type ClearAllDataResult =
    | { ok: true; deleted: { clients: number; orders: number; measurements: number; expenses: number } }
    | { ok: false; error: string }

/**
 * Resolve the signed-in user's business (tenant) from their session.
 * The tenant id is never taken from the browser, so one business can't be
 * pointed at another business's data.
 */
async function getTenantContext() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false as const, error: 'Please log in again.' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { ok: false as const, error: 'Business profile not found.' }

    return { ok: true as const, supabase, tenantId: profile.tenant_id as string }
}

function revalidateEverything() {
    revalidatePath('/', 'layout')
}

/**
 * Delete one client together with everything that belongs to them:
 * their expenses, orders (and so their invoices/receipts) and measurements.
 *
 * Children are removed first and the client last, so this works whether or not
 * the database has ON DELETE CASCADE. Every step is safe to repeat, so if one
 * fails the user can simply try again.
 */
export async function deleteClient(clientId: string): Promise<DeleteClientResult> {
    if (!clientId || typeof clientId !== 'string') {
        return { ok: false, error: 'Missing client.' }
    }

    const ctx = await getTenantContext()
    if (!ctx.ok) return { ok: false, error: ctx.error }
    const { supabase, tenantId } = ctx

    const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .eq('tenant_id', tenantId)
        .maybeSingle()

    if (!client) return { ok: false, error: 'Client not found.' }

    // 1. Expenses attached to this client's orders
    const { data: orders, error: ordersLookupError } = await supabase
        .from('orders')
        .select('id')
        .eq('client_id', clientId)
        .eq('tenant_id', tenantId)

    if (ordersLookupError) {
        console.error('deleteClient: order lookup failed', ordersLookupError)
        return { ok: false, error: 'Could not look up this client\'s orders. Nothing was deleted.' }
    }

    const orderIds = (orders ?? []).map((o) => o.id as string)
    // Chunked so a client with a very long history can't overflow the request URL.
    for (let i = 0; i < orderIds.length; i += 100) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('tenant_id', tenantId)
            .in('order_id', orderIds.slice(i, i + 100))

        if (error) {
            console.error('deleteClient: expenses delete failed', error)
            return { ok: false, error: 'Could not delete this client\'s expenses. Please try again.' }
        }
    }

    // 2. Orders
    const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .eq('client_id', clientId)
        .eq('tenant_id', tenantId)

    if (ordersError) {
        console.error('deleteClient: orders delete failed', ordersError)
        return { ok: false, error: 'Could not delete this client\'s orders. Please try again.' }
    }

    // 3. Measurements
    const { error: measurementsError } = await supabase
        .from('measurements')
        .delete()
        .eq('client_id', clientId)
        .eq('tenant_id', tenantId)

    if (measurementsError) {
        console.error('deleteClient: measurements delete failed', measurementsError)
        return { ok: false, error: 'Could not delete this client\'s measurements. Please try again.' }
    }

    // 4. The client itself. count === 0 means RLS silently blocked it.
    const { error: clientError, count } = await supabase
        .from('clients')
        .delete({ count: 'exact' })
        .eq('id', clientId)
        .eq('tenant_id', tenantId)

    if (clientError) {
        console.error('deleteClient: client delete failed', clientError)
        return { ok: false, error: `Could not delete the client. ${PERMISSION_HINT}` }
    }
    if (!count) {
        return { ok: false, error: `The client was not deleted. ${PERMISSION_HINT}` }
    }

    revalidateEverything()
    return { ok: true }
}

/**
 * Wipe all business data for the signed-in user's business so they can start
 * afresh: clients, measurements, orders (invoices/receipts) and expenses
 * (including global expenses that aren't tied to an order).
 *
 * Deliberately KEPT: the business profile (name, phone, address, slogan, logo,
 * bank accounts), the user's login, and push-notification subscriptions.
 */
export async function clearAllData(): Promise<ClearAllDataResult> {
    const ctx = await getTenantContext()
    if (!ctx.ok) return { ok: false, error: ctx.error }
    const { supabase, tenantId } = ctx

    // Order matters: expenses point at orders, orders and measurements point at
    // clients. Each step is safe to repeat if a later one fails.
    const steps = ['expenses', 'orders', 'measurements', 'clients'] as const
    const deleted = { clients: 0, orders: 0, measurements: 0, expenses: 0 }

    for (const table of steps) {
        const { error, count } = await supabase
            .from(table)
            .delete({ count: 'exact' })
            .eq('tenant_id', tenantId)

        if (error) {
            console.error(`clearAllData: ${table} delete failed`, error)
            revalidateEverything()
            return {
                ok: false,
                error: `Could not clear ${table}. Some data may already have been removed, so run it again to finish.`,
            }
        }
        deleted[table] = count ?? 0
    }

    // Verify nothing is left behind (RLS can silently skip rows without an error).
    const leftovers: string[] = []
    for (const table of steps) {
        const { count } = await supabase
            .from(table)
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)

        if (count) leftovers.push(`${count} ${table}`)
    }

    revalidateEverything()

    if (leftovers.length > 0) {
        return {
            ok: false,
            error: `Some data could not be removed (${leftovers.join(', ')}). ${PERMISSION_HINT}`,
        }
    }

    return { ok: true, deleted }
}
