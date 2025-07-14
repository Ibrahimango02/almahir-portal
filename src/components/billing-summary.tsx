'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { BillingCalculationType, StudentSubscriptionType } from '@/types'
import { calculateStudentBilling, formatBillingPeriod, formatCurrency } from '@/lib/utils/billing-calculator'
import { createSubscriptionInvoice } from '@/lib/post/post-invoices'
import { getSubscriptionInfoByStudentId } from '@/lib/get/get-subscriptions'

interface BillingSummaryProps {
    studentId: string
    startDate: string
    endDate: string
    onInvoiceCreated?: () => void
}

export function BillingSummary({ studentId, startDate, endDate, onInvoiceCreated }: BillingSummaryProps) {
    const [billingCalculation, setBillingCalculation] = useState<BillingCalculationType | null>(null)
    const [currentSubscription, setCurrentSubscription] = useState<StudentSubscriptionType | null>(null)
    const [loading, setLoading] = useState(false)
    const [generatingInvoice, setGeneratingInvoice] = useState(false)

    useEffect(() => {
        const loadBillingData = async () => {
            setLoading(true)
            try {
                const [billing, subscription] = await Promise.all([
                    calculateStudentBilling(studentId, startDate, endDate),
                    getSubscriptionInfoByStudentId(studentId)
                ])

                setBillingCalculation(billing)
                setCurrentSubscription(subscription)
            } catch {
                toast({
                    title: "Error",
                    description: "Failed to load billing data",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }
        loadBillingData()
    }, [studentId, startDate, endDate])



    const handleGenerateInvoice = async () => {
        if (!billingCalculation) return

        setGeneratingInvoice(true)
        try {
            await createSubscriptionInvoice(billingCalculation)
            toast({
                title: "Success",
                description: "Invoice generated successfully",
            })
            onInvoiceCreated?.()
        } catch {
            toast({
                title: "Error",
                description: "Failed to generate invoice",
                variant: "destructive",
            })
        } finally {
            setGeneratingInvoice(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!currentSubscription) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-muted-foreground">
                        <p>No active subscription found for this student.</p>
                        <p className="text-sm">Please assign a subscription plan first.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!billingCalculation) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-muted-foreground">
                        <p>No billing data available for the selected period.</p>
                        <p className="text-sm">No sessions found between {formatBillingPeriod(startDate, endDate)}</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const subscription = currentSubscription.subscription!

    return (
        <Card>
            <CardHeader>
                <CardTitle>Billing Summary</CardTitle>
                <CardDescription>
                    {formatBillingPeriod(startDate, endDate)}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Subscription Info */}
                <div className="space-y-2">
                    <h4 className="font-medium">Current Subscription</h4>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                        <div>
                            <span className="text-sm text-muted-foreground">Plan:</span>
                            <p className="font-medium">{subscription.name}</p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">Hourly Rate:</span>
                            <p className="font-medium">{formatCurrency(subscription.hourly_rate)}</p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">Free Absences:</span>
                            <p className="font-medium">{subscription.max_free_absences}</p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">Monthly Hours:</span>
                            <p className="font-medium">{subscription.hours_per_month}</p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Session Summary */}
                <div className="space-y-2">
                    <h4 className="font-medium">Session Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{billingCalculation.sessions_attended}</p>
                            <p className="text-sm text-muted-foreground">Sessions Attended</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{billingCalculation.sessions_scheduled}</p>
                            <p className="text-sm text-muted-foreground">Total Sessions</p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Hours Summary */}
                <div className="space-y-2">
                    <h4 className="font-medium">Hours Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm text-muted-foreground">Hours Attended:</span>
                            <p className="text-lg font-medium">{billingCalculation.total_hours_attended.toFixed(2)} hrs</p>
                        </div>
                        <div>
                            <span className="text-sm text-muted-foreground">Hours Scheduled:</span>
                            <p className="text-lg font-medium">{billingCalculation.total_hours_scheduled.toFixed(2)} hrs</p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Absences */}
                <div className="space-y-2">
                    <h4 className="font-medium">Absences</h4>
                    <div className="flex items-center justify-between">
                        <span>Absences Used:</span>
                        <Badge variant={billingCalculation.free_absences_used > subscription.max_free_absences ? "destructive" : "secondary"}>
                            {billingCalculation.free_absences_used} / {subscription.max_free_absences}
                        </Badge>
                    </div>
                    {billingCalculation.free_absences_used > subscription.max_free_absences && (
                        <p className="text-sm text-destructive">
                            Student has exceeded free absences limit
                        </p>
                    )}
                </div>

                <Separator />

                {/* Total Amount */}
                <div className="space-y-2">
                    <h4 className="font-medium">Total Amount</h4>
                    <div className="text-center p-6 bg-primary/5 rounded-lg">
                        <p className="text-3xl font-bold text-primary">
                            {formatCurrency(billingCalculation.total_amount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Based on {billingCalculation.total_hours_attended.toFixed(2)} hours attended
                        </p>
                    </div>
                </div>

                <Button
                    onClick={handleGenerateInvoice}
                    disabled={generatingInvoice}
                    className="w-full"
                >
                    {generatingInvoice ? 'Generating Invoice...' : 'Generate Invoice'}
                </Button>
            </CardContent>
        </Card>
    )
} 