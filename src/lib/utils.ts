import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} mins`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return hours === 1 ? `1 hr` : `${hours} hrs`
  }

  return `${hours} hr${hours > 1 ? "s" : ""} ${remainingMinutes} mins`
}

// Calculate age function
export const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0 // Default to 0 instead of null to match StudentType

  // Parse YYYY-MM-DD format
  const [year, month, day] = birthDate.split('-').map(num => parseInt(num, 10))

  const today = new Date()
  const birth = new Date(year, month - 1, day) // Month is 0-indexed in JavaScript Date

  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  // If birth month is after current month or same month but birth day is after today
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
  }

  return age
}