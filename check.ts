import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fnbbfahrihlpuynbvhsm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuYmJmYWhyaWhscHV5bmJ2aHNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAwMDU1MiwiZXhwIjoyMDgyNTc2NTUyfQ.XFQb_TQ0wDyujmnF0U6NSMRwxusEMNQf_YnvBswosGo'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    console.log("Checking orders...")
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, clients(name)')
        .neq('status', 'ready')
        .neq('status', 'delivered')

    if (ordersError) console.error("ordersError:", ordersError)
    else console.log("Orders count:", orders?.length)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tenantNotifications: Record<string, string[]> = {}

    orders?.forEach(order => {
        const deliveryDate = new Date(order.delivery_date)
        deliveryDate.setHours(0, 0, 0, 0)
        
        const diffTime = deliveryDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        console.log(`Order ${order.id} for ${order.clients?.name} - Delivery Date: ${order.delivery_date} - DiffDays: ${diffDays}`)

        let message = null
        if (diffDays < 0) {
            message = `🔴 OVERDUE: ${order.clients?.name}'s order (${order.fabric_description}) was due ${Math.abs(diffDays)} days ago!`
        } else if (diffDays === 0) {
            message = `🚨 DUE TODAY: ${order.clients?.name}'s order (${order.fabric_description}) is due today!`
        } else if (diffDays === 1) {
            message = `⚠️ DUE TOMORROW: ${order.clients?.name}'s order (${order.fabric_description})`
        } else if (diffDays === 2) {
            message = `📅 DUE IN 2 DAYS: ${order.clients?.name}'s order (${order.fabric_description})`
        }

        if (message) {
            if (!tenantNotifications[order.tenant_id]) {
                tenantNotifications[order.tenant_id] = []
            }
            tenantNotifications[order.tenant_id].push(message)
        }
    })

    console.log("Tenants with notifications:", Object.keys(tenantNotifications))

    console.log("Checking push_subscriptions...")
    const { data: subs, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')

    if (subError) console.error("subError:", subError)
    else console.log("Subscriptions count:", subs?.length)
    console.log("Subscriptions:", subs)
}

check()
