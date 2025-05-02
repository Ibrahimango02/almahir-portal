"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { ParentWeeklySchedule } from "@/components/parent-weekly-schedule"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

// Mock data for parent's children
const children = [
  { id: "child1", name: "Emma Smith" },
  { id: "child2", name: "Noah Smith" },
]

// Mock data for parent's children classes
const childrenOld = [
  {
    id: "S001",
    name: "Emma Smith",
    grade: "10th",
    age: 16,
    classes: [
      {
        id: 1,
        subject: "Mathematics",
        topic: "Algebra Fundamentals",
        date: new Date(2023, 3, 17),
        startTime: "09:00 AM",
        endTime: "10:00 AM",
        teacher: "Sarah Johnson",
      },
      {
        id: 2,
        subject: "Physics",
        topic: "Mechanics",
        date: new Date(2023, 3, 17),
        startTime: "11:30 AM",
        endTime: "12:30 PM",
        teacher: "Michael Chen",
      },
      {
        id: 3,
        subject: "English",
        topic: "Literature Analysis",
        date: new Date(2023, 3, 18),
        startTime: "10:00 AM",
        endTime: "11:00 AM",
        teacher: "Emily Davis",
      },
    ],
  },
  {
    id: "S002",
    name: "Noah Smith",
    grade: "8th",
    age: 14,
    classes: [
      {
        id: 4,
        subject: "Mathematics",
        topic: "Pre-Algebra",
        date: new Date(2023, 3, 17),
        startTime: "10:00 AM",
        endTime: "11:00 AM",
        teacher: "Sarah Johnson",
      },
      {
        id: 5,
        subject: "Biology",
        topic: "Cell Structure",
        date: new Date(2023, 3, 17),
        startTime: "01:00 PM",
        endTime: "02:00 PM",
        teacher: "Jennifer Lee",
      },
      {
        id: 6,
        subject: "History",
        topic: "World War II",
        date: new Date(2023, 3, 19),
        startTime: "11:30 AM",
        endTime: "12:30 PM",
        teacher: "David Brown",
      },
    ],
  },
]

// Helper function to get all classes from all children
const getAllClasses = () => {
  const allClasses = []
  childrenOld.forEach((child) => {
    child.classes.forEach((cls) => {
      allClasses.push({
        ...cls,
        childName: child.name,
        childId: child.id,
      })
    })
  })
  return allClasses
}

// Helper function to group classes by date
const groupClassesByDate = (classes) => {
  const grouped = {}
  classes.forEach((cls) => {
    const dateStr = cls.date.toDateString()
    if (!grouped[dateStr]) {
      grouped[dateStr] = []
    }
    grouped[dateStr].push(cls)
  })
  return grouped
}

export default function ParentSchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [view, setView] = useState("calendar")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSubject, setFilterSubject] = useState("all")
  const [filterChild, setFilterChild] = useState("all")
  const [selectedChild, setSelectedChild] = useState("all")

  // Get all classes
  const allClasses = getAllClasses()

  // Filter classes based on search query, subject filter, and child filter
  const filteredClasses = allClasses.filter((cls) => {
    const matchesSearch =
      cls.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.teacher.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubject = filterSubject === "all" || cls.subject === filterSubject
    const matchesChild = filterChild === "all" || cls.childId === filterChild
    return matchesSearch && matchesSubject && matchesChild
  })

  // Group classes by date for the calendar view
  const groupedClasses = groupClassesByDate(filteredClasses)

  // Get classes for the selected date
  const selectedDateClasses = date ? groupedClasses[date.toDateString()] || [] : []

  // Function to render calendar day contents
  const renderCalendarDay = (day: Date) => {
    const dayClasses = groupedClasses[day.toDateString()] || []
    return dayClasses.length > 0 ? (
      <div className="relative h-full w-full p-2">
        <div className="absolute bottom-1 right-1">
          <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center">
            {dayClasses.length}
          </Badge>
        </div>
      </div>
    ) : null
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Children's Schedule</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search classes..." className="w-full pl-8" />
          </div>
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Child" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <CalendarDays className="mr-2 h-4 w-4" />
            View Calendar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Weekly Schedule</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-7 w-7">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="text-sm font-medium">April 14 - April 20, 2023</p>
              <Button variant="outline" size="icon" className="h-7 w-7">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>View and manage your children's weekly class schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Classes</TabsTrigger>
              <TabsTrigger value="morning">Morning</TabsTrigger>
              <TabsTrigger value="afternoon">Afternoon</TabsTrigger>
              <TabsTrigger value="evening">Evening</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <ParentWeeklySchedule childId={selectedChild !== "all" ? selectedChild : undefined} />
            </TabsContent>
            <TabsContent value="morning">
              <ParentWeeklySchedule filter="morning" childId={selectedChild !== "all" ? selectedChild : undefined} />
            </TabsContent>
            <TabsContent value="afternoon">
              <ParentWeeklySchedule filter="afternoon" childId={selectedChild !== "all" ? selectedChild : undefined} />
            </TabsContent>
            <TabsContent value="evening">
              <ParentWeeklySchedule filter="evening" childId={selectedChild !== "all" ? selectedChild : undefined} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
