import { createClient } from '@/utils/supabase/client'
import { ResourceType } from '@/types'

export async function getResources(): Promise<ResourceType[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch resources: ${error.message}`)
    }

    return data || []
}

export async function getResourcesByUser(userId: string): Promise<ResourceType[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch user resources: ${error.message}`)
    }

    return data || []
}