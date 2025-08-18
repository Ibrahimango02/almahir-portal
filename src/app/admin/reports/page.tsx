"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getAllSessionHistoryForReports } from "@/lib/get/get-session-history"
import { format, parseISO } from "date-fns"
import { X, BookOpen, Search } from "lucide-react"
import Link from "next/link"

type SessionReportType = {
    session_id: string;
    class_id: string;
    title: string;
    subject: string;
    start_date: string;
    end_date: string;
    actual_start_time: string | null;
    actual_end_time: string | null;
    status: string;
    teacher_names: string[];
    student_names: string[];
    attendance_status: string;
    notes: string | null;
    session_summary: string | null;
};

export default function AdminReportsPage() {
    const [sessions, setSessions] = useState<SessionReportType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [teacherFilter, setTeacherFilter] = useState("")
    const [studentFilter, setStudentFilter] = useState("")
    const [classFilter, setClassFilter] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const sessionsData = await getAllSessionHistoryForReports()
                setSessions(sessionsData)
            } catch (err) {
                console.error('Error fetching session history:', err)
                setError('Failed to load session history')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const clearFilters = () => {
        setSearch("")
        setTeacherFilter("")
        setStudentFilter("")
        setClassFilter("")
    }



    // Filtered data based on search and date range
    const filteredSessions = sessions.filter(session => {
        const teacherNames = session.teacher_names.join(', ').toLowerCase()
        const studentNames = session.student_names.join(', ').toLowerCase()
        const className = session.title.toLowerCase()
        const subject = session.subject.toLowerCase()
        const sessionSummary = (session.session_summary || '').toLowerCase()

        // Text search filter
        const matchesSearch = search === "" || (
            teacherNames.includes(search.toLowerCase()) ||
            studentNames.includes(search.toLowerCase()) ||
            className.includes(search.toLowerCase()) ||
            subject.includes(search.toLowerCase()) ||
            sessionSummary.includes(search.toLowerCase())
        )

        // Teacher filter
        const matchesTeacher = teacherFilter === "" ||
            teacherNames.includes(teacherFilter.toLowerCase())

        // Student filter
        const matchesStudent = studentFilter === "" ||
            studentNames.includes(studentFilter.toLowerCase())

        // Class filter
        const matchesClass = classFilter === "" ||
            className.includes(classFilter.toLowerCase())

        return matchesSearch && matchesTeacher && matchesStudent && matchesClass
    })

    if (loading) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Session Reports</h1>
                        <p className="text-muted-foreground">
                            View complete session history and analytics
                        </p>
                    </div>
                </div>
                <div className="h-96 bg-muted animate-pulse rounded-lg" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Session Reports</h1>
                        <p className="text-muted-foreground">
                            View complete session history and analytics
                        </p>
                    </div>
                </div>
                <Card className="mt-6">
                    <CardContent className="pt-6">
                        <div className="text-center text-red-600">
                            <p>{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                            >
                                Retry
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Session Reports</h1>
                    <p className="text-muted-foreground">
                        View complete session history and analytics
                    </p>
                </div>
            </div>



            {/* Filters Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* General Search */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Search All</label>
                            <Input
                                type="text"
                                placeholder="Search sessions..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Teacher Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Teacher</label>
                            <Input
                                type="text"
                                placeholder="Filter by teacher..."
                                value={teacherFilter}
                                onChange={e => setTeacherFilter(e.target.value)}
                            />
                        </div>

                        {/* Student Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Student</label>
                            <Input
                                type="text"
                                placeholder="Filter by student..."
                                value={studentFilter}
                                onChange={e => setStudentFilter(e.target.value)}
                            />
                        </div>

                        {/* Class Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Class</label>
                            <Input
                                type="text"
                                placeholder="Filter by class..."
                                value={classFilter}
                                onChange={e => setClassFilter(e.target.value)}
                            />
                        </div>


                    </div>

                    {/* Clear Filters Button */}
                    {(search || teacherFilter || studentFilter || classFilter) && (
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className="flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Sessions Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Session History
                        <span className="text-sm text-muted-foreground">
                            ({filteredSessions.length} sessions)
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredSessions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No sessions found</p>
                            <p className="text-sm">
                                {search || teacherFilter || studentFilter || classFilter
                                    ? "Try adjusting your filters"
                                    : "Session history will appear here once sessions are completed"
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Teachers</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Students</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Session Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Time</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">End Time</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Session Summary</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredSessions.map((session) => (
                                        <tr
                                            key={session.session_id}
                                            className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                                        >
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <Link
                                                    href={`/admin/classes/${session.class_id}/${session.session_id}`}
                                                    className="block"
                                                >
                                                    <div className="text-sm font-medium text-gray-900 hover:text-primary transition-colors">
                                                        {session.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{session.subject}</div>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                {session.teacher_names.join(', ')}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                <div className="max-w-xs">
                                                    {session.student_names.slice(0, 2).join(', ')}
                                                    {session.student_names.length > 2 && (
                                                        <span className="text-xs text-gray-500">
                                                            +{session.student_names.length - 2} more
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                {format(parseISO(session.start_date), "MMM d, yyyy")}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                <div>
                                                    {format(parseISO(session.start_date), "hh:mm a")}
                                                    {session.actual_start_time && (
                                                        <div className="text-xs text-gray-500">
                                                            (actual: {format(parseISO(session.actual_start_time), "hh:mm a")})
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                <div>
                                                    {format(parseISO(session.end_date), "hh:mm a")}
                                                    {session.actual_end_time && (
                                                        <div className="text-xs text-gray-500">
                                                            (actual: {format(parseISO(session.actual_end_time), "hh:mm a")})
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                {session.session_summary ? (
                                                    <span title={session.session_summary}>
                                                        {session.session_summary.length > 50
                                                            ? session.session_summary.slice(0, 50) + "..."
                                                            : session.session_summary}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">No summary available</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
