"use client"

import { TeacherPaymentsTable } from "@/components/teacher-payments-table"
import { getProfile } from "@/lib/get/get-profiles"
import { getTeacherPaymentsByTeacherId } from "@/lib/get/get-teacher-payments"
import { useEffect, useState } from "react"
import { TeacherPaymentType } from "@/types"

export default function TeacherPaymentsPage() {
    const [payments, setPayments] = useState<TeacherPaymentType[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchPayments() {
            setLoading(true)
            try {
                const profile = await getProfile()
                const teacherId = profile?.id
                if (teacherId) {
                    const data = await getTeacherPaymentsByTeacherId(teacherId)
                    if (data) {
                        setPayments(data || [])
                    }
                }
            } finally {
                setLoading(false)
            }
        }
        fetchPayments()
    }, [])

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
            <div className="p-6">
                <TeacherPaymentsTable payments={payments} onStatusUpdate={() => { }} />
            </div>
        </div>
    )
} 