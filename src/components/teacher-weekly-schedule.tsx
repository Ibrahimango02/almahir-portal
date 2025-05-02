import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"

type TeacherWeeklyScheduleProps = {
  filter?: "morning" | "afternoon" | "evening"
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const timeSlots = [
  { time: "08:00", period: "morning" },
  { time: "09:30", period: "morning" },
  { time: "11:00", period: "morning" },
  { time: "13:00", period: "afternoon" },
  { time: "14:30", period: "afternoon" },
  { time: "16:00", period: "afternoon" },
  { time: "17:30", period: "evening" },
  { time: "19:00", period: "evening" },
]

// Mock data based on the database schema
const classes = [
  {
    id: 1,
    title: "Mathematics 101",
    description: "Introduction to algebra and geometry",
    subject: "Mathematics",
    start_time: "2023-04-17T08:00:00",
    end_time: "2023-04-17T09:30:00",
    status: "scheduled",
    max_students: 15,
    class_link: "https://meet.google.com/abc-defg-hij",
    students: ["Ahmed Ali", "Fatima Khan", "Zainab Hussein", "Omar Farooq"],
  },
  {
    id: 2,
    title: "Physics Fundamentals",
    description: "Basic principles of physics",
    subject: "Physics",
    start_time: "2023-04-17T11:00:00",
    end_time: "2023-04-17T12:30:00",
    status: "scheduled",
    max_students: 12,
    class_link: "https://meet.google.com/jkl-mnop-qrs",
    students: ["Layla Mohammed", "Ibrahim Yusuf", "Aisha Mahmoud", "Yousef Ahmed"],
  },
  {
    id: 3,
    title: "English Literature",
    description: "Analysis of classic literature",
    subject: "English",
    start_time: "2023-04-17T14:30:00",
    end_time: "2023-04-17T16:00:00",
    status: "scheduled",
    max_students: 20,
    class_link: "https://meet.google.com/tuv-wxyz-123",
    students: ["Noor Abdullah", "Khalid Rahman", "Mariam Saleh", "Hassan Malik"],
  },
  {
    id: 4,
    title: "Chemistry Basics",
    description: "Introduction to chemical principles",
    subject: "Chemistry",
    start_time: "2023-04-17T17:30:00",
    end_time: "2023-04-17T19:00:00",
    status: "scheduled",
    max_students: 15,
    class_link: "https://meet.google.com/456-789-abc",
    students: ["Ahmed Ali", "Fatima Khan", "Zainab Hussein", "Omar Farooq"],
  },
  {
    id: 5,
    title: "Biology 101",
    description: "Introduction to biological concepts",
    subject: "Biology",
    start_time: "2023-04-18T09:30:00",
    end_time: "2023-04-18T11:00:00",
    status: "scheduled",
    max_students: 18,
    class_link: "https://meet.google.com/def-ghi-jkl",
    students: ["Layla Mohammed", "Ibrahim Yusuf", "Aisha Mahmoud", "Yousef Ahmed"],
  },
  {
    id: 6,
    title: "World History",
    description: "Overview of major historical events",
    subject: "History",
    start_time: "2023-04-18T13:00:00",
    end_time: "2023-04-18T14:30:00",
    status: "scheduled",
    max_students: 25,
    class_link: "https://meet.google.com/mno-pqr-stu",
    students: ["Noor Abdullah", "Khalid Rahman", "Mariam Saleh", "Hassan Malik"],
  },
  {
    id: 7,
    title: "Computer Science",
    description: "Introduction to programming concepts",
    subject: "Computer Science",
    start_time: "2023-04-18T16:00:00",
    end_time: "2023-04-18T17:30:00",
    status: "scheduled",
    max_students: 15,
    class_link: "https://meet.google.com/vwx-yza-bcd",
    students: ["Ahmed Ali", "Fatima Khan", "Zainab Hussein", "Omar Farooq"],
  },
  {
    id: 8,
    title: "Art Appreciation",
    description: "Exploring various art forms and techniques",
    subject: "Art",
    start_time: "2023-04-18T19:00:00",
    end_time: "2023-04-18T20:30:00",
    status: "scheduled",
    max_students: 20,
    class_link: "https://meet.google.com/efg-hij-klm",
    students: ["Layla Mohammed", "Ibrahim Yusuf", "Aisha Mahmoud", "Yousef Ahmed"],
  },
  {
    id: 9,
    title: "Geography",
    description: "Study of Earth's landscapes and regions",
    subject: "Geography",
    start_time: "2023-04-19T08:00:00",
    end_time: "2023-04-19T09:30:00",
    status: "scheduled",
    max_students: 22,
    class_link: "https://meet.google.com/nop-qrs-tuv",
    students: ["Noor Abdullah", "Khalid Rahman", "Mariam Saleh", "Hassan Malik"],
  },
  {
    id: 10,
    title: "Music Theory",
    description: "Understanding musical concepts and notation",
    subject: "Music",
    start_time: "2023-04-19T11:00:00",
    end_time: "2023-04-19T12:30:00",
    status: "scheduled",
    max_students: 15,
    class_link: "https://meet.google.com/wxy-zab-cde",
    students: ["Ahmed Ali", "Fatima Khan", "Zainab Hussein", "Omar Farooq"],
  },
]

export function TeacherWeeklySchedule({ filter }: TeacherWeeklyScheduleProps) {
  const filteredTimeSlots = filter ? timeSlots.filter((slot) => slot.period === filter) : timeSlots

  // Helper function to get day name from date
  const getDayName = (dateString: string) => {
    const date = new Date(dateString)
    return days[date.getDay() === 0 ? 6 : date.getDay() - 1] // Adjust for Sunday
  }

  // Helper function to get time from datetime
  const getTimeFromDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-8 border-b">
        <div className="p-3 border-r bg-muted/50 font-medium text-sm">Time</div>
        {days.map((day) => (
          <div key={day} className="p-3 border-r last:border-r-0 bg-muted/50 font-medium text-sm text-center">
            {day}
          </div>
        ))}
      </div>

      {filteredTimeSlots.map((slot, index) => (
        <div key={slot.time} className={cn("grid grid-cols-8", index !== filteredTimeSlots.length - 1 && "border-b")}>
          <div className="p-3 border-r bg-muted/20 text-sm flex items-center">{slot.time}</div>

          {days.map((day) => {
            // Find classes that start at this time slot on this day
            const classItem = classes.find((c) => {
              const classDay = getDayName(c.start_time)
              const classTime = getTimeFromDateTime(c.start_time)
              return classDay === day && classTime === slot.time
            })

            return (
              <div key={`${day}-${slot.time}`} className="p-3 border-r last:border-r-0 text-sm min-h-[80px]">
                {classItem ? (
                  <div className="h-full rounded-md border border-primary/20 bg-primary/5 p-2 flex flex-col justify-between">
                    <div>
                      <p className="font-medium">{classItem.title}</p>
                      <p className="text-xs text-muted-foreground">{classItem.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(parseISO(classItem.start_time), "h:mm a")} -{" "}
                        {format(parseISO(classItem.end_time), "h:mm a")}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="outline" className="text-xs">
                        {classItem.students.length} students
                      </Badge>
                      <Badge variant={classItem.status === "scheduled" ? "default" : "outline"} className="text-xs">
                        {classItem.status}
                      </Badge>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
