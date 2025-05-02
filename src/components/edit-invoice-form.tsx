"use client"

import { useState } from "react"
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
import { InvoiceLineItems } from "@/components/invoice-line-items"
import { InvoicePreview } from "@/components/invoice-preview"

// Form validation schema
const formSchema = z.object({
  parentId: z.string().min(1, { message: "Parent is required" }),
  invoiceNumber: z.string().min(1, { message: "Invoice number is required" }),
  invoiceDate: z.date({
    required_error: "Invoice date is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
})

// Mock parent data
const parents = [
  { id: "1", name: "Ahmed Ali" },
  { id: "2", name: "Fatima Khan" },
  { id: "3", name: "Mohammad Rahman" },
  { id: "4", name: "Aisha Abdullah" },
]

interface LineItem {
  id: number
  description: string
  quantity: number
  price: number
}

interface Invoice {
  id: string
  parentId: string
  amount: number
  status: string
  date: string
  dueDate: string
  taxRate: number
  discount: number
  notes: string
  lineItems: LineItem[]
}

interface EditInvoiceFormProps {
  invoice: Invoice
}

export function EditInvoiceForm({ invoice }: EditInvoiceFormProps) {
  const router = useRouter()
  const [lineItems, setLineItems] = useState<LineItem[]>(invoice.lineItems)
  const [activeTab, setActiveTab] = useState("form")
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      parentId: invoice.parentId,
      invoiceNumber: invoice.id,
      invoiceDate: new Date(invoice.date),
      dueDate: new Date(invoice.dueDate),
      taxRate: invoice.taxRate,
      discount: invoice.discount,
      notes: invoice.notes,
    },
  })

  // Calculate subtotal
  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.quantity * item.price, 0)
  }

  // Calculate tax
  const calculateTax = () => {
    const taxRate = form.getValues().taxRate || 0
    return calculateSubtotal() * (taxRate / 100)
  }

  // Calculate discount
  const calculateDiscount = () => {
    const discount = form.getValues().discount || 0
    return discount
  }

  // Calculate total
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - calculateDiscount()
  }

  // Add a new line item
  const addLineItem = () => {
    const newId = lineItems.length > 0 ? Math.max(...lineItems.map((item) => item.id)) + 1 : 1
    setLineItems([...lineItems, { id: newId, description: "", quantity: 1, price: 0 }])
  }

  // Remove a line item
  const removeLineItem = (id: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id))
    }
  }

  // Update a line item
  const updateLineItem = (id: number, field: string, value: any) => {
    setLineItems(lineItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  // Form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitting(true)

    try {
      // In a real app, you would send this data to your API
      console.log("Form values:", values)
      console.log("Line items:", lineItems)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Redirect to invoices list
      router.push("/admin/invoices")
      router.refresh()
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
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
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="parentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parent</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a parent" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {parents.map((parent) => (
                                  <SelectItem key={parent.id} value={parent.id}>
                                    {parent.name}
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
                        name="invoiceNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice Number</FormLabel>
                            <FormControl>
                              <Input {...field} disabled className="bg-muted" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <FormField
                        control={form.control}
                        name="invoiceDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Invoice Date</FormLabel>
                            <FormControl>
                              <Button
                                type="button"
                                variant={"outline"}
                                className="w-full pl-3 text-left font-normal bg-muted"
                                disabled
                              >
                                {field.value ? format(field.value, "PPP") : <span>Select date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dueDate"
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
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Line Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <InvoiceLineItems
                      lineItems={lineItems}
                      addLineItem={addLineItem}
                      removeLineItem={removeLineItem}
                      updateLineItem={updateLineItem}
                    />

                    <div className="mt-6 space-y-4">
                      <div className="flex justify-end">
                        <div className="w-full md:w-1/2 lg:w-1/3 space-y-2">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${calculateSubtotal().toFixed(2)}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span>Tax Rate:</span>
                            <div className="w-24">
                              <FormField
                                control={form.control}
                                name="taxRate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <div className="flex items-center">
                                        <Input type="number" min="0" max="100" {...field} className="h-8" />
                                        <span className="ml-2">%</span>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <div className="flex justify-between">
                            <span>Tax:</span>
                            <span>${calculateTax().toFixed(2)}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span>Discount:</span>
                            <div className="w-24">
                              <FormField
                                control={form.control}
                                name="discount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <div className="flex items-center">
                                        <Input type="number" min="0" {...field} className="h-8" />
                                        <span className="ml-2">$</span>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <div className="flex justify-between font-bold pt-2 border-t">
                            <span>Total:</span>
                            <span>${calculateTotal().toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Add any additional information that should appear on the invoice
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.push("/admin/invoices")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
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
            formData={{
              ...form.getValues(),
              status: invoice.status,
            }}
            lineItems={lineItems}
            subtotal={calculateSubtotal()}
            tax={calculateTax()}
            discount={calculateDiscount()}
            total={calculateTotal()}
            onBack={() => setActiveTab("form")}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
