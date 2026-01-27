import { createClient } from "@/utils/supabase/client"

export async function updateModerator(moderatorId: string, data: {
    status: string
    phone?: string | null
    notes?: string | null
    payment_method?: string | null
    payment_account?: string | null
}) {
    const supabase = createClient()

    // Validate input
    if (!moderatorId) {
        throw new Error('Moderator ID is required')
    }

    try {
        // Update profile table
        const updateProfileData: { status: string; updated_at: string; phone?: string | null } = {
            status: data.status,
            updated_at: new Date().toISOString()
        }

        if (data.phone !== undefined) {
            updateProfileData.phone = data.phone || null
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .update(updateProfileData)
            .eq('id', moderatorId)
            .eq('role', 'moderator')

        if (profileError) {
            throw new Error(`Failed to update moderator profile: ${profileError.message}`)
        }

        // Update moderators table
        const updateModeratorData: {
            notes?: string | null
            payment_method?: string | null
            payment_account?: string | null
            updated_at: string
        } = {
            updated_at: new Date().toISOString()
        }

        if (data.notes !== undefined) {
            updateModeratorData.notes = data.notes || null
        }
        if (data.payment_method !== undefined) {
            updateModeratorData.payment_method = data.payment_method || null
        }
        if (data.payment_account !== undefined) {
            updateModeratorData.payment_account = data.payment_account || null
        }

        const { error: moderatorError } = await supabase
            .from('moderators')
            .update(updateModeratorData)
            .eq('profile_id', moderatorId)

        if (moderatorError) {
            throw new Error(`Failed to update moderator details: ${moderatorError.message}`)
        }

        return { success: true }
    } catch (error) {
        console.error('Error in updateModerator:', error)
        throw error
    }
}

