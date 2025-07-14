import { NextRequest, NextResponse } from 'next/server'
import { createSessionRemarks, updateSessionRemarks } from '@/lib/post/post-session-remarks'
import { getSessionRemarks } from '@/lib/get/get-session-remarks'

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

        const remarks = await getSessionRemarks(sessionId)

        return NextResponse.json({ remarks })
    } catch (error) {
        console.error('Error in GET /api/session-remarks/[sessionId]:', error)
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
        const { session_summary } = body

        if (!sessionId || !session_summary) {
            return NextResponse.json(
                { error: 'Session ID and session summary are required' },
                { status: 400 }
            )
        }

        const result = await createSessionRemarks({
            session_id: sessionId,
            session_summary
        })

        if (!result.success) {
            return NextResponse.json(
                { error: result.error?.message || 'Failed to create session remarks' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            remarks: result.data
        })
    } catch (error) {
        console.error('Error in POST /api/session-remarks/[sessionId]:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params
        const body = await request.json()
        const { session_summary } = body

        if (!sessionId || !session_summary) {
            return NextResponse.json(
                { error: 'Session ID and session summary are required' },
                { status: 400 }
            )
        }

        const result = await updateSessionRemarks({
            session_id: sessionId,
            session_summary
        })

        if (!result.success) {
            return NextResponse.json(
                { error: result.error?.message || 'Failed to update session remarks' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            remarks: result.data
        })
    } catch (error) {
        console.error('Error in PUT /api/session-remarks/[sessionId]:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 