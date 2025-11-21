"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { BackButton } from "@/components/back-button"
import { InvoicePaymentStatusBadge } from "@/components/invoice-payment-status-badge"
import { format, parseISO } from "date-fns"
import { StudentInvoiceType } from "@/types"
import { getInvoiceById } from "@/lib/get/get-invoices"
import { updateStudentInvoice } from "@/lib/put/put-student-invoices"
import { useToast } from "@/hooks/use-toast"
import { formatMonthRange } from "@/lib/utils/format-month-range"

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = use(params)
    const { toast } = useToast()
    const [invoice, setInvoice] = useState<StudentInvoiceType | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        due_date: undefined as Date | undefined,
        status: ""
    })

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const invoiceData = await getInvoiceById(id)
                if (invoiceData) {
                    setInvoice(invoiceData)
                    setFormData({
                        due_date: invoiceData.due_date ? parseISO(invoiceData.due_date) : undefined,
                        status: invoiceData.status
                    })
                } else {
                    toast({
                        title: "Error",
                        description: "Invoice not found",
                        variant: "destructive"
                    })
                    router.push("/admin/accounting")
                }
            } catch (error) {
                console.error("Error fetching invoice:", error)
                toast({
                    title: "Error",
                    description: "Failed to load invoice",
                    variant: "destructive"
                })
                router.push("/admin/accounting")
            } finally {
                setLoading(false)
            }
        }

        fetchInvoice()
    }, [id, router, toast])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!invoice) return

        setSaving(true)
        try {
            await updateStudentInvoice({
                id: invoice.invoice_id,
                student_subscription: invoice.student_subscription,
                months: invoice.months,
                issue_date: invoice.issue_date,
                due_date: formData.due_date ? formData.due_date.toISOString() : "",
                paid_date: invoice.paid_date,
                status: formData.status
            })

            toast({
                title: "Success",
                description: "Invoice updated successfully"
            })
            router.push("/admin/accounting")
        } catch (error) {
            console.error("Error updating invoice:", error)
            toast({
                title: "Error",
                description: "Failed to update invoice",
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
                    <p className="text-muted-foreground">Loading invoice...</p>
                </div>
            </div>
        )
    }

    if (!invoice) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-muted-foreground">Invoice not found</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Edit Invoice</h1>
                    <p className="text-sm text-muted-foreground">
                        Invoice #{invoice.invoice_id}
                    </p>
                </div>
                <BackButton href="/admin/accounting" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Invoice Details</CardTitle>
                    <CardDescription>
                        Update payment information and status
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Current Invoice Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">Student</p>
                            <p className="font-medium">
                                {invoice.student ? `${invoice.student.first_name} ${invoice.student.last_name}` : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Amount</p>
                            <p className="font-medium text-green-600">
                                {invoice.subscription?.total_amount?.toFixed(2) || '0.00'} {invoice.subscription?.currency || 'CAD'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Months</p>
                            <p className="font-medium">{formatMonthRange(invoice.months)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Current Status</p>
                            <div className="mt-1">
                                <InvoicePaymentStatusBadge status={invoice.status} />
                            </div>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !formData.due_date && "text-muted-foreground",
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.due_date ? format(formData.due_date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formData.due_date}
                                            onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date }))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

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
