"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TeacherPaymentSessionsTable } from "@/components/teacher-payment-sessions-table"
import { getTeacherPaymentsByTeacherId } from "@/lib/get/get-teacher-payments"
import { TeacherPaymentType } from "@/types"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/back-button"
import { format, parseISO } from "date-fns"
import { ChevronDown, ChevronUp } from "lucide-react"

export default function TeacherPaymentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const teacherId = params.teacherId as string
    const [payments, setPayments] = useState<TeacherPaymentType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [teacherName, setTeacherName] = useState<string>("")
    const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set())

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

    // Group payments by month based on session start_date
    const groupPaymentsByMonth = (paymentsToGroup: TeacherPaymentType[]) => {
        const grouped: Record<string, TeacherPaymentType[]> = {}

        paymentsToGroup.forEach(payment => {
            if (!payment.session?.start_date) {
                // If no start_date, group under "Unknown"
                const key = "Unknown"
                if (!grouped[key]) {
                    grouped[key] = []
                }
                grouped[key].push(payment)
                return
            }

            try {
                const date = parseISO(payment.session.start_date)
                const monthKey = format(date, "yyyy-MM") // e.g., "2024-01"

                if (!grouped[monthKey]) {
                    grouped[monthKey] = []
                }
                grouped[monthKey].push(payment)
            } catch {
                // If date parsing fails, group under "Unknown"
                const key = "Unknown"
                if (!grouped[key]) {
                    grouped[key] = []
                }
                grouped[key].push(payment)
            }
        })

        // Convert to array and sort by month (newest first)
        return Object.entries(grouped)
            .map(([key, payments]) => ({
                monthKey: key,
                monthLabel: key === "Unknown" ? "Unknown" : format(parseISO(`${key}-01`), "MMMM yyyy"),
                payments: payments.sort((a, b) => {
                    if (!a.session?.start_date || !b.session?.start_date) return 0
                    try {
                        return parseISO(b.session.start_date).getTime() - parseISO(a.session.start_date).getTime()
                    } catch {
                        return 0
                    }
                })
            }))
            .sort((a, b) => {
                if (a.monthKey === "Unknown") return 1
                if (b.monthKey === "Unknown") return -1
                return b.monthKey.localeCompare(a.monthKey) // Newest first
            })
    }

    // Memoize grouped payments by status
    const pendingByMonth = useMemo(() => groupPaymentsByMonth(payments.filter(p => p.status === 'pending')), [payments])
    const paidByMonth = useMemo(() => groupPaymentsByMonth(payments.filter(p => p.status === 'paid')), [payments])
    const cancelledByMonth = useMemo(() => groupPaymentsByMonth(payments.filter(p => p.status === 'cancelled')), [payments])

    const toggleMonth = (monthKey: string) => {
        setCollapsedMonths(prev => {
            const newSet = new Set(prev)
            if (newSet.has(monthKey)) {
                newSet.delete(monthKey)
            } else {
                newSet.add(monthKey)
            }
            return newSet
        })
    }

    const isMonthCollapsed = (monthKey: string) => collapsedMonths.has(monthKey)

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

                    <TabsContent value="pending" className="space-y-6">
                        {pendingByMonth.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No pending payments</p>
                            </div>
                        ) : (
                            pendingByMonth.map(({ monthKey, monthLabel, payments: monthPayments }) => {
                                const isCollapsed = isMonthCollapsed(monthKey)
                                return (
                                    <Card key={monthKey}>
                                        <CardHeader>
                                            <div
                                                className="flex items-center justify-between cursor-pointer"
                                                onClick={() => toggleMonth(monthKey)}
                                            >
                                                <CardTitle className="text-xl">{monthLabel}</CardTitle>
                                                {isCollapsed ? (
                                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                ) : (
                                                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                        </CardHeader>
                                        {!isCollapsed && (
                                            <CardContent>
                                                <TeacherPaymentSessionsTable
                                                    payments={monthPayments}
                                                    onStatusUpdate={handlePaymentsUpdate}
                                                />
                                            </CardContent>
                                        )}
                                    </Card>
                                )
                            })
                        )}
                    </TabsContent>

                    <TabsContent value="paid" className="space-y-6">
                        {paidByMonth.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No paid payments</p>
                            </div>
                        ) : (
                            paidByMonth.map(({ monthKey, monthLabel, payments: monthPayments }) => {
                                const isCollapsed = isMonthCollapsed(monthKey)
                                return (
                                    <Card key={monthKey}>
                                        <CardHeader>
                                            <div
                                                className="flex items-center justify-between cursor-pointer"
                                                onClick={() => toggleMonth(monthKey)}
                                            >
                                                <CardTitle className="text-xl">{monthLabel}</CardTitle>
                                                {isCollapsed ? (
                                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                ) : (
                                                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                        </CardHeader>
                                        {!isCollapsed && (
                                            <CardContent>
                                                <TeacherPaymentSessionsTable
                                                    payments={monthPayments}
                                                    onStatusUpdate={handlePaymentsUpdate}
                                                />
                                            </CardContent>
                                        )}
                                    </Card>
                                )
                            })
                        )}
                    </TabsContent>

                    <TabsContent value="cancelled" className="space-y-6">
                        {cancelledByMonth.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No cancelled payments</p>
                            </div>
                        ) : (
                            cancelledByMonth.map(({ monthKey, monthLabel, payments: monthPayments }) => {
                                const isCollapsed = isMonthCollapsed(monthKey)
                                return (
                                    <Card key={monthKey}>
                                        <CardHeader>
                                            <div
                                                className="flex items-center justify-between cursor-pointer"
                                                onClick={() => toggleMonth(monthKey)}
                                            >
                                                <CardTitle className="text-xl">{monthLabel}</CardTitle>
                                                {isCollapsed ? (
                                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                ) : (
                                                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                        </CardHeader>
                                        {!isCollapsed && (
                                            <CardContent>
                                                <TeacherPaymentSessionsTable
                                                    payments={monthPayments}
                                                    onStatusUpdate={handlePaymentsUpdate}
                                                />
                                            </CardContent>
                                        )}
                                    </Card>
                                )
                            })
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div >
    )
}

