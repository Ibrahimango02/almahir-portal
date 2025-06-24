import { createClient } from "@/utils/supabase/client"
import { InvoiceType } from "@/types"

export async function getInvoices(): Promise<InvoiceType[]> {
    const supabase = createClient()

    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')

    if (error) {
        throw error
    }

    if (!invoices) {
        return []
    }

    const studentIds = invoices?.map(invoice => invoice.student_id)

    const { data: students } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', studentIds)

    const parentIds = invoices?.map(invoice => invoice.parent_id)

    const { data: parents } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', parentIds)

    // Transform the data to match InvoiceType
    return invoices.map(invoice => ({
        invoice_id: invoice.invoice_id,
        student: {
            student_id: invoice.student_id,
            first_name: students?.find(student => student.id === invoice.student_id)?.first_name ?? "",
            last_name: students?.find(student => student.id === invoice.student_id)?.last_name ?? ""
        },
        parent: {
            parent_id: invoice.parent_id,
            first_name: parents?.find(parent => parent.id === invoice.parent_id)?.first_name ?? "",
            last_name: parents?.find(parent => parent.id === invoice.parent_id)?.last_name ?? ""
        },
        invoice_type: invoice.invoice_type,
        amount: invoice.amount,
        currency: invoice.currency,
        description: invoice.description,
        due_date: invoice.due_date,
        status: invoice.status,
        paid_at: invoice.paid_at,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at
    }))
}

export async function getInvoiceById(id: string): Promise<InvoiceType | null> {
    const supabase = createClient()

    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('invoice_id', id)

    if (error) {
        throw error
    }

    if (!invoices || invoices.length === 0) {
        return null
    }

    const invoice = invoices[0]

    // Fetch student info
    const { data: students } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', invoice.student_id)

    const student = students && students.length > 0 ? students[0] : null

    const { data: parents } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', invoice.parent_id)

    const parent = parents && parents.length > 0 ? parents[0] : null

    return {
        invoice_id: invoice.invoice_id,
        student: {
            student_id: invoice.student_id,
            first_name: student?.first_name ?? "",
            last_name: student?.last_name ?? ""
        },
        parent: {
            parent_id: invoice.parent_id,
            first_name: parent?.first_name ?? "",
            last_name: parent?.last_name ?? ""
        },
        invoice_type: invoice.invoice_type,
        amount: invoice.amount,
        currency: invoice.currency,
        description: invoice.description,
        due_date: invoice.due_date,
        status: invoice.status,
        paid_at: invoice.paid_at,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at
    }
}

export async function getLastInvoiceId(): Promise<string> {
    const supabase = createClient()

    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('invoice_id')
        .order('invoice_id', { ascending: false })
        .limit(1)

    if (error) {
        throw error
    }

    return invoices?.[0]?.invoice_id
}

