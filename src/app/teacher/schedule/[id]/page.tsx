import { ClassDetails } from "@/components/class-details"
import { notFound } from "next/navigation"
import { BackButton } from "@/components/back-button"

// Mock data based on the database schema
const classes = [
  {
    id: 1,
    teacher_id: 1,
    title: "Mathematics 101",
    description:
      "Introduction to algebra and geometry. This course covers fundamental concepts in algebra including equations, inequalities, and functions, as well as basic geometric principles such as points, lines, angles, and polygons. Students will learn problem-solving techniques and develop critical thinking skills through mathematical reasoning.",
    subject: "Mathematics",
    start_time: "2023-04-17T08:00:00",
    end_time: "2023-04-17T09:30:00",
    status: "scheduled",
    max_students: 15,
    class_link: "https://meet.google.com/abc-defg-hij",
    teacher: { id: 1, first_name: "Sarah", last_name: "Johnson" },
    enrolled_students: [
      { id: 1, first_name: "John", last_name: "Doe" },
      { id: 2, first_name: "Jane", last_name: "Smith" },
      { id: 3, first_name: "Alex", last_name: "Johnson" },
    ],
    // Sample attendance data
    attendance: {
      1: true, // John Doe is present
      2: false, // Jane Smith is absent
      // Alex Johnson's attendance not recorded yet
    },
  },
  {
    id: 2,
    teacher_id: 2,
    title: "Physics Fundamentals",
    description:
      "Basic principles of physics including mechanics, energy, and motion. Students will explore Newton's laws, conservation of energy, and simple machines. The course includes both theoretical concepts and practical applications through demonstrations and problem-solving exercises.",
    subject: "Physics",
    start_time: "2023-04-17T11:00:00",
    end_time: "2023-04-17T12:30:00",
    status: "pending",
    max_students: 12,
    class_link: "https://meet.google.com/jkl-mnop-qrs",
    teacher: { id: 2, first_name: "Michael", last_name: "Chen" },
    enrolled_students: [
      { id: 4, first_name: "Emily", last_name: "Wilson" },
      { id: 5, first_name: "David", last_name: "Brown" },
      { id: 6, first_name: "Sophia", last_name: "Garcia" },
      { id: 7, first_name: "James", last_name: "Miller" },
    ],
    // No attendance data yet
  },
  {
    id: 3,
    teacher_id: 3,
    title: "English Literature",
    description:
      "Analysis of classic literature from various periods and genres. Students will read and discuss works by Shakespeare, Austen, Dickens, and other influential authors. The course focuses on literary analysis, critical thinking, and effective written and verbal communication.",
    subject: "English",
    start_time: "2023-04-17T14:30:00",
    end_time: "2023-04-17T16:00:00",
    status: "running",
    max_students: 20,
    class_link: "https://meet.google.com/tuv-wxyz-123",
    teacher: { id: 3, first_name: "Emily", last_name: "Davis" },
    enrolled_students: [
      { id: 8, first_name: "Olivia", last_name: "Martinez" },
      { id: 9, first_name: "Ethan", last_name: "Taylor" },
      { id: 10, first_name: "Ava", last_name: "Anderson" },
    ],
    // All students present
    attendance: {
      8: true,
      9: true,
      10: true,
    },
  },
  {
    id: 4,
    teacher_id: 4,
    title: "History of Civilizations",
    description:
      "Exploration of major world civilizations and their contributions to human history. Students will study ancient Egypt, Greece, Rome, China, and other significant cultures, examining their political systems, social structures, technological innovations, and cultural achievements.",
    subject: "History",
    start_time: "2023-04-17T09:00:00",
    end_time: "2023-04-17T10:30:00",
    status: "completed",
    max_students: 18,
    class_link: "https://meet.google.com/abc-defg-hij",
    teacher: { id: 4, first_name: "Robert", last_name: "Williams" },
    enrolled_students: [
      { id: 11, first_name: "Noah", last_name: "Thompson" },
      { id: 12, first_name: "Isabella", last_name: "Clark" },
      { id: 13, first_name: "Mason", last_name: "Rodriguez" },
    ],
    // All students present
    attendance: {
      11: true,
      12: true,
      13: true,
    },
  },
  {
    id: 5,
    teacher_id: 5,
    title: "Chemistry Basics",
    description:
      "Introduction to fundamental chemical principles and laboratory techniques. Students will learn about atomic structure, the periodic table, chemical bonding, reactions, and stoichiometry. The course includes both theoretical concepts and hands-on laboratory experiments.",
    subject: "Chemistry",
    start_time: "2023-04-17T13:00:00",
    end_time: "2023-04-17T14:30:00",
    status: "rescheduled",
    max_students: 15,
    class_link: "https://meet.google.com/jkl-mnop-qrs",
    teacher: { id: 5, first_name: "Jennifer", last_name: "Lopez" },
    enrolled_students: [
      { id: 14, first_name: "Liam", last_name: "White" },
      { id: 15, first_name: "Sophia", last_name: "Harris" },
      { id: 16, first_name: "Benjamin", last_name: "Martin" },
    ],
    // No attendance data yet
  },
  {
    id: 6,
    teacher_id: 6,
    title: "Computer Science Fundamentals",
    description:
      "Introduction to programming concepts and computational thinking. Students will learn basic programming principles using Python, including variables, data types, control structures, functions, and simple algorithms. The course emphasizes problem-solving and logical reasoning.",
    subject: "Computer Science",
    start_time: "2023-04-17T15:30:00",
    end_time: "2023-04-17T17:00:00",
    status: "cancelled",
    max_students: 20,
    class_link: "https://meet.google.com/tuv-wxyz-123",
    teacher: { id: 6, first_name: "Daniel", last_name: "Brown" },
    enrolled_students: [
      { id: 17, first_name: "Emma", last_name: "Jackson" },
      { id: 18, first_name: "Lucas", last_name: "Lee" },
      { id: 19, first_name: "Mia", last_name: "Perez" },
    ],
    // No attendance data
  },
  // More classes...
]

export default function ClassPage({ params }: { params: { id: string } }) {
  const classId = Number.parseInt(params.id)

  // Find the class with the matching ID
  const classData = classes.find((c) => c.id === classId)

  // If class not found, show 404 page
  if (!classData) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton href="/teacher/schedule" label="Back to Schedule" />
      </div>

      <ClassDetails classData={classData} />
    </div>
  )
}
