import { createClient } from "@/utils/supabase/client"
import { TeacherPaymentType } from "@/types"
import { SupabaseClient } from "@supabase/supabase-js"

// Helper to fetch session + class title
async function getSessionWithClassTitle(supabase: SupabaseClient, sessionId: string) {
    // Get session
    const { data: sessionData, error: sessionError } = await supabase
        .from('class_sessions')
        .select('id, start_date, end_date, class_id')
        .eq('id', sessionId)
        .single();
    if (sessionError || !sessionData) {
        return {
            class_title: '',
            session_id: sessionId,
            start_date: '',
            end_date: '',
        };
    }
    // Get class title
    const { data: classData } = await supabase
        .from('classes')
        .select('title')
        .eq('id', sessionData.class_id)
        .single();
    return {
        class_title: classData?.title || '',
        session_id: sessionData.id,
        start_date: sessionData.start_date,
        end_date: sessionData.end_date,
    };
}

export async function getTeacherPayments(): Promise<TeacherPaymentType[]> {
    const supabase = createClient()

    const { data: payments, error } = await supabase
        .from('teacher_payments')
        .select('*')

    if (error) {
        throw error
    }

    if (!payments) {
        return []
    }

    // Get teacher IDs and session IDs
    const teacherIds = payments.map((payment: { teacher_id: string }) => payment.teacher_id)
    const sessionIds = payments.map((payment: { session_id: string }) => payment.session_id)

    // Get teachers data
    const { data: teachers, error: teachersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', teacherIds)
    if (teachersError) throw teachersError;

    // Get sessions data (with class_id)
    const { data: sessions, error: sessionsError } = await supabase
        .from('class_sessions')
        .select('id, start_date, end_date, class_id')
        .in('id', sessionIds)
    if (sessionsError) throw sessionsError;

    // Get class_ids
    const classIds = sessions.map((s: { class_id: string }) => s.class_id)
    // Get classes data
    const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, title')
        .in('id', classIds)
    if (classesError) throw classesError;

    return payments.map((payment: { id: string; teacher_id: string; session_id: string; hours: number; amount: number; status: string; paid_date: string | null; created_at: string; updated_at: string }) => {
        const teacher = teachers.find((t: { id: string }) => t.id === payment.teacher_id) || { id: '', first_name: '', last_name: '' };
        const session = sessions.find((s: { id: string }) => s.id === payment.session_id) || { id: '', start_date: '', end_date: '', class_id: '' };
        const classObj = classes.find((c: { id: string }) => c.id === session.class_id) || { title: '' };
        return {
            payment_id: payment.id,
            hours: payment.hours,
            amount: payment.amount,
            status: payment.status,
            paid_date: payment.paid_date ?? null,
            created_at: payment.created_at,
            updated_at: payment.updated_at,
            teacher: {
                teacher_id: teacher.id || '',
                first_name: teacher.first_name || '',
                last_name: teacher.last_name || '',
            },
            session: {
                class_title: classObj.title || '',
                session_id: session.id || '',
                start_date: session.start_date || '',
                end_date: session.end_date || '',
            },
        }
    })
}

export async function getTeacherPaymentById(id: string): Promise<TeacherPaymentType | null> {
    const supabase = createClient()

    const { data: payments, error } = await supabase
        .from('teacher_payments')
        .select('*')
        .eq('id', id)

    if (error) {
        throw error
    }

    if (!payments || payments.length === 0) {
        return null
    }

    const payment = payments[0]

    // Get teacher
    const { data: teacher, error: teacherError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', payment.teacher_id)
        .single();
    if (teacherError) throw teacherError;

    // Get session + class title
    const session = await getSessionWithClassTitle(supabase, payment.session_id);

    return {
        payment_id: payment.id,
        hours: payment.hours,
        amount: payment.amount,
        status: payment.status,
        paid_date: payment.paid_date ?? null,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        teacher: {
            teacher_id: teacher?.id || '',
            first_name: teacher?.first_name || '',
            last_name: teacher?.last_name || '',
        },
        session,
    }
}

export async function getTeacherPaymentsByTeacherId(teacherId: string): Promise<TeacherPaymentType[] | null> {
    const supabase = createClient()

    const { data: payments, error } = await supabase
        .from('teacher_payments')
        .select('*')
        .eq('teacher_id', teacherId)

    if (error) {
        throw error
    }

    if (!payments || payments.length === 0) {
        return null
    }

    // Get teacher
    const { data: teacher, error: teacherError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', teacherId)
        .single();
    if (teacherError) throw teacherError;

    // Get session IDs
    const sessionIds = payments.map((payment: { session_id: string }) => payment.session_id)
    // Get sessions data (with class_id)
    const { data: sessions, error: sessionsError } = await supabase
        .from('class_sessions')
        .select('id, start_date, end_date, class_id')
        .in('id', sessionIds)
    if (sessionsError) throw sessionsError;
    // Get class_ids
    const classIds = sessions.map((s: { class_id: string }) => s.class_id)
    // Get classes data
    const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, title')
        .in('id', classIds)
    if (classesError) throw classesError;

    return payments.map((payment: { id: string; teacher_id: string; session_id: string; hours: number; amount: number; status: string; paid_date: string | null; created_at: string; updated_at: string }) => {
        const session = sessions.find((s: { id: string }) => s.id === payment.session_id) || { id: '', start_date: '', end_date: '', class_id: '' };
        const classObj = classes.find((c: { id: string }) => c.id === session.class_id) || { title: '' };
        return {
            payment_id: payment.id,
            hours: payment.hours,
            amount: payment.amount,
            status: payment.status,
            paid_date: payment.paid_date ?? null,
            created_at: payment.created_at,
            updated_at: payment.updated_at,
            teacher: {
                teacher_id: teacher?.id || '',
                first_name: teacher?.first_name || '',
                last_name: teacher?.last_name || '',
            },
            session: {
                class_title: classObj.title || '',
                session_id: session.id || '',
                start_date: session.start_date || '',
                end_date: session.end_date || '',
            },
        }
    })
}

export async function getTeacherPaymentsBySessionId(sessionId: string): Promise<TeacherPaymentType[] | null> {
    const supabase = createClient()

    const { data: payments, error } = await supabase
        .from('teacher_payments')
        .select('*')
        .eq('session_id', sessionId)

    if (error) {
        throw error
    }

    if (!payments || payments.length === 0) {
        return null
    }

    // Get teacher IDs
    const teacherIds = payments.map((payment: { teacher_id: string }) => payment.teacher_id)
    // Get teachers data
    const { data: teachers, error: teachersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', teacherIds)
    if (teachersError) throw teachersError;

    // Get session + class title
    const session = await getSessionWithClassTitle(supabase, sessionId);

    return payments.map((payment: { id: string; teacher_id: string; session_id: string; hours: number; amount: number; status: string; paid_date: string | null; created_at: string; updated_at: string }) => {
        const teacher = teachers.find((t: { id: string }) => t.id === payment.teacher_id) || { id: '', first_name: '', last_name: '' };
        return {
            payment_id: payment.id,
            hours: payment.hours,
            amount: payment.amount,
            status: payment.status,
            paid_date: payment.paid_date ?? null,
            created_at: payment.created_at,
            updated_at: payment.updated_at,
            teacher: {
                teacher_id: teacher.id || '',
                first_name: teacher.first_name || '',
                last_name: teacher.last_name || '',
            },
            session,
        }
    })
} 