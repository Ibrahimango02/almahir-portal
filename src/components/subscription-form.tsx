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

interface SubscriptionFormProps {
    studentId: string
    currentSubscription?: StudentSubscriptionType | null
    onSuccess?: () => void
}

export function SubscriptionForm({ studentId, currentSubscription, onSuccess }: SubscriptionFormProps) {
    const [subscriptions, setSubscriptions] = useState<SubscriptionType[]>([])
    const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>('')
    const [startDate, setStartDate] = useState<string>('')
    const [endDate, setEndDate] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionType | null>(null)

    useEffect(() => {
        loadSubscriptions()
    }, [])

    useEffect(() => {
        if (currentSubscription) {
            setSelectedSubscriptionId(currentSubscription.subscription_id)
            setStartDate(currentSubscription.start_date)
            setEndDate(currentSubscription.end_date)
            setSelectedSubscription(currentSubscription.subscription || null)
        }
    }, [currentSubscription])

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
                    end_date: endDate,
                })
                toast({
                    title: "Success",
                    description: "Subscription updated successfully",
                })
            } else {
                await createStudentSubscription(studentId, selectedSubscriptionId, startDate, endDate)
                toast({
                    title: "Success",
                    description: "Subscription created successfully",
                })
            }

            onSuccess?.()
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
                                {subscriptions.map((subscription) => (
                                    <SelectItem key={subscription.id} value={subscription.id}>
                                        {subscription.name} - ${subscription.hourly_rate}/hr
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedSubscription && (
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                            <h4 className="font-medium">Plan Details</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Hourly Rate:</span>
                                    <span className="ml-2 font-medium">${selectedSubscription.hourly_rate}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Hours per Month:</span>
                                    <span className="ml-2 font-medium">{selectedSubscription.hours_per_month}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Free Absences:</span>
                                    <span className="ml-2 font-medium">{selectedSubscription.max_free_absences}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Monthly Rate:</span>
                                    <span className="ml-2 font-medium">${selectedSubscription.rate}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Saving...' : (currentSubscription ? 'Update Subscription' : 'Assign Subscription')}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
} 