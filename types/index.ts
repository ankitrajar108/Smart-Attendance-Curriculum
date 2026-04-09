export interface User {
  id: string
  email: string
  name: string
  role: "STUDENT" | "TEACHER" | "ADMIN"
  studentProfile?: StudentProfile
  teacherProfile?: TeacherProfile
}

export interface StudentProfile {
  id: string
  interests: string[]
  careerGoals: string
  classes: Class[]
}

export interface TeacherProfile {
  id: string
  department: string
  classes: Class[]
}

export interface Class {
  id: string
  courseName: string
  courseCode: string
  teacher: TeacherProfile
  students: StudentProfile[]
}

export interface TimetableSlot {
  id: string
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY"
  startTime: string
  endTime: string
  class: Class
}

export interface AttendanceRecord {
  id: string
  timestamp: Date
  status: "PRESENT" | "ABSENT" | "LATE"
  student: StudentProfile
  timetableSlot: TimetableSlot
}

export interface ActivitySuggestion {
  id: string
  title: string
  description: string
  category: string
  estimatedTime: number
  relevantCourses: string[]
}

export interface PersonalGoal {
  id: string
  title: string
  description: string
  deadline: Date
  student: StudentProfile
}
