import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecentClasses } from "@/components/recent-classes";
import { UpcomingClasses } from "@/components/upcoming-classes";
import { ClientDateDisplay } from "@/components/client-date-display";
import { getStudentSessionsToday } from "@/lib/get/get-classes";
import { getStudentId } from "@/lib/get/get-students";
import { createClient } from "@/utils/supabase/server";
import { ClassSessionType } from "@/types";

export default async function StudentDashboard() {
    const supabase = await createClient();

    // Get user profile
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user?.id)
        .single();

    // Get student ID and fetch student sessions data for the unified components
    let sessionsData: ClassSessionType[] = [];
    if (user) {
        const studentId = await getStudentId(user.id);
        if (studentId) {
            sessionsData = await getStudentSessionsToday(studentId);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Prominent Welcome Banner */}
            <div className="w-full flex items-center bg-green-800 min-h-[110px] shadow-md" style={{ borderBottom: '4px solid #34d399' }}>
                <div className="flex-1 flex justify-center items-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white text-center drop-shadow-lg">
                        Welcome, {profile?.first_name} {profile?.last_name}!
                    </h2>
                </div>
            </div>
            {/* End Banner */}

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
                        <CardDescription>View your upcoming and recent classes</CardDescription>
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
                                    userType="student"
                                />
                            </TabsContent>
                            <TabsContent value="recent" className="space-y-4">
                                <RecentClasses
                                    sessions={sessionsData}
                                    isLoading={false}
                                    userType="student"
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
