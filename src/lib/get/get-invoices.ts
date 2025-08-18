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
            parent: undefined,
        }));
    }

    // Get student IDs and subscription IDs
    const studentIds = studentSubscriptions.map((ss: { student_id: string }) => ss.student_id);
    const subscriptionIds = studentSubscriptions.map((ss: { subscription_id: string }) => ss.subscription_id);

    // Get students data to determine their type
    const { data: studentsData } = await supabase
        .from('students')
        .select('id, student_type, profile_id')
        .in('id', studentIds);

    if (!studentsData) {
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
            parent: undefined,
        }));
    }

    // Separate independent and dependent students
    const independentStudentIds = studentsData
        .filter((s: { student_type: string; profile_id: string | null }) => s.student_type === 'independent' && s.profile_id)
        .map((s: { profile_id: string }) => s.profile_id);

    const dependentStudentIds = studentsData
        .filter((s: { student_type: string }) => s.student_type === 'dependent')
        .map((s: { id: string }) => s.id);

    // Get profiles for independent students and child profiles for dependent students
    const [independentProfilesData, childProfilesData, subscriptionsData] = await Promise.all([
        independentStudentIds.length > 0 ? supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', independentStudentIds) : Promise.resolve({ data: [] }),
        dependentStudentIds.length > 0 ? supabase
            .from('child_profiles')
            .select('student_id, first_name, last_name, parent_profile_id')
            .in('student_id', dependentStudentIds) : Promise.resolve({ data: [] }),
        supabase
            .from('subscriptions')
            .select('id, name, total_amount')
            .in('id', subscriptionIds)
    ]);

    const independentProfiles = independentProfilesData.data || [];
    const childProfiles = childProfilesData.data || [];
    const subscriptions = subscriptionsData.data || [];

    // Get unique parent IDs from child profiles
    const parentIds = [...new Set(childProfiles.map((cp: { parent_profile_id: string }) => cp.parent_profile_id))];
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
        const studentSubscription = studentSubscriptions?.find((ss: { id: string }) => ss.id === invoice.student_subscription);
        if (!studentSubscription) {
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
                parent: undefined,
            };
        }

        const studentData = studentsData?.find((s: { id: string }) => s.id === studentSubscription.student_id);
        let student = undefined;
        let parent = undefined;

        if (studentData) {
            if (studentData.student_type === 'independent' && studentData.profile_id) {
                // Independent student
                const profile = independentProfiles.find((p: { id: string }) => p.id === studentData.profile_id);
                if (profile) {
                    student = {
                        id: studentData.id,
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                    };
                    // Independent students don't have parents in this context
                }
            } else if (studentData.student_type === 'dependent') {
                // Dependent student
                const childProfile = childProfiles.find((cp: { student_id: string }) => cp.student_id === studentData.id);
                if (childProfile) {
                    student = {
                        id: studentData.id,
                        first_name: childProfile.first_name,
                        last_name: childProfile.last_name,
                    };
                    // Find parent for this dependent student
                    const parentProfile = parents.find((p: { id: string }) => p.id === childProfile.parent_profile_id);
                    if (parentProfile) {
                        parent = {
                            parent_id: parentProfile.id,
                            first_name: parentProfile.first_name,
                            last_name: parentProfile.last_name,
                        };
                    }
                }
            }
        }

        const subscription = subscriptions.find((sub: { id: string }) => sub.id === studentSubscription.subscription_id);

        const result = {
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
                id: student.id,
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

        return result;
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
            parent: undefined,
        };
    }

    const studentSubscription = studentSubscriptions[0];

    // Get student data to determine their type
    const { data: studentData } = await supabase
        .from('students')
        .select('id, student_type, profile_id')
        .eq('id', studentSubscription.student_id)
        .single();

    if (!studentData) {
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
            parent: undefined,
        };
    }

    let student = undefined;
    let parent = undefined;

    if (studentData.student_type === 'independent' && studentData.profile_id) {
        // Independent student - get profile from profiles table
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('id', studentData.profile_id)
            .single();

        if (profile) {
            student = {
                id: studentData.id,
                first_name: profile.first_name,
                last_name: profile.last_name,
            };
            // Independent students don't have parents in this context
        }
    } else if (studentData.student_type === 'dependent') {
        // Dependent student - get profile from child_profiles table
        const { data: childProfile } = await supabase
            .from('child_profiles')
            .select('student_id, first_name, last_name, parent_profile_id')
            .eq('student_id', studentData.id)
            .single();

        if (childProfile) {
            student = {
                id: studentData.id,
                first_name: childProfile.first_name,
                last_name: childProfile.last_name,
            };
            // Find parent for this dependent student
            const { data: parentProfile } = await supabase
                .from('profiles')
                .select('id, first_name, last_name')
                .eq('id', childProfile.parent_profile_id)
                .single();
            if (parentProfile) {
                parent = {
                    parent_id: parentProfile.id,
                    first_name: parentProfile.first_name,
                    last_name: parentProfile.last_name,
                };
            }
        }
    }

    // Get subscription data
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id, name, total_amount')
        .eq('id', studentSubscription.subscription_id)
        .single();

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
            id: student.id,
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
            parent: undefined,
        }));
    }

    // Get student IDs and subscription IDs
    const studentIds = studentSubscriptionsWithData.map((ss: { student_id: string }) => ss.student_id);
    const subscriptionIds = studentSubscriptionsWithData.map((ss: { subscription_id: string }) => ss.subscription_id);

    // Get students data to determine their type
    const { data: studentsData } = await supabase
        .from('students')
        .select('id, student_type, profile_id')
        .in('id', studentIds);

    if (!studentsData) {
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
            parent: undefined,
        }));
    }

    // Separate independent and dependent students
    const independentStudentIds = studentsData
        .filter((s: { student_type: string; profile_id: string | null }) => s.student_type === 'independent' && s.profile_id)
        .map((s: { profile_id: string }) => s.profile_id);

    const dependentStudentIds = studentsData
        .filter((s: { student_type: string }) => s.student_type === 'dependent')
        .map((s: { id: string }) => s.id);

    // Get profiles for independent students and child profiles for dependent students
    const [independentProfilesData, childProfilesData, subscriptionsData] = await Promise.all([
        independentStudentIds.length > 0 ? supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', independentStudentIds) : Promise.resolve({ data: [] }),
        dependentStudentIds.length > 0 ? supabase
            .from('child_profiles')
            .select('student_id, first_name, last_name, parent_profile_id')
            .in('student_id', dependentStudentIds) : Promise.resolve({ data: [] }),
        supabase
            .from('subscriptions')
            .select('id, name, total_amount')
            .in('id', subscriptionIds)
    ]);

    const independentProfiles = independentProfilesData.data || [];
    const childProfiles = childProfilesData.data || [];
    const subscriptions = subscriptionsData.data || [];

    // Get unique parent IDs from child profiles
    const parentIds = [...new Set(childProfiles.map((cp: { parent_profile_id: string }) => cp.parent_profile_id))];
    let parents: { id: string; first_name: string; last_name: string }[] = [];
    if (parentIds.length > 0) {
        const { data: parentProfiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', parentIds);
        parents = parentProfiles || [];
    }

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
        if (!studentSubscription) {
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
                parent: undefined,
            };
        }

        const studentData = studentsData.find((s: { id: string }) => s.id === studentSubscription.student_id);
        let student = undefined;
        let parent = undefined;

        if (studentData) {
            if (studentData.student_type === 'independent' && studentData.profile_id) {
                // Independent student
                const profile = independentProfiles.find((p: { id: string }) => p.id === studentData.profile_id);
                if (profile) {
                    student = {
                        id: studentData.id,
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                    };
                    // Independent students don't have parents in this context
                }
            } else if (studentData.student_type === 'dependent') {
                // Dependent student
                const childProfile = childProfiles.find((cp: { student_id: string }) => cp.student_id === studentData.id);
                if (childProfile) {
                    student = {
                        id: studentData.id,
                        first_name: childProfile.first_name,
                        last_name: childProfile.last_name,
                    };
                    // Find parent for this dependent student
                    const parentProfile = parents.find((p: { id: string }) => p.id === childProfile.parent_profile_id);
                    if (parentProfile) {
                        parent = {
                            parent_id: parentProfile.id,
                            first_name: parentProfile.first_name,
                            last_name: parentProfile.last_name,
                        };
                    }
                }
            }
        }

        const subscription = subscriptions.find((sub: { id: string }) => sub.id === studentSubscription.subscription_id);

        const result = {
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
                id: student.id,
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

        return result;
    });
}

