'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

import { toast } from '@/hooks/use-toast'
import { SubscriptionType, StudentSubscriptionType } from '@/types'
import { createStudentSubscription, updateStudentSubscription } from '@/lib/post/post-subscriptions'
import { getSubscriptions } from '@/lib/get/get-subscriptions'
import { addMonths, addDays, format as formatDate } from 'date-fns'
import { useRouter } from 'next/navigation'

interface SubscriptionFormProps {
    studentId: string
    currentSubscription?: StudentSubscriptionType | null
    onSuccess?: () => void
}

export function SubscriptionForm({ studentId, currentSubscription, onSuccess }: SubscriptionFormProps) {
    const [subscriptions, setSubscriptions] = useState<SubscriptionType[]>([])
    const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>(currentSubscription?.subscription_id || '')
    const [startDate, setStartDate] = useState<string>(currentSubscription?.start_date.split('T')[0] || '')
    const [endDate, setEndDate] = useState<string>(currentSubscription?.next_payment_date?.split('T')[0] || '')
    const [loading, setLoading] = useState(false)
    const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionType | null>(null)
    const [periodType, setPeriodType] = useState<'4-weeks' | 'month'>('month')
    const router = useRouter();

    useEffect(() => {
        loadSubscriptions()
    }, [])

    useEffect(() => {
        if (currentSubscription) {
            setSelectedSubscriptionId(currentSubscription.subscription_id)
            setStartDate(currentSubscription.start_date.split('T')[0])
            setPeriodType(currentSubscription.every_month ? 'month' : '4-weeks')
            setSelectedSubscription(currentSubscription.subscription || null)
            // Calculate next payment date for display
            if (currentSubscription.next_payment_date) {
                setEndDate(currentSubscription.next_payment_date.split('T')[0])
            }
        }
    }, [currentSubscription])

    useEffect(() => {
        // Recalculate next payment date whenever plan, periodType, or startDate changes
        if (!selectedSubscription || !startDate) return
        const start = new Date(startDate)
        let nextDate: Date
        if (periodType === '4-weeks') {
            nextDate = addDays(start, selectedSubscription.rate * 4 * 7) // 4 weeks per rate
        } else {
            nextDate = addMonths(start, selectedSubscription.rate)
        }
        setEndDate(formatDate(nextDate, 'yyyy-MM-dd'))
    }, [selectedSubscription, periodType, startDate])

    useEffect(() => {
        if (selectedSubscriptionId) {
            const subscription = subscriptions.find(sub => sub.id === selectedSubscriptionId)
            setSelectedSubscription(subscription || null)
        }
    }, [selectedSubscriptionId, subscriptions])

    const loadSubscriptions = async () => {
        try {
            const data = await getSubscriptions()
            setSubscriptions(data)
        } catch {
            toast({
                title: "Error",
                description: "Failed to load subscriptions",
                variant: "destructive",
            })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedSubscriptionId || !startDate || !endDate) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            })
            return
        }

        setLoading(true)

        try {
            if (currentSubscription) {
                await updateStudentSubscription(currentSubscription.id, {
                    subscription_id: selectedSubscriptionId,
                    start_date: startDate,
                    next_payment_date: endDate,
                    every_month: periodType === 'month',
                    status: 'active'
                })
                toast({
                    title: "Success",
                    description: "Subscription updated successfully",
                })
                router.push(`/admin/students/${studentId}`)
            } else {
                await createStudentSubscription(studentId, selectedSubscriptionId, startDate, endDate, periodType === 'month')
                toast({
                    title: "Success",
                    description: "Subscription created successfully",
                })
                onSuccess?.()
            }
            // Only call onSuccess for create, since update/deactivate now redirect
        } catch {
            toast({
                title: "Error",
                description: "Failed to save subscription",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {currentSubscription ? 'Update Subscription' : 'Assign Subscription'}
                </CardTitle>
                <CardDescription>
                    {currentSubscription
                        ? 'Update the student\'s current subscription plan'
                        : 'Assign a subscription plan to this student'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="subscription">Subscription Plan</Label>
                        <Select value={selectedSubscriptionId} onValueChange={setSelectedSubscriptionId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a subscription plan" />
                            </SelectTrigger>
                            <SelectContent>
                                {[...subscriptions]
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((subscription) => (
                                        <SelectItem key={subscription.id} value={subscription.id}>
                                            {subscription.name} - ${subscription.total_amount} CAD
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Billing Period</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                style={{ backgroundColor: periodType === 'month' ? '#3d8f5b' : undefined, color: periodType === 'month' ? 'white' : undefined, borderColor: '#3d8f5b' }}
                                variant={periodType === 'month' ? 'default' : 'outline'}
                                onClick={() => setPeriodType('month')}
                            >
                                Month
                            </Button>
                            <Button
                                type="button"
                                style={{ backgroundColor: periodType === '4-weeks' ? '#3d8f5b' : undefined, color: periodType === '4-weeks' ? 'white' : undefined, borderColor: '#3d8f5b' }}
                                variant={periodType === '4-weeks' ? 'default' : 'outline'}
                                onClick={() => setPeriodType('4-weeks')}
                            >
                                4 Weeks
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">Next Payment Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                readOnly
                                disabled
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 justify-end">
                        <Button
                            type="submit"
                            disabled={loading}
                            style={{ backgroundColor: '#3d8f5b', color: 'white', minWidth: '170px', transition: 'background 0.2s, box-shadow 0.2s' }}
                            onMouseOver={e => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27663d';
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(61,143,91,0.15)';
                            }}
                            onMouseOut={e => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3d8f5b';
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                            }}
                        >
                            {loading ? 'Saving...' : (currentSubscription ? 'Update Subscription' : 'Assign Subscription')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
} 