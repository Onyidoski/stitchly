import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fnbbfahrihlpuynbvhsm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuYmJmYWhyaWhscHV5bmJ2aHNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAwMDU1MiwiZXhwIjoyMDgyNTc2NTUyfQ.XFQb_TQ0wDyujmnF0U6NSMRwxusEMNQf_YnvBswosGo'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fix() {
    console.log("Fetching profile for the user...")
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', '0843a56e-6a60-4328-a0a2-dfab89c9378c')
        .single()
        
    console.log("User tenant ID:", profile?.tenant_id)
    
    if (profile?.tenant_id) {
        console.log("Updating old push subscriptions...")
        const { error } = await supabase
            .from('push_subscriptions')
            .update({ tenant_id: profile.tenant_id })
            .is('tenant_id', null)
            
        if (error) console.error("Error updating:", error)
        else console.log("Successfully updated all old subscriptions to have the correct tenant_id.")
    }
}

fix()
