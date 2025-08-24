import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, Calendar, Edit, Contact, Users, Receipt, CreditCard } from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { BackButton } from "@/components/back-button"
import { getParentById, getParentStudents } from "@/lib/get/get-parents"
import AvatarIcon from "@/components/avatar"
import { getInvoicesByParentId } from "@/lib/get/get-invoices"
import { createClient } from "@/utils/supabase/server"
import { checkIfAdmin } from "@/lib/get/get-profiles"
import { formatMonthRange } from "@/lib/utils/format-month-range"

export default async function ParentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Get current user ID
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  // Check if admin
  const isAdmin = userId ? await checkIfAdmin(userId) : false;

  const { id } = await params
  const parent = await getParentById(id)
  const parentStudents = await getParentStudents(id) ?? []
  const parentInvoices = await getInvoicesByParentId(id) ?? []

  if (!parent) {
    notFound()
    return (
      <div>
        <h2>Parent not found</h2>
        <Link href="/admin/parents">Return to Parents List</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <BackButton href="/admin/parents" label="Back to Parents" />
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Parent Information Card */}
        <Card className="md:col-span-12 overflow-hidden">
          {/* Card Header with Background */}
          <CardHeader className="relative pb-0">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background z-0"></div>
            <div className="relative z-10 flex flex-col items-center pt-4">
              <div className="relative">
                {parent.avatar_url ? (
                  <div className="mb-4">
                    <AvatarIcon url={parent.avatar_url} size="large" />
                  </div>
                ) : (
                  <Avatar className="h-24 w-24 mb-4 border-4 border-background shadow-md">
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {parent.first_name[0]}
                      {parent.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
                <Badge
                  className={`absolute bottom-4 right-0 capitalize px-2 py-1 ${parent.status === "active" ? "bg-green-600"
                    : parent.status === "inactive" ? "bg-amber-500"
                      : parent.status === "pending" ? "bg-blue-500"
                        : parent.status === "suspended" ? "bg-red-600"
                          : parent.status === "archived" ? "bg-gray-500"
                            : "bg-gray-500"
                    }`}
                >
                  {parent.status}
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold text-center mt-2">
                {parent.first_name} {parent.last_name}
              </CardTitle>
              <div className="flex flex-wrap gap-2 justify-center mt-2 mb-4">
                <Badge variant="secondary" className="font-medium">
                  Parent
                </Badge>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-base font-semibold flex items-center mb-3">
                  <Contact className="h-4 w-4 mr-2 text-primary" />
                  Contact Information
                </h3>
                <div className="space-y-3 pl-6">
                  <div className="flex items-start">
                    <Mail className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm break-all">{parent.email}</span>
                  </div>
                  <div className="flex items-start">
                    <Phone className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{parent.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Students Section */}
              <div>
                <h3 className="text-base font-semibold flex items-center mb-3">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  Students
                </h3>
                <div className="pl-6">
                  {parentStudents.length > 0 ? (
                    <div className="space-y-2">
                      {parentStudents.map((student) => (
                        <Link
                          key={student.student_id}
                          href={`/admin/students/${student.student_id}`}
                          className="block"
                        >
                          <div className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-200 hover:shadow-sm">
                            <Avatar className="h-8 w-8">
                              {student.avatar_url && <AvatarImage src={student.avatar_url} alt={student.first_name} />}
                              <AvatarFallback className="text-sm">
                                {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-primary truncate">
                                {student.first_name} {student.last_name}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No students associated with this parent</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Invoices Section - Only for admin */}
              {isAdmin && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-primary" />
                      Invoices <span className="text-xs bg-muted px-2 py-1 rounded-full">{parentInvoices ? parentInvoices.length : 0}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {parentInvoices && parentInvoices.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Months</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Paid Date</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {parentInvoices.map((invoice) => (
                              <tr key={invoice.invoice_id} className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer">
                                <td className="px-4 py-2 text-sm">
                                  {invoice.student ? `${invoice.student.first_name} ${invoice.student.last_name}` : "-"}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  <span className="inline-block bg-muted px-2 py-0.5 rounded-full text-xs font-medium text-primary">
                                    {formatMonthRange(invoice.months)}
                                  </span>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                  {invoice.subscription?.total_amount?.toFixed(2) || '0.00'} CAD
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{invoice.due_date ? format(parseISO(invoice.due_date), "MMM dd, yyyy") : "-"}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{invoice.paid_date ? format(parseISO(invoice.paid_date), "MMM dd, yyyy") : "-"}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm capitalize">
                                  <span
                                    className={
                                      `inline-block px-2 py-0.5 rounded-full text-xs font-semibold ` +
                                      (invoice.status === 'paid'
                                        ? 'bg-green-100 text-green-800'
                                        : invoice.status === 'pending'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : invoice.status === 'overdue'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-gray-100 text-gray-800')
                                    }
                                  >
                                    {invoice.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-base font-medium text-muted-foreground mb-1">
                          No Invoices
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          No invoices found for this parent.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Account Information */}
              <div>
                <h3 className="text-base font-semibold flex items-center mb-3">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  Account Information
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                  {format(parseISO(parent.created_at), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
            {/* Edit Button - Only for admin */}
            {isAdmin && (
              <Button
                asChild
                className="mt-6 shadow-sm transition-all hover:shadow-md"
                style={{ backgroundColor: "#3d8f5b", color: "white" }}
              >
                <Link href={`/admin/parents/edit/${parent.parent_id}`} className="flex items-center justify-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Parent Information
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
