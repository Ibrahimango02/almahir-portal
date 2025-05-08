import { createClient } from "@/utils/supabase/client"

export async function updateClassSession(params: { sessionId: string; action: string; teacherNotes?: string }) {
    const supabase = createClient()
    const { sessionId, action, teacherNotes } = params

    try {
        switch (action.toLowerCase()) {
            case 'initiate': {
                // Create class history record and update session status
                const { error: historyError } = await supabase
                    .from('class_history')
                    .insert({
                        session_id: sessionId,
                        teacher_notes: teacherNotes
                    })

                if (historyError) throw historyError

                const { error: sessionError } = await supabase
                    .from('class_sessions')
                    .update({ status: 'pending' })
                    .eq('id', sessionId)

                if (sessionError) throw sessionError
                break
            }

            case 'start': {
                const now = new Date().toISOString()

                // Update class history with start time
                const { error: historyError } = await supabase
                    .from('class_history')
                    .update({ actual_start_time: now })
                    .eq('session_id', sessionId)

                if (historyError) throw historyError

                // Update session status
                const { error: sessionError } = await supabase
                    .from('class_sessions')
                    .update({ status: 'running' })
                    .eq('id', sessionId)

                if (sessionError) throw sessionError
                break
            }

            case 'end': {
                const now = new Date().toISOString()

                // Update class history with end time
                const { error: historyError } = await supabase
                    .from('class_history')
                    .update({
                        actual_end_time: now,
                        teacher_notes: teacherNotes
                    })
                    .eq('session_id', sessionId)

                if (historyError) throw historyError

                // Update session status
                const { error: sessionError } = await supabase
                    .from('class_sessions')
                    .update({ status: 'complete' })
                    .eq('id', sessionId)

                if (sessionError) throw sessionError
                break
            }

            case 'leave': {
                const { error: sessionError } = await supabase
                    .from('class_sessions')
                    .update({ status: 'cancelled' })
                    .eq('id', sessionId)

                if (sessionError) throw sessionError
                break
            }

            case 'absence': {
                const now = new Date().toISOString()
                // Update class history with end time
                const { error: historyError } = await supabase
                    .from('class_history')
                    .update({
                        actual_end_time: now,
                        teacher_notes: teacherNotes
                    })
                    .eq('session_id', sessionId)

                if (historyError) throw historyError

                const { error: sessionError } = await supabase
                    .from('class_sessions')
                    .update({ status: 'absence' })
                    .eq('id', sessionId)

                if (sessionError) throw sessionError
                break
            }

            default:
                throw new Error(`Invalid action: ${action}`)
        }

        return { success: true }
    } catch (error) {
        console.error('Error updating class:', error)
        return { success: false, error }
    }
}

