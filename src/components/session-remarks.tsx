"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save, FileText, Star, Edit, Eye, BookOpen } from "lucide-react"
import { SessionRemarksType, StudentSessionNotesType } from "@/types"
import {
    createSessionRemarksAction,
    updateSessionRemarksAction,
    getSessionRemarksAction,
    upsertStudentSessionNotesAction,
    getStudentSessionNotesAction
} from "@/lib/actions/session-remarks-actions"

interface SessionRemarksProps {
    sessionId: string
    sessionStatus: string
    students: Array<{
        student_id: string
        first_name: string
        last_name: string
        avatar_url?: string | null
    }>
    userRole: 'admin' | 'teacher' | 'parent' | 'student'
}

interface StudentNote {
    student_id: string
    notes: string
    performance_rating: number | null
    participation_level: number | null
}

export function SessionRemarks({ sessionId, sessionStatus, students, userRole }: SessionRemarksProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [sessionRemarks, setSessionRemarks] = useState("")
    const [studentNotes, setStudentNotes] = useState<StudentNote[]>([])
    const [existingRemarks, setExistingRemarks] = useState<SessionRemarksType | null>(null)
    const [existingNotes, setExistingNotes] = useState<StudentSessionNotesType[]>([])

    // Check if user can edit (only teachers and admins when session is running)
    const canEdit = (userRole === 'teacher' || userRole === 'admin') && sessionStatus === 'running'

    // Initialize student notes and load existing data
    useEffect(() => {
        const initializeAndLoadData = async () => {
            setLoading(true)
            try {
                // Initialize student notes first
                const initialNotes: StudentNote[] = students.map(student => ({
                    student_id: student.student_id,
                    notes: "",
                    performance_rating: null,
                    participation_level: null
                }))
                setStudentNotes(initialNotes)

                // Load session remarks
                const remarks = await getSessionRemarksAction(sessionId)
                if (remarks) {
                    setExistingRemarks(remarks)
                    setSessionRemarks(remarks.session_summary)
                }

                // Load student notes
                const notes = await getStudentSessionNotesAction(sessionId)
                if (notes && notes.length > 0) {
                    setExistingNotes(notes)

                    // Update student notes with existing data
                    const updatedNotes = initialNotes.map(note => {
                        const existingNote = notes.find((n: StudentSessionNotesType) => n.student_id === note.student_id)
                        if (existingNote) {
                            // Convert string participation_level to number if needed
                            let participationLevel: number | null = null
                            if (existingNote.participation_level) {
                                if (typeof existingNote.participation_level === 'string') {
                                    // Handle legacy string values
                                    switch (existingNote.participation_level) {
                                        case 'excellent': participationLevel = 5; break
                                        case 'good': participationLevel = 4; break
                                        case 'average': participationLevel = 3; break
                                        case 'poor': participationLevel = 2; break
                                        case 'absent': participationLevel = 1; break
                                        default: participationLevel = null
                                    }
                                } else {
                                    participationLevel = existingNote.participation_level
                                }
                            }

                            return {
                                ...note,
                                notes: existingNote.notes || "",
                                performance_rating: existingNote.performance_rating,
                                participation_level: participationLevel
                            }
                        }
                        return note
                    })
                    setStudentNotes(updatedNotes)
                }
            } catch (error) {
                console.error('Error loading existing data:', error)
                toast({
                    title: "Error",
                    description: "Failed to load existing session data",
                    variant: "destructive"
                })
            } finally {
                setLoading(false)
            }
        }

        initializeAndLoadData()
    }, [sessionId, students, toast])

    const updateStudentNote = (studentId: string, field: keyof StudentNote, value: string | number | null) => {
        setStudentNotes(prev =>
            prev.map(note =>
                note.student_id === studentId
                    ? { ...note, [field]: value }
                    : note
            )
        )
    }

    const handleSave = async () => {
        if (!sessionRemarks.trim()) {
            toast({
                title: "Session Summary Required",
                description: "Please provide a summary of the session",
                variant: "destructive"
            })
            return
        }

        setSaving(true)
        try {
            // Save session remarks
            const remarksResult = existingRemarks
                ? await updateSessionRemarksAction({ session_id: sessionId, session_summary: sessionRemarks })
                : await createSessionRemarksAction({ session_id: sessionId, session_summary: sessionRemarks })

            if (!remarksResult.success) {
                throw new Error(remarksResult.error?.message || 'Failed to save session remarks')
            }

            // Save student notes
            const results = []
            const errors = []

            for (const note of studentNotes) {
                const result = await upsertStudentSessionNotesAction({
                    session_id: sessionId,
                    student_id: note.student_id,
                    notes: note.notes,
                    performance_rating: note.performance_rating || undefined,
                    participation_level: note.participation_level || undefined
                })

                if (result.success) {
                    results.push(result.data)
                } else {
                    errors.push(result.error?.message || 'Failed to save student note')
                }
            }

            if (errors.length > 0) {
                toast({
                    title: "Partial Success",
                    description: "Some notes were saved, but some failed. Please check the details.",
                    variant: "destructive"
                })
            } else {
                toast({
                    title: "Success",
                    description: "Session remarks and student notes saved successfully",
                })
                setIsEditing(false)

                // Update existing data
                if (remarksResult.data) {
                    setExistingRemarks(remarksResult.data)
                }
                setExistingNotes(results.filter((result): result is StudentSessionNotesType => result !== undefined))
            }
        } catch (error) {
            console.error('Error saving session data:', error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save session data",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const getPerformanceRatingDisplay = (rating: number | null) => {
        if (!rating) return null

        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${star <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200'
                            }`}
                    />
                ))}
            </div>
        )
    }

    const getParticipationBadge = (level: number | null) => {
        if (!level) return null

        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${star <= level
                            ? 'fill-blue-400 text-blue-400'
                            : 'text-gray-200'
                            }`}
                    />
                ))}
            </div>
        )
    }

    if (loading) {
        return (
            <Card className="border-0 shadow-sm">
                <CardContent className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-muted-foreground">Loading session data...</span>
                </CardContent>
            </Card>
        )
    }

    const hasData = existingRemarks || existingNotes.length > 0

    return (
        <div className="space-y-8">
            {/* Header with Edit/View toggle */}
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold">Session Remarks & Notes</h3>
                        <p className="text-sm text-muted-foreground">Track session progress and student performance</p>
                    </div>
                </div>
                {canEdit && (
                    <Button
                        variant="outline"
                        onClick={() => setIsEditing(!isEditing)}
                        disabled={saving}
                        className="gap-2"
                    >
                        {isEditing ? (
                            <>
                                <Eye className="h-4 w-4" />
                                View
                            </>
                        ) : (
                            <>
                                <Edit className="h-4 w-4" />
                                Edit
                            </>
                        )}
                    </Button>
                )}
            </div>

            {!hasData && !isEditing ? (
                <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/30">
                    <CardContent className="flex items-center justify-center p-12 text-center">
                        <div className="space-y-4 max-w-sm">
                            <div className="p-3 bg-muted rounded-full w-fit mx-auto">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-base font-medium text-muted-foreground">No session remarks or student notes available</p>
                                {canEdit && (
                                    <p className="text-sm text-muted-foreground/80">Click &quot;Edit&quot; to add session remarks and individual student notes</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : isEditing && canEdit ? (
                // Edit Mode
                <div className="space-y-8">
                    {/* Session Remarks Section */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-lg">
                                <div>
                                    Session Summary
                                    {existingRemarks && (
                                        <span className="block text-sm font-normal text-muted-foreground">Already saved</span>
                                    )}
                                </div>
                            </CardTitle>
                            <CardDescription className="text-base">
                                Provide a comprehensive summary of what was covered in this session. This is required.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="session-remarks" className="text-sm font-medium">Session Summary *</Label>
                                    <Textarea
                                        id="session-remarks"
                                        placeholder="Describe what was covered in this session, key topics discussed, and any important points..."
                                        value={sessionRemarks}
                                        onChange={(e) => setSessionRemarks(e.target.value)}
                                        className="min-h-[140px] mt-2 resize-none"
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Student Notes Section */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-lg">
                                Individual Student Notes
                            </CardTitle>
                            <CardDescription className="text-base">
                                Add detailed notes for each student about their performance and participation in this session.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {students.map((student) => {
                                    const studentNote = studentNotes.find(note => note.student_id === student.student_id)

                                    return (
                                        <div key={student.student_id} className="border border-border/50 rounded-xl p-6 space-y-6 bg-card/50">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12 ring-2 ring-border/20">
                                                    {student.avatar_url && (
                                                        <AvatarImage src={student.avatar_url} alt={student.first_name} />
                                                    )}
                                                    <AvatarFallback className="text-sm font-medium">
                                                        {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-base">
                                                        {student.first_name} {student.last_name}
                                                    </h4>
                                                </div>
                                            </div>

                                            <div className="grid gap-6 md:grid-cols-2">
                                                <div className="space-y-3">
                                                    <Label htmlFor={`notes-${student.student_id}`} className="text-sm font-medium">Notes</Label>
                                                    <Textarea
                                                        id={`notes-${student.student_id}`}
                                                        placeholder="Add notes about this student's performance, participation, or any concerns..."
                                                        value={studentNote?.notes || ""}
                                                        onChange={(e) => updateStudentNote(student.student_id, 'notes', e.target.value)}
                                                        className="min-h-[100px] resize-none"
                                                    />
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="space-y-3">
                                                        <Label htmlFor={`performance-${student.student_id}`} className="text-sm font-medium">Performance Rating</Label>
                                                        <Select
                                                            value={studentNote?.performance_rating?.toString() || ""}
                                                            onValueChange={(value) => updateStudentNote(student.student_id, 'performance_rating', value ? parseInt(value) : null)}
                                                        >
                                                            <SelectTrigger className="h-10">
                                                                <SelectValue placeholder="Select rating" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="1">1 - Poor</SelectItem>
                                                                <SelectItem value="2">2 - Below Average</SelectItem>
                                                                <SelectItem value="3">3 - Average</SelectItem>
                                                                <SelectItem value="4">4 - Good</SelectItem>
                                                                <SelectItem value="5">5 - Excellent</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label htmlFor={`participation-${student.student_id}`} className="text-sm font-medium">Participation Level</Label>
                                                        <Select
                                                            value={studentNote?.participation_level?.toString() || ""}
                                                            onValueChange={(value) => updateStudentNote(student.student_id, 'participation_level', value ? parseInt(value) : null)}
                                                        >
                                                            <SelectTrigger className="h-10">
                                                                <SelectValue placeholder="Select level" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="1">1 - Poor</SelectItem>
                                                                <SelectItem value="2">2 - Below Average</SelectItem>
                                                                <SelectItem value="3">3 - Average</SelectItem>
                                                                <SelectItem value="4">4 - Good</SelectItem>
                                                                <SelectItem value="5">5 - Excellent</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                            disabled={saving}
                            className="px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving || !sessionRemarks.trim()}
                            className="min-w-[140px] px-6"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save All
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            ) : (
                // View Mode
                <div className="space-y-8">
                    {/* Session Remarks */}
                    {existingRemarks && (
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-3 text-lg">
                                    Session Summary
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Overview of what was covered in this session
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm max-w-none">
                                    <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary/20">
                                        <p className="whitespace-pre-wrap text-base leading-relaxed">{existingRemarks.session_summary}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Student Notes */}
                    {existingNotes.length > 0 && (
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-3 text-lg">
                                    Student Notes
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Individual student performance and participation notes
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-5">
                                    {existingNotes.map((note) => {
                                        const student = students.find(s => s.student_id === note.student_id)
                                        if (!student) return null

                                        return (
                                            <div key={note.id} className="border border-border/50 rounded-xl p-6 space-y-5 bg-card/50">
                                                <div className="flex items-start gap-4">
                                                    <Avatar className="h-12 w-12 ring-2 ring-border/20 flex-shrink-0">
                                                        {student.avatar_url && (
                                                            <AvatarImage src={student.avatar_url} alt={student.first_name} />
                                                        )}
                                                        <AvatarFallback className="text-sm font-medium">
                                                            {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-base mb-2">
                                                            {student.first_name} {student.last_name}
                                                        </h4>
                                                        <div className="flex flex-wrap items-center gap-4">
                                                            {note.performance_rating && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-medium text-muted-foreground">Performance:</span>
                                                                    {getPerformanceRatingDisplay(note.performance_rating)}
                                                                </div>
                                                            )}
                                                            {note.participation_level && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-medium text-muted-foreground">Participation:</span>
                                                                    {getParticipationBadge(note.participation_level)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {note.notes && (
                                                    <div className="pl-16">
                                                        <div className="p-4 bg-muted/30 rounded-lg border-l-3 border-primary/20">
                                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                                                {note.notes}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    )
} 