import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RecentClasses } from "@/components/recent-classes"
import { UpcomingClasses } from "@/components/upcoming-classes"
import { ClientDateDisplay } from "@/components/client-date-display"
import { getTeacherSessionsToday } from "@/lib/get/get-classes"
import { createClient } from "@/utils/supabase/server"

export default async function TeacherDashboard() {
    const supabase = await createClient()

    // Get user profile
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user?.id)
        .single()

    // Fetch teacher sessions data for the unified components
    const sessionsData = user ? await getTeacherSessionsToday(user.id) : []

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
                        <CardDescription>View and manage your upcoming and recent classes</CardDescription>
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
                                    isLoading={false}
                                    userType="teacher"
                                />
                            </TabsContent>
                            <TabsContent value="recent" className="space-y-4">
                                <RecentClasses
                                    sessions={sessionsData}
                                    isLoading={false}
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
