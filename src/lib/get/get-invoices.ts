import { createClient } from "@/utils/supabase/client"
import { StudentInvoiceType } from "@/types"

export async function getInvoices(): Promise<StudentInvoiceType[]> {
    const supabase = createClient();

    const { data: invoices, error } = await supabase
        .from('student_invoices')
        .select('*');

    if (error) {
        throw error;
    }

    if (!invoices) {
        return [];
    }

    // Get student subscription IDs
    const studentSubscriptionIds = invoices.map((invoice: { student_subscription: string }) => invoice.student_subscription);

    // Get student subscriptions
    const { data: studentSubscriptions } = await supabase
        .from('student_subscriptions')
        .select('id, student_id, subscription_id')
        .in('id', studentSubscriptionIds);

    if (!studentSubscriptions) {
        return invoices.map((invoice: {
            id: string;
            student_subscription: string;
            months: string;
            issue_date: string;
            due_date: string;
            paid_date: string | null;
            status: string;
            created_at: string;
            updated_at: string;
        }) => ({
            invoice_id: invoice.id,
            student_subscription: invoice.student_subscription,
            months: invoice.months,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
            paid_date: invoice.paid_date,
            status: invoice.status,
            created_at: invoice.created_at,
            updated_at: invoice.updated_at,
            student: undefined,
            subscription: undefined,
        }));
    }

    // Get student IDs and subscription IDs
    const studentIds = studentSubscriptions.map((ss: { student_id: string }) => ss.student_id);
    const subscriptionIds = studentSubscriptions.map((ss: { subscription_id: string }) => ss.subscription_id);

    // Get students and subscriptions data
    const [studentsData, subscriptionsData, parentStudentsData] = await Promise.all([
        supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', studentIds),
        supabase
            .from('subscriptions')
            .select('id, name, total_amount')
            .in('id', subscriptionIds),
        supabase
            .from('parent_students')
            .select('student_id, parent_id')
            .in('student_id', studentIds)
    ]);

    const students = studentsData.data || [];
    const subscriptions = subscriptionsData.data || [];
    const parentStudents = parentStudentsData.data || [];

    // Get unique parent IDs
    const parentIds = [...new Set(parentStudents.map((ps: { parent_id: string }) => ps.parent_id))];
    let parents: { id: string; first_name: string; last_name: string }[] = [];
    if (parentIds.length > 0) {
        const { data: parentProfiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', parentIds);
        parents = parentProfiles || [];
    }

    return invoices.map((invoice: {
        id: string;
        student_subscription: string;
        months: string;
        issue_date: string;
        due_date: string;
        paid_date: string | null;
        status: string;
        created_at: string;
        updated_at: string;
    }) => {
        const studentSubscription = studentSubscriptions.find((ss: { id: string }) => ss.id === invoice.student_subscription);
        const student = studentSubscription ? students.find((s: { id: string }) => s.id === studentSubscription.student_id) : null;
        const subscription = studentSubscription ? subscriptions.find((sub: { id: string }) => sub.id === studentSubscription.subscription_id) : null;
        // Find parent for this student
        let parent = undefined;
        const parentStudent = parentStudents.find((ps: { student_id: string }) => ps.student_id === student?.id);
        if (parentStudent) {
            const parentProfile = parents.find((p: { id: string }) => p.id === parentStudent.parent_id);
            if (parentProfile) {
                parent = {
                    parent_id: parentProfile.id,
                    first_name: parentProfile.first_name,
                    last_name: parentProfile.last_name,
                };
            }
        }
        return {
            invoice_id: invoice.id,
            student_subscription: invoice.student_subscription,
            months: invoice.months,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
            paid_date: invoice.paid_date,
            status: invoice.status,
            created_at: invoice.created_at,
            updated_at: invoice.updated_at,
            student: student ? {
                student_id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
            } : undefined,
            subscription: subscription ? {
                id: subscription.id,
                name: subscription.name,
                total_amount: subscription.total_amount,
            } : undefined,
            parent,
        };
    });
}

export async function getInvoiceById(id: string): Promise<StudentInvoiceType | null> {
    const supabase = createClient();

    const { data: invoices, error } = await supabase
        .from('student_invoices')
        .select('*')
        .eq('id', id);

    if (error) {
        throw error;
    }

    if (!invoices || invoices.length === 0) {
        return null;
    }

    const invoice = invoices[0];

    // Fetch student subscription
    const { data: studentSubscriptions } = await supabase
        .from('student_subscriptions')
        .select('id, student_id, subscription_id')
        .eq('id', invoice.student_subscription);

    if (!studentSubscriptions || studentSubscriptions.length === 0) {
        return {
            invoice_id: invoice.id,
            student_subscription: invoice.student_subscription,
            months: invoice.months,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
            paid_date: invoice.paid_date,
            status: invoice.status,
            created_at: invoice.created_at,
            updated_at: invoice.updated_at,
            student: undefined,
            subscription: undefined,
        };
    }

    const studentSubscription = studentSubscriptions[0];

    // Get student and subscription data
    const [studentsData, subscriptionsData] = await Promise.all([
        supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('id', studentSubscription.student_id),
        supabase
            .from('subscriptions')
            .select('id, name, total_amount')
            .eq('id', studentSubscription.subscription_id)
    ]);

    const student = studentsData.data?.[0];
    const subscription = subscriptionsData.data?.[0];

    return {
        invoice_id: invoice.id,
        student_subscription: invoice.student_subscription,
        months: invoice.months,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        paid_date: invoice.paid_date,
        status: invoice.status,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
        student: student ? {
            student_id: student.id,
            first_name: student.first_name,
            last_name: student.last_name,
        } : undefined,
        subscription: subscription ? {
            id: subscription.id,
            name: subscription.name,
            total_amount: subscription.total_amount,
        } : undefined,
    };
}

export async function getLastInvoiceId(): Promise<string | null> {
    const supabase = createClient();

    const { data: invoices, error } = await supabase
        .from('student_invoices')
        .select('id')
        .order('issue_date', { ascending: false })
        .limit(1);

    if (error) {
        throw error;
    }

    return invoices?.[0]?.id ?? null;
}

export async function getInvoicesByStudentId(studentId: string): Promise<StudentInvoiceType[] | null> {
    const supabase = createClient();

    // First, get all student subscriptions for this student
    const { data: studentSubscriptions, error: subscriptionError } = await supabase
        .from('student_subscriptions')
        .select('id')
        .eq('student_id', studentId);

    if (subscriptionError) {
        throw subscriptionError;
    }

    if (!studentSubscriptions || studentSubscriptions.length === 0) {
        return null;
    }

    const studentSubscriptionIds = studentSubscriptions.map((ss: { id: string }) => ss.id);

    // Get all invoices for these student subscriptions
    const { data: invoices, error: invoiceError } = await supabase
        .from('student_invoices')
        .select('*')
        .in('student_subscription', studentSubscriptionIds);

    if (invoiceError) {
        throw invoiceError;
    }

    if (!invoices || invoices.length === 0) {
        return null;
    }

    // Get student subscriptions
    const { data: studentSubscriptionsWithData } = await supabase
        .from('student_subscriptions')
        .select('id, student_id, subscription_id')
        .in('id', studentSubscriptionIds);

    if (!studentSubscriptionsWithData) {
        return invoices.map((invoice: {
            id: string;
            student_subscription: string;
            months: string;
            issue_date: string;
            due_date: string;
            paid_date: string | null;
            status: string;
            created_at: string;
            updated_at: string;
        }) => ({
            invoice_id: invoice.id,
            student_subscription: invoice.student_subscription,
            months: invoice.months,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
            paid_date: invoice.paid_date,
            status: invoice.status,
            created_at: invoice.created_at,
            updated_at: invoice.updated_at,
            student: undefined,
            subscription: undefined,
        }));
    }

    // Get student IDs and subscription IDs
    const studentIds = studentSubscriptionsWithData.map((ss: { student_id: string }) => ss.student_id);
    const subscriptionIds = studentSubscriptionsWithData.map((ss: { subscription_id: string }) => ss.subscription_id);

    // Get students and subscriptions data
    const [studentsData, subscriptionsData] = await Promise.all([
        supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', studentIds),
        supabase
            .from('subscriptions')
            .select('id, name, total_amount')
            .in('id', subscriptionIds)
    ]);

    const students = studentsData.data || [];
    const subscriptions = subscriptionsData.data || [];

    // Map invoices to StudentInvoiceType[]
    return invoices.map((invoice: {
        id: string;
        student_subscription: string;
        months: string;
        issue_date: string;
        due_date: string;
        paid_date: string | null;
        status: string;
        created_at: string;
        updated_at: string;
    }) => {
        const studentSubscription = studentSubscriptionsWithData.find((ss: { id: string }) => ss.id === invoice.student_subscription);
        const student = studentSubscription ? students.find((s: { id: string }) => s.id === studentSubscription.student_id) : null;
        const subscription = studentSubscription ? subscriptions.find((sub: { id: string }) => sub.id === studentSubscription.subscription_id) : null;

        return {
            invoice_id: invoice.id,
            student_subscription: invoice.student_subscription,
            months: invoice.months,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
            paid_date: invoice.paid_date,
            status: invoice.status,
            created_at: invoice.created_at,
            updated_at: invoice.updated_at,
            student: student ? {
                student_id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
            } : undefined,
            subscription: subscription ? {
                id: subscription.id,
                name: subscription.name,
                total_amount: subscription.total_amount,
            } : undefined,
        };
    });
}

export async function getInvoicesByParentId(parentId: string): Promise<StudentInvoiceType[] | null> {
    const supabase = createClient();

    // 1. Get all students of this parent
    const { data: parentStudents } = await supabase
        .from('parent_students')
        .select('student_id')
        .eq('parent_id', parentId);

    if (!parentStudents || parentStudents.length === 0) return [];

    const parentStudentIds = parentStudents.map(ps => ps.student_id);

    // 2. Get all student subscriptions for these students
    const { data: studentSubscriptions, error: subscriptionError } = await supabase
        .from('student_subscriptions')
        .select('id, student_id, subscription_id')
        .in('student_id', parentStudentIds);

    if (subscriptionError) {
        throw subscriptionError;
    }

    if (!studentSubscriptions || studentSubscriptions.length === 0) {
        return [];
    }

    const studentSubscriptionIds = studentSubscriptions.map((ss: { id: string }) => ss.id);

    // 3. Get all invoices for these student subscriptions
    const { data: invoices, error: invoiceError } = await supabase
        .from('student_invoices')
        .select('*')
        .in('student_subscription', studentSubscriptionIds);

    if (invoiceError) {
        throw invoiceError;
    }

    if (!invoices || invoices.length === 0) {
        return [];
    }

    // 4. Get student and subscription info
    const studentIds = studentSubscriptions.map((ss: { student_id: string }) => ss.student_id);
    const subscriptionIds = studentSubscriptions.map((ss: { subscription_id: string }) => ss.subscription_id);

    const [studentsData, subscriptionsData] = await Promise.all([
        supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', studentIds),
        supabase
            .from('subscriptions')
            .select('id, name, total_amount')
            .in('id', subscriptionIds)
    ]);

    const students = studentsData.data || [];
    const subscriptions = subscriptionsData.data || [];

    // 5. Map invoices to StudentInvoiceType[]
    return invoices.map((invoice: {
        id: string;
        student_subscription: string;
        months: string;
        issue_date: string;
        due_date: string;
        paid_date: string | null;
        status: string;
        created_at: string;
        updated_at: string;
    }) => {
        const studentSubscription = studentSubscriptions.find((ss: { id: string }) => ss.id === invoice.student_subscription);
        const student = studentSubscription ? students.find((s: { id: string }) => s.id === studentSubscription.student_id) : null;
        const subscription = studentSubscription ? subscriptions.find((sub: { id: string }) => sub.id === studentSubscription.subscription_id) : null;

        return {
            invoice_id: invoice.id,
            student_subscription: invoice.student_subscription,
            months: invoice.months,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
            paid_date: invoice.paid_date,
            status: invoice.status,
            created_at: invoice.created_at,
            updated_at: invoice.updated_at,
            student: student ? {
                student_id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
            } : undefined,
            subscription: subscription ? {
                id: subscription.id,
                name: subscription.name,
                total_amount: subscription.total_amount,
            } : undefined,
        };
    });
}