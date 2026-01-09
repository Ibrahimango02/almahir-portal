"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TeacherPaymentSessionsTable } from "@/components/teacher-payment-sessions-table"
import { getTeacherPaymentsByTeacherId } from "@/lib/get/get-teacher-payments"
import { TeacherPaymentType } from "@/types"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/back-button"

export default function TeacherPaymentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const teacherId = params.teacherId as string
    const [payments, setPayments] = useState<TeacherPaymentType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [teacherName, setTeacherName] = useState<string>("")

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const paymentsData = await getTeacherPaymentsByTeacherId(teacherId)

                if (paymentsData && paymentsData.length > 0) {
                    setPayments(paymentsData)
                    // Get teacher name from first payment
                    const firstPayment = paymentsData[0]
                    if (firstPayment.teacher) {
                        setTeacherName(`${firstPayment.teacher.first_name} ${firstPayment.teacher.last_name}`)
                    }
                } else {
                    setPayments([])
                }
            } catch (err) {
                console.error('Error fetching teacher payment data:', err)
                setError('Failed to load teacher payment data')
            } finally {
                setLoading(false)
            }
        }

        if (teacherId) {
            fetchData()
        }
    }, [teacherId])

    const handlePaymentsUpdate = async () => {
        try {
            const updatedPayments = await getTeacherPaymentsByTeacherId(teacherId)
            if (updatedPayments) {
                setPayments(updatedPayments)
            }
        } catch (err) {
            console.error('Error refreshing payments:', err)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <BackButton href="/admin/accounting" label="Back to Accounting" />
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground">
                            <p>Loading...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <BackButton href="/admin/accounting" label="Back to Accounting" />
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-red-600">
                            <p>{error}</p>
                            <Button
                                onClick={() => router.refresh()}
                                className="mt-4"
                            >
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <BackButton href="/admin/accounting" label="Back to Accounting" />
            </div>

            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {teacherName ? `${teacherName}'s Payments` : 'Teacher Payments'}
                </h1>
            </div>

            {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No payments found for this teacher</p>
                </div>
            ) : (
                <Tabs defaultValue="pending" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="paid">Paid</TabsTrigger>
                        <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="space-y-4">
                        <TeacherPaymentSessionsTable
                            payments={payments.filter(p => p.status === 'pending')}
                            onStatusUpdate={handlePaymentsUpdate}
                        />
                    </TabsContent>

                    <TabsContent value="paid" className="space-y-4">
                        <TeacherPaymentSessionsTable
                            payments={payments.filter(p => p.status === 'paid')}
                            onStatusUpdate={handlePaymentsUpdate}
                        />
                    </TabsContent>

                    <TabsContent value="cancelled" className="space-y-4">
                        <TeacherPaymentSessionsTable
                            payments={payments.filter(p => p.status === 'cancelled')}
                            onStatusUpdate={handlePaymentsUpdate}
                        />
                    </TabsContent>
                </Tabs>
            )}
        </div >
    )
}

