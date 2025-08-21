"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save, X } from "lucide-react"
import { SessionRemarksType, StudentSessionNotesType } from "@/types"
import {
    createSessionRemarksAction,
    updateSessionRemarksAction,
    getSessionRemarksAction,
    upsertStudentSessionNotesAction,
    getStudentSessionNotesAction
} from "@/lib/actions/session-remarks-actions"

interface SessionRemarksFormProps {
    sessionId: string
    students: Array<{
        student_id: string
        first_name: string
        last_name: string
        avatar_url?: string | null
    }>
    onClose: () => void
}

interface StudentNote {
    student_id: string
    notes: string
    performance_rating: number | null
    participation_level: number | null
}



export function SessionRemarksForm({ sessionId, students, onClose }: SessionRemarksFormProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [sessionRemarks, setSessionRemarks] = useState("")
    const [studentNotes, setStudentNotes] = useState<StudentNote[]>([])
    const [existingRemarks, setExistingRemarks] = useState<SessionRemarksType | null>(null)


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
                                        case 'bad': participationLevel = 2; break
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

                // Update existing data
                if (remarksResult.data) {
                    setExistingRemarks(remarksResult.data)
                }

                // Close the dialog after successful save
                onClose()
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

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading session data...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Session Remarks Section */}
            <div className="space-y-4">
                <div>
                    <Label htmlFor="session-remarks" className="text-sm font-medium">Session Summary *</Label>
                    <Textarea
                        id="session-remarks"
                        placeholder="Describe what was covered in this session, key topics discussed, and any important points..."
                        value={sessionRemarks}
                        onChange={(e) => setSessionRemarks(e.target.value)}
                        className="min-h-[120px] mt-2 resize-none break-words"
                        required
                    />
                    {existingRemarks && (
                        <p className="text-xs text-muted-foreground mt-1">Already saved - you can update this</p>
                    )}
                </div>
            </div>

            {/* Student Notes Section */}
            <div className="space-y-4">
                <Label className="text-sm font-medium">Individual Student Notes</Label>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {students.map((student) => {
                        const studentNote = studentNotes.find(note => note.student_id === student.student_id)

                        return (
                            <div key={student.student_id} className="border border-border/50 rounded-xl p-4 space-y-3 bg-card/50">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 ring-2 ring-border/20">
                                        {student.avatar_url && (
                                            <AvatarImage src={student.avatar_url} alt={student.first_name} />
                                        )}
                                        <AvatarFallback className="text-sm font-medium">
                                            {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm">
                                            {student.first_name} {student.last_name}
                                        </h4>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor={`notes-${student.student_id}`} className="text-xs font-medium">Notes</Label>
                                        <Textarea
                                            id={`notes-${student.student_id}`}
                                            placeholder="Add notes about this student's performance, participation, or any concerns..."
                                            value={studentNote?.notes || ""}
                                            onChange={(e) => updateStudentNote(student.student_id, 'notes', e.target.value)}
                                            className="min-h-[70px] resize-none break-words text-xs"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor={`performance-${student.student_id}`} className="text-xs font-medium">Performance Rating</Label>
                                            <Select
                                                value={studentNote?.performance_rating?.toString() || ""}
                                                onValueChange={(value) => updateStudentNote(student.student_id, 'performance_rating', value ? parseInt(value) : null)}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
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

                                        <div className="space-y-2">
                                            <Label htmlFor={`participation-${student.student_id}`} className="text-xs font-medium">Participation Level</Label>
                                            <Select
                                                value={studentNote?.participation_level?.toString() || ""}
                                                onValueChange={(value) => updateStudentNote(student.student_id, 'participation_level', value ? parseInt(value) : null)}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
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
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={saving}
                    className="px-6"
                >
                    <X className="h-4 w-4 mr-2" />
                    Close
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
                            Save & Close
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
} 