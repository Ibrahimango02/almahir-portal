"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InvoicePreview } from "@/components/invoice-preview"
import { getStudents } from "@/lib/get/get-students"
import { getParents } from "@/lib/get/get-parents"
import { StudentType } from "@/types"
import { ParentType } from "@/types"
import { InvoiceType } from "@/types"
import { updateInvoice } from "@/lib/put/put-invoices"
import { Textarea } from "@/components/ui/textarea"

// Form validation schema
const formSchema = z.object({
  invoice_id: z.string(),
  student_id: z.string().min(1, { message: "Student is required" }),
  parent_id: z.string().optional(),
  invoice_type: z.string().min(1, { message: "Invoice type is required" }),
  amount: z.coerce.number().min(0, { message: "Amount must be greater than 0" }),
  currency: z.string(),
  description: z.string().min(1, { message: "Description is required" }),
  due_date: z.date({
    required_error: "Due date is required",
  }),
  status: z.string(),
})

type FormValues = {
  invoice_id: string
  student_id: string
  parent_id?: string
  invoice_type: string
  amount: number
  currency: string
  description: string
  due_date: Date
  status: string
}

const invoiceTypes = [
  { id: "hour", name: "per hour" },
  { id: "month", name: "per month" },
  { id: "class", name: "per class" },
]

interface EditInvoiceFormProps {
  invoice: InvoiceType
}

export function EditInvoiceForm({ invoice }: EditInvoiceFormProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("form")
  const [submitting, setSubmitting] = useState(false)
  const [students, setStudents] = useState<StudentType[]>([])
  const [parents, setParents] = useState<ParentType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [studentsData, parentsData] = await Promise.all([
          getStudents(),
          getParents()
        ])
        setStudents(studentsData)
        setParents(parentsData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoice_id: invoice.invoice_id,
      student_id: invoice.student.student_id,
      parent_id: invoice.parent.parent_id || "",
      invoice_type: invoice.invoice_type,
      amount: invoice.amount,
      currency: invoice.currency,
      description: invoice.description,
      due_date: new Date(invoice.due_date),
      status: invoice.status,
    },
  })

  // Form submission
  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)

    try {
      const invoiceData = {
        invoice_id: values.invoice_id,
        student_id: values.student_id,
        parent_id: values.parent_id === "none" || values.parent_id === "" ? undefined : values.parent_id,
        invoice_type: values.invoice_type,
        amount: values.amount,
        currency: values.currency,
        description: values.description,
        due_date: values.due_date,
        status: values.status,
      }

      await updateInvoice(invoiceData)

      // Redirect to invoices list
      router.push("/admin/invoices")
      router.refresh()
    } catch (error) {
      console.error("Error updating invoice:", error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="form">Invoice Details</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Invoice ID and Student Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="invoice_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice ID</FormLabel>
                            <FormControl>
                              <Input value={invoice.invoice_id} disabled />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="student_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Student</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a student" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {students.map((student) => (
                                  <SelectItem key={student.student_id} value={student.student_id}>
                                    {`${student.first_name} ${student.last_name}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Parent Section */}
                    <div className="grid grid-cols-1 gap-6">
                      <FormField
                        control={form.control}
                        name="parent_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parent (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a parent (optional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {parents.map((parent) => (
                                  <SelectItem key={parent.parent_id} value={parent.parent_id}>
                                    {`${parent.first_name} ${parent.last_name}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              You can leave this empty if no parent is associated
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Invoice Details Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="invoice_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select invoice type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {invoiceTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Currency and Description Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. USD, EUR, GBP" />
                            </FormControl>
                            <FormDescription>
                              Enter the currency code (e.g. USD, EUR, GBP)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                value={field.value ?? ""}
                                className="min-h-[100px]"
                                placeholder="Enter invoice description..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Due Date and Status Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="due_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Due Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                                  >
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.push("/admin/invoices")}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: "#3d8f5b", color: "white" }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="preview">
          <InvoicePreview
            formData={form.getValues()}
            lineItems={[]}
            subtotal={form.getValues().amount}
            tax={0}
            discount={0}
            total={form.getValues().amount}
            onBack={() => setActiveTab("form")}
            students={students}
            parents={parents}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
