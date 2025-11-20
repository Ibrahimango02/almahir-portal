"use client"

import { getParentStudentsSessionsToday } from "@/lib/get/get-classes";
import { createClient } from "@/utils/supabase/client";
import { DashboardContent } from "@/components/dashboard-content";
import { useEffect, useState } from "react";
import { ClassSessionType } from "@/types";

export default function ParentDashboard() {
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

                    // Fetch parent's students sessions data
                    const sessions = await getParentStudentsSessionsToday(user.id);
                    setSessionsData(sessions || []);
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
        );
    }

    return (
        <DashboardContent
            profile={profile}
            sessionsData={sessionsData}
        />
    );
}
