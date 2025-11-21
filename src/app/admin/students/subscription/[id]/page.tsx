'use client'

import { notFound, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Calendar } from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { BackButton } from "@/components/back-button"
import { getStudentById } from "@/lib/get/get-students"
import { getSubscriptionInfoByStudentId } from "@/lib/get/get-subscriptions"
import { SubscriptionForm } from "@/components/subscription-form"
import { useEffect, useState } from "react"
import { StudentType, StudentSubscriptionType } from "@/types"
import { deactivateStudentSubscription } from "@/lib/post/post-subscriptions"
import { toast } from "@/components/ui/use-toast"

export default function StudentSubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
    const [student, setStudent] = useState<StudentType | null>(null)
    const [studentSubscription, setStudentSubscription] = useState<StudentSubscriptionType | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const [deactivating, setDeactivating] = useState(false)

    useEffect(() => {
        const loadData = async () => {
            try {
                const { id: studentId } = await params

                const [studentData, subscriptionData] = await Promise.all([
                    getStudentById(studentId),
                    getSubscriptionInfoByStudentId(studentId),
                ])

                setStudent(studentData)
                setStudentSubscription(subscriptionData)
            } catch (error) {
                console.error('Error loading data:', error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [params])

    const handleSuccess = () => {
        // Refresh the page data
        window.location.reload()
    }

    const handleDeactivate = async () => {
        if (!studentSubscription || !student) return

        setDeactivating(true)
        try {
            await deactivateStudentSubscription(studentSubscription.id)
            toast({
                title: "Success",
                description: "Subscription deactivated successfully",
            })
            router.push(`/admin/students/${student.student_id}`)
        } catch {
            toast({
                title: "Error",
                description: "Failed to deactivate subscription",
                variant: "destructive",
            })
        } finally {
            setDeactivating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    if (!student) {
        notFound()
        return (
            <div>
                <h2>Student not found</h2>
                <Link href="/admin/students">Return to Students List</Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <BackButton href={`/admin/students/${student.student_id}`} label="Back to Student" />
            </div>

            {/* Current Subscription Details - styled like subscription history, only important info */}
            {studentSubscription && (
                <Card className="mb-6">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Current Subscription Details
                            </CardTitle>
                        </div>
                        {studentSubscription && studentSubscription.status === 'active' && (
                            <button
                                onClick={handleDeactivate}
                                disabled={deactivating}
                                style={{
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    minWidth: '80px',
                                    borderRadius: '6px',
                                    padding: '4px 10px',
                                    fontWeight: 500,
                                    fontSize: '0.95rem',
                                    border: 'none',
                                    transition: 'background 0.2s, box-shadow 0.2s',
                                }}
                                onMouseOver={e => {
                                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#b91c1c';
                                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(220,38,38,0.15)';
                                }}
                                onMouseOut={e => {
                                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#dc2626';
                                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                                }}
                            >
                                {deactivating ? 'Deactivating...' : 'Deactivate'}
                            </button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 rounded-lg border bg-green-50">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-0.1 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Plan Name:</span>
                                    <span className="ml-2 font-medium">{studentSubscription.subscription?.name}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Total Amount:</span>
                                    <span className="ml-2 font-medium">{studentSubscription.subscription?.total_amount} {studentSubscription.subscription?.currency || 'CAD'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Hours/Month:</span>
                                    <span className="ml-2 font-medium">{studentSubscription.subscription?.hours_per_month}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Start Date:</span>
                                    <span className="ml-2 font-medium">{studentSubscription.start_date ? format(parseISO(studentSubscription.start_date), "MMM d, yyyy") : 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Next Payment Date:</span>
                                    <span className="ml-2 font-medium">{studentSubscription.next_payment_date ? format(parseISO(studentSubscription.next_payment_date), "MMM d, yyyy") : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div>
                {/* Subscription Management Card */}
                <Card className="md:col-span-8 md:col-start-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Manage Subscription
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SubscriptionForm
                            studentId={student.student_id}
                            currentSubscription={studentSubscription}
                            onSuccess={handleSuccess}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
