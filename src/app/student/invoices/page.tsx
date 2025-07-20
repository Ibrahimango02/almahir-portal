"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StudentInvoicesTable } from "@/components/student-invoices-table"
import { getInvoicesByStudentId } from "@/lib/get/get-invoices"
import { createClient } from "@/utils/supabase/client"
import { StudentInvoiceType } from "@/types"

export default function StudentInvoicesPage() {
    const [invoices, setInvoices] = useState<StudentInvoiceType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        const getCurrentUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setCurrentUserId(user.id)
            }
        }
        getCurrentUser()
    }, [])

    const fetchInvoices = async (studentId: string) => {
        setIsLoading(true)
        try {
            const data = await getInvoicesByStudentId(studentId)
            setInvoices(data || [])
        } catch (error) {
            setInvoices([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (currentUserId) {
            fetchInvoices(currentUserId)
        }
    }, [currentUserId])

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">My Invoices</h1>
            <div className="p-6">
                <StudentInvoicesTable
                    invoices={invoices}
                    onStatusUpdate={() => { if (currentUserId) fetchInvoices(currentUserId) }}
                />
            </div>
        </div>
    )
}
