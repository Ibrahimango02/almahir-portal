import { NextRequest, NextResponse } from 'next/server'
import { testEmailConnection } from '@/lib/utils/email'

export async function GET(request: NextRequest) {
    try {
        const isConnected = await testEmailConnection()

        if (isConnected) {
            return NextResponse.json({
                success: true,
                message: 'Email configuration is working correctly'
            })
        } else {
            return NextResponse.json({
                success: false,
                message: 'Email configuration failed'
            }, { status: 500 })
        }
    } catch (error) {
        console.error('Email test error:', error)
        return NextResponse.json({
            success: false,
            message: 'Email test failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}   