export async function getInvoicesByStudentId(studentId: string): Promise<InvoiceType[] | null> {
    const supabase = createClient();

    // Get all invoices for the given studentId
    const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('student_id', studentId);

    if (invoiceError) {
        throw invoiceError;
    }

    if (!invoices || invoices.length === 0) {
        return null;
    }

    // Get student info
    const { data: students, error: studentError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', studentId);

    if (studentError) {
        throw studentError;
    }

    const student = students && students.length > 0 ? students[0] : null;

    // Get all parent ids from the invoices
    const parentIds = invoices.map(inv => inv.parent_id).filter(Boolean);

    let parents: { id: string; first_name: string; last_name: string }[] = [];
    if (parentIds.length > 0) {
        const { data: parentProfiles, error: parentError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', parentIds);

        if (parentError) {
            throw parentError;
        }
        parents = parentProfiles || [];
    }

    // Map invoices to InvoiceType[]
    return invoices.map(invoice => ({
        invoice_id: invoice.invoice_id,
        student: {
            student_id: invoice.student_id,
            first_name: student?.first_name ?? "",
            last_name: student?.last_name ?? ""
        },
        parent: {
            parent_id: invoice.parent_id,
            first_name: parents.find(parent => parent.id === invoice.parent_id)?.first_name ?? "",
            last_name: parents.find(parent => parent.id === invoice.parent_id)?.last_name ?? ""
        },
        invoice_type: invoice.invoice_type,
        amount: invoice.amount,
        currency: invoice.currency,
        description: invoice.description,
        due_date: invoice.due_date,
        status: invoice.status,
        paid_at: invoice.paid_at,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at
    }));
}

export async function getInvoicesByParentId(parentId: string): Promise<InvoiceType[] | null> {
    const supabase = createClient();

    // Get all invoices for the parent
    const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('parent_id', parentId);

    if (invoiceError) {
        throw invoiceError;
    }

    if (!invoices || invoices.length === 0) {
        return null;
    }

    // Get all unique student ids from the invoices
    const studentIds = invoices.map(inv => inv.student_id).filter(Boolean);

    let students: { student_id: string; first_name: string; last_name: string }[] = [];
    if (studentIds.length > 0) {
        const { data: studentProfiles, error: studentError } = await supabase
            .from('students')
            .select('student_id, first_name, last_name')
            .in('student_id', studentIds);

        if (studentError) {
            throw studentError;
        }
        students = studentProfiles || [];
    }

    // Get parent profile
    const { data: parentProfile, error: parentProfileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', parentId)
        .single();

    if (parentProfileError) {
        throw parentProfileError;
    }

    // Map invoices to InvoiceType[]
    return invoices.map(invoice => ({
        invoice_id: invoice.invoice_id,
        student: {
            student_id: invoice.student_id,
            first_name: students.find(student => student.student_id === invoice.student_id)?.first_name ?? "",
            last_name: students.find(student => student.student_id === invoice.student_id)?.last_name ?? ""
        },
        parent: {
            parent_id: parentProfile?.id ?? "",
            first_name: parentProfile?.first_name ?? "",
            last_name: parentProfile?.last_name ?? ""
        },
        invoice_type: invoice.invoice_type,
        amount: invoice.amount,
        currency: invoice.currency,
        description: invoice.description,
        due_date: invoice.due_date,
        status: invoice.status,
        paid_at: invoice.paid_at,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at
    }));
}

export async function getInvoicesByParentStudents(parentId: string): Promise<InvoiceType[] | null> {
    const supabase = createClient();

    // First, get all students associated with this parent
    const { data: parentStudents, error: parentStudentsError } = await supabase
        .from('parent_students')
        .select('student_id')
        .eq('parent_id', parentId);

    if (parentStudentsError) {
        throw parentStudentsError;
    }

    if (!parentStudents || parentStudents.length === 0) {
        return null;
    }

    const studentIds = parentStudents.map(ps => ps.student_id);

    // Get all invoices for these students
    const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .in('student_id', studentIds);

    if (invoiceError) {
        throw invoiceError;
    }

    if (!invoices || invoices.length === 0) {
        return null;
    }

    // Get student profiles
    const { data: studentProfiles, error: studentError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', studentIds);

    if (studentError) {
        throw studentError;
    }

    // Get parent profile
    const { data: parentProfile, error: parentProfileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', parentId)
        .single();

    if (parentProfileError) {
        throw parentProfileError;
    }

    // Map invoices to InvoiceType[]
    return invoices.map(invoice => ({
        invoice_id: invoice.invoice_id,
        student: {
            student_id: invoice.student_id,
            first_name: studentProfiles?.find(student => student.id === invoice.student_id)?.first_name ?? "",
            last_name: studentProfiles?.find(student => student.id === invoice.student_id)?.last_name ?? ""
        },
        parent: {
            parent_id: parentProfile?.id ?? "",
            first_name: parentProfile?.first_name ?? "",
            last_name: parentProfile?.last_name ?? ""
        },
        invoice_type: invoice.invoice_type,
        amount: invoice.amount,
        currency: invoice.currency,
        description: invoice.description,
        due_date: invoice.due_date,
        status: invoice.status,
        paid_at: invoice.paid_at,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at
    }));
}