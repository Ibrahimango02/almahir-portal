"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecentClasses } from "@/components/recent-classes";
import { UpcomingClasses } from "@/components/upcoming-classes";
import { ClientDateDisplay } from "@/components/client-date-display";
import { getStudentSessionsToday } from "@/lib/get/get-classes";
import { getStudentId } from "@/lib/get/get-students";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { ClassSessionType } from "@/types";

export default function StudentDashboard() {
    const [profile, setProfile] = useState<{ first_name: string; last_name: string } | null>(null);
    const [sessionsData, setSessionsData] = useState<ClassSessionType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const supabase = createClient();

                // Get user profile
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('first_name, last_name')
                        .eq('id', user.id)
                        .single();
                    setProfile(profileData);

                    // Get student ID and fetch student sessions data
                    const studentId = await getStudentId(user.id);
                    if (studentId) {
                        const sessions = await getStudentSessionsToday(studentId);
                        setSessionsData(sessions || []);
                    }
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Set up polling every 30 seconds to refresh dashboard data
        const interval = setInterval(fetchData, 30000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="rounded-lg bg-[#1f6749] p-6 shadow-lg">
                    <div className="text-center">
                        <div className="h-8 w-64 bg-white/20 rounded animate-pulse mx-auto"></div>
                    </div>
                </div>
                <div className="flex items-center justify-center py-20">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span>Loading dashboard...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Welcome Banner */}
            <div className="rounded-lg bg-[#1f6749] p-6 shadow-lg">
                <div className="text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                        Welcome, {profile?.first_name} {profile?.last_name}!
                    </h2>
                    <p className="mt-2 text-green-100">
                        Almahir Academy Student Portal
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
                                    userType="student"
                                />
                            </TabsContent>
                            <TabsContent value="recent" className="space-y-4">
                                <RecentClasses
                                    sessions={sessionsData}
                                    isLoading={loading}
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
