import { StudentSubscriptionType, SubscriptionType } from "@/types";
import { createClient } from "@/utils/supabase/server"

export async function getSubscriptions(): Promise<SubscriptionType[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching subscriptions:', error);
        return [];
    }

    return data || [];
}

export async function getSubscriptionInfoByStudentId(studentId: string): Promise<StudentSubscriptionType | null> {
    const supabase = await createClient();

    // Get the most recent active subscription for the student, including joined subscription info
    const { data, error } = await supabase
        .from('student_subscriptions')
        .select(`
            *,
            subscription:subscription_id (
                id,
                name,
                hours_per_month,
                rate,
                hourly_rate,
                max_free_absences,
                total_amount,
                created_at,
                updated_at
            )
        `)
        .eq('student_id', studentId)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Error fetching student subscription:', error);
        return null;
    }

    if (!data) {
        return null;
    }

    // The returned data will have a "subscription" property with the joined subscription info
    return data as StudentSubscriptionType;
}