export async function getInvoicesByParentId(parentId: string): Promise<StudentInvoiceType[] | null> {
    const supabase = createClient();

    // 1. Get all students of this parent
    const { data: childProfileIds } = await supabase
        .from('child_profiles')
        .select('student_id')
        .eq('parent_profile_id', parentId);

    if (!childProfileIds || childProfileIds.length === 0) return [];

    const parentStudentIds = childProfileIds.map(cp => cp.student_id);

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

    // 4. Get student, subscription, and parent info
    const studentIds = studentSubscriptions.map((ss: { student_id: string }) => ss.student_id);
    const subscriptionIds = studentSubscriptions.map((ss: { subscription_id: string }) => ss.subscription_id);

    // Get students data to determine their type
    const { data: studentsData } = await supabase
        .from('students')
        .select('id, student_type, profile_id')
        .in('id', studentIds);

    if (!studentsData) {
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
            parent: undefined,
        }));
    }

    // Separate independent and dependent students
    const independentStudentIds = studentsData
        .filter((s: { student_type: string; profile_id: string | null }) => s.student_type === 'independent' && s.profile_id)
        .map((s: { profile_id: string }) => s.profile_id);

    const dependentStudentIds = studentsData
        .filter((s: { student_type: string }) => s.student_type === 'dependent')
        .map((s: { id: string }) => s.id);

    // Get profiles for independent students and child profiles for dependent students
    const [independentProfilesData, childProfilesData, subscriptionsData] = await Promise.all([
        independentStudentIds.length > 0 ? supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', independentStudentIds) : Promise.resolve({ data: [] }),
        dependentStudentIds.length > 0 ? supabase
            .from('child_profiles')
            .select('student_id, first_name, last_name, parent_profile_id')
            .in('student_id', dependentStudentIds) : Promise.resolve({ data: [] }),
        supabase
            .from('subscriptions')
            .select('id, name, total_amount')
            .in('id', subscriptionIds)
    ]);

    const independentProfiles = independentProfilesData.data || [];
    const childProfiles = childProfilesData.data || [];
    const subscriptions = subscriptionsData.data || [];

    // Get unique parent IDs from child profiles
    const parentIds = [...new Set(childProfiles.map((cp: { parent_profile_id: string }) => cp.parent_profile_id))];
    let parents: { id: string; first_name: string; last_name: string }[] = [];
    if (parentIds.length > 0) {
        const { data: parentProfiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', parentIds);
        parents = parentProfiles || [];
    }

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
        if (!studentSubscription) {
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
                parent: undefined,
            };
        }

        const studentData = studentsData.find((s: { id: string }) => s.id === studentSubscription.student_id);
        let student = undefined;
        let parent = undefined;

        if (studentData) {
            if (studentData.student_type === 'independent' && studentData.profile_id) {
                // Independent student
                const profile = independentProfiles.find((p: { id: string }) => p.id === studentData.profile_id);
                if (profile) {
                    student = {
                        id: studentData.id,
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                    };
                    // Independent students don't have parents in this context
                }
            } else if (studentData.student_type === 'dependent') {
                // Dependent student
                const childProfile = childProfiles.find((cp: { student_id: string }) => cp.student_id === studentData.id);
                if (childProfile) {
                    student = {
                        id: studentData.id,
                        first_name: childProfile.first_name,
                        last_name: childProfile.last_name,
                    };
                    // Find parent for this dependent student
                    const parentProfile = parents.find((p: { id: string }) => p.id === childProfile.parent_profile_id);
                    if (parentProfile) {
                        parent = {
                            parent_id: parentProfile.id,
                            first_name: parentProfile.first_name,
                            last_name: parentProfile.last_name,
                        };
                    }
                }
            }
        }

        const subscription = subscriptions.find((sub: { id: string }) => sub.id === studentSubscription.subscription_id);

        const result = {
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
                id: student.id,
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

        return result;
    });
}