"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecentClasses } from "@/components/recent-classes";
import { UpcomingClasses } from "@/components/upcoming-classes";
import { ClientDateDisplay } from "@/components/client-date-display";
import { useStudentSwitcher } from "@/contexts/StudentSwitcherContext";
import { useEffect, useState } from "react";
import { getStudentSessionsToday } from "@/lib/get/get-classes";
import { ClassSessionType } from "@/types";

interface DashboardContentProps {
    profile: {
        first_name: string;
        last_name: string;
    } | null;
    sessionsData: ClassSessionType[];
}

export function DashboardContent({ profile, sessionsData }: DashboardContentProps) {
    const { selectedStudent, isParentView } = useStudentSwitcher();
    const [studentSessions, setStudentSessions] = useState<ClassSessionType[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchStudentSessions = async () => {
            if (!selectedStudent) return;

            try {
                setIsLoading(true);
                const sessions = await getStudentSessionsToday(selectedStudent.student_id);
                setStudentSessions(sessions);
            } catch (error) {
                console.error('Failed to fetch student sessions:', error);
                setStudentSessions([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudentSessions();
    }, [selectedStudent]);

    // Determine which data to show and what title to display
    const currentSessions = isParentView ? sessionsData : studentSessions;
    const currentTitle = isParentView
        ? "Classes Overview"
        : `${selectedStudent?.first_name}'s Classes Overview`;
    const welcomeName = isParentView
        ? `${profile?.first_name} ${profile?.last_name}`
        : `${selectedStudent?.first_name} ${selectedStudent?.last_name}`;

    return (
        <div className="flex flex-col gap-6">
            {/* Welcome Banner */}
            <div className="rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 p-6 shadow-lg">
                <div className="text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                        Welcome, {welcomeName}!
                    </h2>
                    <p className="mt-2 text-green-100">
                        Almahir Academy Parent Portal
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    {!isParentView && (
                        <p className="text-sm text-muted-foreground">
                            Viewing {selectedStudent?.first_name}&apos;s profile
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <ClientDateDisplay />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-7">
                    <CardHeader>
                        <CardTitle>{currentTitle}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="upcoming" className="space-y-4">
                            <TabsList className="bg-muted/80">
                                <TabsTrigger value="recent">Recent</TabsTrigger>
                                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                            </TabsList>
                            <TabsContent value="upcoming" className="space-y-4">
                                <UpcomingClasses
                                    sessions={currentSessions}
                                    isLoading={isLoading}
                                    userType={isParentView ? "parent" : "student"}
                                />
                            </TabsContent>
                            <TabsContent value="recent" className="space-y-4">
                                <RecentClasses
                                    sessions={currentSessions}
                                    isLoading={isLoading}
                                    userType={isParentView ? "parent" : "student"}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 