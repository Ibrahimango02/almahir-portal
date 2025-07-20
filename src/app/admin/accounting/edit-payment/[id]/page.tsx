"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { BackButton } from "@/components/back-button"
import { InvoicePaymentStatusBadge } from "@/components/invoice-payment-status-badge"
import { format, parseISO } from "date-fns"
import { TeacherPaymentType } from "@/types"
import { getTeacherPaymentById } from "@/lib/get/get-teacher-payments"
import { updateTeacherPayment } from "@/lib/put/put-teacher-payments"
import { useToast } from "@/hooks/use-toast"

export default function EditPaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = use(params)
    const { toast } = useToast()
    const [payment, setPayment] = useState<TeacherPaymentType | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        status: "",
        paid_date: undefined as Date | undefined,
        amount: 0
    })

    useEffect(() => {
        const fetchPayment = async () => {
            try {
                const paymentData = await getTeacherPaymentById(id)
                if (paymentData) {
                    setPayment(paymentData)
                    setFormData({
                        status: paymentData.status,
                        paid_date: paymentData.paid_date ? parseISO(paymentData.paid_date) : undefined,
                        amount: paymentData.amount
                    })
                } else {
                    toast({
                        title: "Error",
                        description: "Payment not found",
                        variant: "destructive"
                    })
                    router.push("/admin/accounting")
                }
            } catch (error) {
                console.error("Error fetching payment:", error)
                toast({
                    title: "Error",
                    description: "Failed to load payment",
                    variant: "destructive"
                })
                router.push("/admin/accounting")
            } finally {
                setLoading(false)
            }
        }

        fetchPayment()
    }, [id, router, toast])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!payment) return

        setSaving(true)
        try {
            await updateTeacherPayment({
                id: payment.payment_id,
                status: formData.status,
                paid_date: formData.paid_date ? formData.paid_date.toISOString() : undefined,
                amount: formData.amount
            })

            toast({
                title: "Success",
                description: "Payment updated successfully"
            })
            router.push("/admin/accounting")
        } catch (error) {
            console.error("Error updating payment:", error)
            toast({
                title: "Error",
                description: "Failed to update payment",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading payment...</p>
                </div>
            </div>
        )
    }

    if (!payment) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-muted-foreground">Payment not found</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Edit Payment</h1>
                    <p className="text-sm text-muted-foreground">
                        Payment #{payment.payment_id}
                    </p>
                </div>
                <BackButton href="/admin/accounting" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Payment Details</CardTitle>
                    <CardDescription>
                        Update payment information and status
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Current Payment Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">Teacher</p>
                            <p className="font-medium">
                                {payment.teacher ? `${payment.teacher.first_name} ${payment.teacher.last_name}` : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Class</p>
                            <p className="font-medium">{payment.session?.class_title || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Hours</p>
                            <p className="font-medium">{payment.hours} h</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Current Amount</p>
                            <p className="font-medium text-green-600">
                                {payment.amount.toFixed(2)} CAD
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Session Date</p>
                            <p className="font-medium">
                                {payment.session ? format(parseISO(payment.session.start_date), "MMM dd, yyyy") : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Current Status</p>
                            <div className="mt-1">
                                <InvoicePaymentStatusBadge status={payment.status} />
                            </div>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Amount (CAD)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.amount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                    className="text-green-600 font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Paid Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !formData.paid_date && "text-muted-foreground",
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.paid_date ? format(formData.paid_date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formData.paid_date}
                                            onSelect={(date) => setFormData(prev => ({ ...prev, paid_date: date }))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <p className="text-xs text-muted-foreground">
                                    Leave empty if not paid yet
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/admin/accounting")}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-[#3d8f5b] hover:bg-[#3d8f5b]/90 text-white"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
