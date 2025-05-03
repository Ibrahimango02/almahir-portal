import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getTeachers, getTeachersCount, getTeacherById } from '@/lib/get-teachers'
import { getParents } from '@/lib/get-parents'
import { getStudents, getStudentsCount } from '@/lib/get-students'
import { getClasses, getClassesToday, getWeeklyClassesCount, getClassBySessionId, getClassesByTeacherId } from '@/lib/get-classes'

export default async function PrivatePage() {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
        redirect('/login')
    }

    const { data: name } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', data.user.id)
        .single();

    const { data: role } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

    const firstname = await name?.first_name
    const lastname = await name?.last_name
    const user_role = await role?.role

    console.log(firstname, user_role)

    const teachers = await getTeachers()
    const teacher = await getTeacherById('eb85a255-1c83-4e65-93f0-1e57364b7c3c')
    const parents = await getParents()
    const students = await getStudents()
    const studentsCount = await getStudentsCount()
    const teachersCount = await getTeachersCount()
    const classes = await getClasses()
    const todayClasses = await getClassesToday()
    const weeklyClassesCount = await getWeeklyClassesCount()
    const classBySessionId = await getClassBySessionId('c24adafd-661f-4cde-a2d9-0bf5e91a0d50')
    const classesByTeacherId = await getClassesByTeacherId('eb85a255-1c83-4e65-93f0-1e57364b7c3c')

    //console.log(parentss)
    //console.log(tteachers)
    //console.log(students)
    //console.log(classes)
    //console.log("todayClasses", todayClasses)
    //console.log(studentsCount)
    //console.log(teachersCount)
    //console.log(weeklyClassesCount)
    //console.log("classBySessionId", classBySessionId)
    //console.log("teacher", teacher)
    console.log("classesByTeacherId", classesByTeacherId)

    return <p>Hello {firstname} {lastname} you are a {user_role}</p>
}