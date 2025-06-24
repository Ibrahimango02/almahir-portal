import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Calendar, User, Receipt, Clock, DollarSign, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { BackButton } from "@/components/back-button"
import { getInvoiceById } from "@/lib/get/get-invoices"
import { format } from "date-fns"
import { convertStatusToPrefixedFormat } from "@/lib/utils"

export const metadata: Metadata = {
    title: "Invoice Details | Al-Mahir Academy",
    description: "View invoice details",
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const invoice = await getInvoiceById(id)

    if (!invoice) {
        notFound()
    }

    return (
        <div className="container max-w-7xl mx-auto py-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <BackButton href={`/student/invoices`} label="Back to Invoices" />
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">Invoice Details</h1>
                        <p className="text-muted-foreground">View and manage invoice information</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Invoice Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl">Invoice Information</CardTitle>
                                <StatusBadge status={convertStatusToPrefixedFormat(invoice.status, 'invoice')} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Invoice Number</p>
                                            <p className="font-medium">{invoice.invoice_id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                                            <p className="font-medium">{format(new Date(invoice.due_date + 'T00:00:00'), "MMMM d, yyyy")}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Created At</p>
                                            <p className="font-medium">{format(new Date(invoice.created_at), "MMMM d, yyyy")}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Student</p>
                                            <p className="font-medium">{invoice.student.first_name} {invoice.student.last_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Parent</p>
                                            <p className="font-medium">{invoice.parent.parent_id === null ? "None" : invoice.parent.first_name} {invoice.parent.last_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Receipt className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Invoice Type</p>
                                            <p className="font-medium">{invoice.invoice_type === "hour" ? "Per Hour" : invoice.invoice_type === "month" ? "Per Month" : "Per Class"}</p>
                                        </div>
                                    </div>
                                    {invoice.paid_at && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Paid At</p>
                                                <p className="font-medium">{format(new Date(invoice.paid_at), "MMMM d, yyyy")}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground whitespace-pre-wrap">{invoice.description || "No description provided"}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Payment Summary */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Payment Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-muted-foreground">Amount</p>
                                        <p className="text-2xl font-bold">{invoice.currency} {invoice.amount.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        {invoice.status === "paid"
                                            ? "This invoice has been paid"
                                            : invoice.status === "pending"
                                                ? "This invoice is pending payment"
                                                : "This invoice is overdue"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
