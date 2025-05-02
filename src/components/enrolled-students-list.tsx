import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

type EnrolledStudentsListProps = {
  students: {
    id: number
    first_name: string
    last_name: string
  }[]
}

export function EnrolledStudentsList({ students }: EnrolledStudentsListProps) {
  // Function to get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <Table className="border rounded-md">
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell className="flex items-center gap-2 py-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {getInitials(student.first_name, student.last_name)}
                </AvatarFallback>
              </Avatar>
              <Link
                href={`/admin/students/${student.id}`}
                className="hover:underline text-primary inline-block text-sm"
              >
                {student.first_name} {student.last_name}
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
