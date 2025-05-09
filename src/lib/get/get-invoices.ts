import { createClient } from "@/utils/supabase/client"

export async function getInvoices() {
    const supabase = createClient()
    const { data, error } = await supabase.from('invoices').select('*')
    return data
}
