import { NextRequest, NextResponse } from 'next/server'
import { upsertStudentSessionNotes } from '@/lib/post/post-student-session-notes'
import { getStudentSessionNotesWithStudents } from '@/lib/get/get-session-remarks'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            )
        }

        const notes = await getStudentSessionNotesWithStudents(sessionId)

        return NextResponse.json({ notes })
    } catch (error) {
        console.error('Error in GET /api/student-session-notes/[sessionId]:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params
        const body = await request.json()
        const { student_notes } = body // Array of student notes

        if (!sessionId || !student_notes || !Array.isArray(student_notes)) {
            return NextResponse.json(
                { error: 'Session ID and student notes array are required' },
                { status: 400 }
            )
        }

        const results = []
        const errors = []

        // Process each student note
        for (const note of student_notes) {
            const { student_id, notes, performance_rating, participation_level } = note

            if (!student_id) {
                errors.push(`Student ID is required for note: ${JSON.stringify(note)}`)
                continue
            }

            const result = await upsertStudentSessionNotes({
                session_id: sessionId,
                student_id,
                notes,
                performance_rating,
                participation_level
            })

            if (result.success) {
                results.push(result.data)
            } else {
                errors.push(result.error?.message || 'Failed to save student note')
            }
        }

        if (errors.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Some notes failed to save',
                    details: errors,
                    saved_notes: results
                },
                { status: 207 } // Multi-status
            )
        }

        return NextResponse.json({
            success: true,
            notes: results
        })
    } catch (error) {
        console.error('Error in POST /api/student-session-notes/[sessionId]:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 