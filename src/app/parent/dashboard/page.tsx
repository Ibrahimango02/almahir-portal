import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, CreditCard, FileText, GraduationCap } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for parent dashboard
const parentData = {
  name: "John Smith",
  email: "john.smith@example.com",
  children: [
    {
      id: "S001",
      name: "Emma Smith",
      grade: "10th",
      age: 16,
      upcomingClasses: [
        {
          id: 1,
          subject: "Mathematics",
          topic: "Algebra Fundamentals",
          date: "2023-04-17",
          startTime: "09:00 AM",
          endTime: "10:00 AM",
          teacher: "Sarah Johnson",
        },
        {
          id: 2,
          subject: "Physics",
          topic: "Mechanics",
          date: "2023-04-17",
          startTime: "11:30 AM",
          endTime: "12:30 PM",
          teacher: "Michael Chen",
        },
      ],
    },
    {
      id: "S002",
      name: "Noah Smith",
      grade: "8th",
      age: 14,
      upcomingClasses: [
        {
          id: 3,
          subject: "Mathematics",
          topic: "Pre-Algebra",
          date: "2023-04-17",
          startTime: "10:00 AM",
          endTime: "11:00 AM",
          teacher: "Sarah Johnson",
        },
        {
          id: 4,
          subject: "Biology",
          topic: "Cell Structure",
          date: "2023-04-17",
          startTime: "01:00 PM",
          endTime: "02:00 PM",
          teacher: "Jennifer Lee",
        },
      ],
    },
  ],
  recentInvoices: [
    {
      id: "INV-001",
      date: "2023-04-01",
      amount: 250.0,
      status: "paid",
      description: "Monthly Tuition - April 2023",
    },
    {
      id: "INV-002",
      date: "2023-03-01",
      amount: 250.0,
      status: "paid",
      description: "Monthly Tuition - March 2023",
    },
  ],
  announcements: [
    {
      id: 1,
      title: "Parent-Teacher Conference",
      date: "2023-04-25",
      content: "Parent-teacher conferences will be held on April 25th. Please schedule your appointment.",
    },
    {
      id: 2,
      title: "Spring Break",
      date: "2023-04-10",
      content: "Spring break will be from April 10th to April 14th. Classes will resume on April 17th.",
    },
  ],
}

export default function ParentDashboard() {
  // Get current date in a readable format
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Parent Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{currentDate}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Children</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parentData.children.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parentData.children.reduce((total, child) => total + child.upcomingClasses.length, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parentData.recentInvoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parentData.announcements.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Children's Classes Today</CardTitle>
            <CardDescription>Overview of your children's classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={parentData.children[0].id} className="space-y-4">
              <TabsList>
                {parentData.children.map((child) => (
                  <TabsTrigger key={child.id} value={child.id}>
                    {child.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {parentData.children.map((child) => (
                <TabsContent key={child.id} value={child.id} className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {child.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{child.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {child.grade} Grade • {child.age} years old
                      </p>
                    </div>
                  </div>
                  {child.upcomingClasses.length > 0 ? (
                    <div className="space-y-4">
                      {child.upcomingClasses.map((cls) => (
                        <Card key={cls.id} className="overflow-hidden">
                          <div className="bg-primary/10 p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">{cls.subject}</h3>
                                <p className="text-sm text-muted-foreground">{cls.topic}</p>
                              </div>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">
                                    {cls.startTime} - {cls.endTime}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">Teacher: {cls.teacher}</span>
                                </div>
                              </div>
                              <div className="flex flex-col justify-end gap-2 md:items-end">
                                <Button variant="outline" asChild className="w-full md:w-auto">
                                  <Link href={`/parent/students/${child.id}/classes/${cls.id}`}>View Details</Link>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <p className="text-muted-foreground">No classes scheduled for today.</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent invoices and announcements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Recent Invoices</h3>
                <div className="space-y-4">
                  {parentData.recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <p className="font-medium">{invoice.description}</p>
                        <p className="text-sm text-muted-foreground">{new Date(invoice.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-medium">${invoice.amount.toFixed(2)}</p>
                        <Badge variant={invoice.status === "paid" ? "default" : "outline"}>{invoice.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/parent/invoices">
                      <FileText className="mr-2 h-4 w-4" />
                      View All Invoices
                    </Link>
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Announcements</h3>
                <div className="space-y-4">
                  {parentData.announcements.map((announcement) => (
                    <div key={announcement.id} className="p-3 border rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{announcement.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(announcement.date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm">{announcement.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>Manage your payment methods and billing information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div className="flex items-center gap-4">
              <CreditCard className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Credit Card ending in 4242</p>
                <p className="text-sm text-muted-foreground">Expires 04/25</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
