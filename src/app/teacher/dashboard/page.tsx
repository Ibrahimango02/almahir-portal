"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RecentClasses } from "@/components/recent-classes"
import { UpcomingClasses } from "@/components/upcoming-classes"
import { ClientDateDisplay } from "@/components/client-date-display"
import { getTeacherSessionsToday } from "@/lib/get/get-classes"
import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"
import { ClassSessionType } from "@/types"

export default function TeacherDashboard() {
    const [profile, setProfile] = useState<{ first_name: string; last_name: string } | null>(null)
    const [sessionsData, setSessionsData] = useState<ClassSessionType[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const supabase = createClient()

                // Get user profile
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('first_name, last_name')
                        .eq('id', user.id)
                        .single()
                    setProfile(profileData)

                    // Fetch teacher sessions data
                    const sessions = await getTeacherSessionsToday(user.id)
                    setSessionsData(sessions || [])
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()

        // Set up polling every 30 seconds to refresh dashboard data
        const interval = setInterval(fetchData, 30000)

        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="w-full flex items-center bg-green-800 min-h-[110px] shadow-md" style={{ borderBottom: '4px solid #34d399' }}>
                    <div className="flex-1 flex justify-center items-center">
                        <div className="h-8 w-64 bg-white/20 rounded animate-pulse"></div>
                    </div>
                </div>
                <div className="flex items-center justify-center py-20">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span>Loading dashboard...</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Welcome Banner */}
            <div className="rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 p-6 shadow-lg">
                <div className="text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                        Welcome, {profile?.first_name} {profile?.last_name}!
                    </h2>
                    <p className="mt-2 text-green-100">
                        Al-Mahir Academy Teacher Portal
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                </div>
                <div className="flex items-center gap-4">
                    <ClientDateDisplay />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-7">
                    <CardHeader>
                        <CardTitle>Classes Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="upcoming" className="space-y-4">
                            <TabsList className="bg-muted/80">
                                <TabsTrigger value="recent">Recent</TabsTrigger>
                                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                            </TabsList>
                            <TabsContent value="upcoming" className="space-y-4">
                                <UpcomingClasses
                                    sessions={sessionsData}
                                    isLoading={loading}
                                    userType="teacher"
                                />
                            </TabsContent>
                            <TabsContent value="recent" className="space-y-4">
                                <RecentClasses
                                    sessions={sessionsData}
                                    isLoading={loading}
                                    userType="teacher"
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
