"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { StudentType } from '@/types'
import { getParentStudents } from '@/lib/get/get-parents'
import { createClient } from '@/utils/supabase/client'

interface StudentSwitcherContextType {
  selectedStudent: StudentType | null
  setSelectedStudent: (student: StudentType | null) => void
  parentStudents: StudentType[]
  isLoading: boolean
  isParentView: boolean
  switchToParentView: () => void
  switchToStudentView: (student: StudentType) => void
}

const StudentSwitcherContext = createContext<StudentSwitcherContextType | undefined>(undefined)

export function StudentSwitcherProvider({ children }: { children: ReactNode }) {
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null)
  const [parentStudents, setParentStudents] = useState<StudentType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchParentStudents = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const students = await getParentStudents(user.id)
          setParentStudents(students)
        }
      } catch (error) {
        console.error('Failed to fetch parent students:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchParentStudents()
  }, [])

  const switchToParentView = () => {
    setSelectedStudent(null)
  }

  const switchToStudentView = (student: StudentType) => {
    setSelectedStudent(student)
  }

  const value: StudentSwitcherContextType = {
    selectedStudent,
    setSelectedStudent,
    parentStudents,
    isLoading,
    isParentView: selectedStudent === null,
    switchToParentView,
    switchToStudentView,
  }

  return (
    <StudentSwitcherContext.Provider value={value}>
      {children}
    </StudentSwitcherContext.Provider>
  )
}

export function useStudentSwitcher() {
  const context = useContext(StudentSwitcherContext)
  if (context === undefined) {
    throw new Error('useStudentSwitcher must be used within a StudentSwitcherProvider')
  }
  return context
} 