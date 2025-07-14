

import { getSubscriptionInfoByStudentId } from "@/lib/get/get-subscriptions"
import { StudentSubscriptionType } from "@/types"

export default async function TestPage() {
    const studentId = '10a65d74-0f95-499b-93f3-11f8db38185c';
    const subscriptionInfo: StudentSubscriptionType | null = await getSubscriptionInfoByStudentId(studentId);

    if (!subscriptionInfo) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <p>No subscription info found for student ID {studentId}.</p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md dark:bg-gray-900">
            <h1 className="text-2xl font-bold mb-4">Student Subscription Info</h1>
            <div className="mb-4">
                <p><span className="font-semibold">ID:</span> {subscriptionInfo.id}</p>
                <p><span className="font-semibold">Student ID:</span> {subscriptionInfo.student_id}</p>
                <p><span className="font-semibold">Subscription ID:</span> {subscriptionInfo.subscription_id}</p>
                <p><span className="font-semibold">Start Date:</span> {subscriptionInfo.start_date}</p>
                <p><span className="font-semibold">End Date:</span> {subscriptionInfo.end_date}</p>
                <p><span className="font-semibold">Status:</span> {subscriptionInfo.status}</p>
                <p><span className="font-semibold">Free Absences Remaining:</span> {subscriptionInfo.free_absences_remaining ?? 'N/A'}</p>
                <p><span className="font-semibold">Created At:</span> {subscriptionInfo.created_at}</p>
                <p><span className="font-semibold">Updated At:</span> {subscriptionInfo.updated_at ?? 'N/A'}</p>
            </div>
            {subscriptionInfo.subscription && (
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-2">Subscription Details</h2>
                    <p><span className="font-semibold">Name:</span> {subscriptionInfo.subscription.name}</p>
                    <p><span className="font-semibold">Hours/Month:</span> {subscriptionInfo.subscription.hours_per_month}</p>
                    <p><span className="font-semibold">Rate:</span> {subscriptionInfo.subscription.rate}</p>
                    <p><span className="font-semibold">Hourly Rate:</span> {subscriptionInfo.subscription.hourly_rate}</p>
                    <p><span className="font-semibold">Max Free Absences:</span> {subscriptionInfo.subscription.max_free_absences}</p>
                    <p><span className="font-semibold">Total Amount:</span> {subscriptionInfo.subscription.total_amount ?? 'N/A'}</p>
                    <p><span className="font-semibold">Created At:</span> {subscriptionInfo.subscription.created_at}</p>
                    <p><span className="font-semibold">Updated At:</span> {subscriptionInfo.subscription.updated_at ?? 'N/A'}</p>
                </div>
            )}
        </div>
    );
}
