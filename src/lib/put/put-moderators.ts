import { createClient } from "@/utils/supabase/client"

export async function updateModerator(moderatorId: string, data: {
    status: string
    phone?: string | null
}) {
    const supabase = createClient()

    // Validate input
    if (!moderatorId) {
        throw new Error('Moderator ID is required')
    }

    try {
        const updateData: { status: string; updated_at: string; phone?: string | null } = {
            status: data.status,
            updated_at: new Date().toISOString()
        }
        
        if (data.phone !== undefined) {
            updateData.phone = data.phone || null
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', moderatorId)
            .eq('role', 'moderator')

        if (profileError) {
            throw new Error(`Failed to update moderator: ${profileError.message}`)
        }

        return { success: true }
    } catch (error) {
        console.error('Error in updateModerator:', error)
        throw error
    }
}

