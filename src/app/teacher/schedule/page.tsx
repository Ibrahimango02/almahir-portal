"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { TeacherWeeklySchedule } from "@/components/teacher-weekly-schedule"
import { useState } from "react"

export default function TeacherSchedulePage() {
  const [currentWeek, setCurrentWeek] = useState("April 14 - April 20, 2023")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Class Schedule</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search classes..." className="w-full pl-8" />
          </div>
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
              <p className="text-sm font-medium">{currentWeek}</p>
              <Button variant="outline" size="icon" className="h-7 w-7">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>View and manage your weekly class schedule</CardDescription>
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
              <TeacherWeeklySchedule />
            </TabsContent>
            <TabsContent value="morning">
              <TeacherWeeklySchedule filter="morning" />
            </TabsContent>
            <TabsContent value="afternoon">
              <TeacherWeeklySchedule filter="afternoon" />
            </TabsContent>
            <TabsContent value="evening">
              <TeacherWeeklySchedule filter="evening" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
