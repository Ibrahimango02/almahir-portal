import { getParentStudentsSessionsToday } from "@/lib/get/get-classes";
import { createClient } from "@/utils/supabase/server";
import { DashboardContent } from "@/components/dashboard-content";

export default async function ParentDashboard() {
    const supabase = await createClient();

    // Get user profile
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user?.id)
        .single();

    // Fetch parent's students sessions data for the unified components
    const sessionsData = user ? await getParentStudentsSessionsToday(user.id) : [];

    return (
        <DashboardContent
            profile={profile}
            sessionsData={sessionsData}
        />
    );
}
