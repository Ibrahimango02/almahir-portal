"use client"

import { useEffect, useState } from "react"
import { StudentInvoicesTable } from "@/components/student-invoices-table"
import { getInvoicesByParentId } from "@/lib/get/get-invoices"
import { createClient } from "@/utils/supabase/client"
import { StudentInvoiceType } from "@/types"

export default function ParentInvoicesPage() {
    const [invoices, setInvoices] = useState<StudentInvoiceType[]>([])
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

    const fetchInvoices = async (parentId: string) => {
        try {
            const data = await getInvoicesByParentId(parentId)
            setInvoices(data || [])
        } catch {
            setInvoices([])
        }
    }

    useEffect(() => {
        if (currentUserId) {
            fetchInvoices(currentUserId)
        }
    }, [currentUserId])

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <div className="p-6">
                <StudentInvoicesTable
                    invoices={invoices}
                    onStatusUpdate={() => { if (currentUserId) fetchInvoices(currentUserId) }}
                />
            </div>
        </div>
    )
}
