import { createClient } from "@/utils/supabase/client"

export async function deleteClass(classId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    try {
        // Delete the class - if CASCADE DELETE is configured, related records will be deleted automatically
        const { error: classError } = await supabase
            .from('classes')
            .delete()
            .eq('id', classId)

        if (classError) {
            console.error('Error deleting class:', classError)
            return { success: false, error: `Failed to delete class: ${classError.message}` }
        }

        return { success: true }
    } catch (error) {
        console.error('Unexpected error in deleteClass:', error)
        return { success: false, error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
}

export async function deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    try {
        // Delete the session - related records should be deleted automatically if CASCADE DELETE is configured
        const { error: sessionError } = await supabase
            .from('class_sessions')
            .delete()
            .eq('id', sessionId)

        if (sessionError) {
            console.error('Error deleting session:', sessionError)
            return { success: false, error: `Failed to delete session: ${sessionError.message}` }
        }

        return { success: true }
    } catch (error) {
        console.error('Unexpected error in deleteSession:', error)
        return { success: false, error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
}



