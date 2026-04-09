import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seed...")

  // Clear existing data
  await prisma.attendanceRecord.deleteMany()
  await prisma.personalGoal.deleteMany()
  await prisma.classEnrollment.deleteMany()
  await prisma.timetableSlot.deleteMany()
  await prisma.activitySuggestion.deleteMany()
  await prisma.class.deleteMany()
  await prisma.studentProfile.deleteMany()
  await prisma.teacherProfile.deleteMany()
  await prisma.user.deleteMany()

  const hashedPassword = await bcrypt.hash("password123", 10)

  // Create Admin
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@demo.com",
      passwordHash: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
    },
  })

  // Create Teachers
  const teacher1User = await prisma.user.create({
    data: {
      email: "teacher@demo.com",
      passwordHash: hashedPassword,
      name: "Dr. Smith",
      role: "TEACHER",
      teacherProfile: {
        create: { department: "Computer Science" },
      },
    },
    include: { teacherProfile: true },
  })

  const teacher2User = await prisma.user.create({
    data: {
      email: "teacher2@demo.com",
      passwordHash: hashedPassword,
      name: "Prof. Johnson",
      role: "TEACHER",
      teacherProfile: {
        create: { department: "Mathematics" },
      },
    },
    include: { teacherProfile: true },
  })

  const teacher3User = await prisma.user.create({
    data: {
      email: "teacher3@demo.com",
      passwordHash: hashedPassword,
      name: "Dr. Wilson",
      role: "TEACHER",
      teacherProfile: {
        create: { department: "Physics" },
      },
    },
    include: { teacherProfile: true },
  })

  // Create Students
  const student1User = await prisma.user.create({
    data: {
      email: "student@demo.com",
      passwordHash: hashedPassword,
      name: "Alex Johnson",
      role: "STUDENT",
      studentProfile: {
        create: {
          interests: "Programming,Mathematics,AI",
          careerGoals: "Software Engineer",
        },
      },
    },
    include: { studentProfile: true },
  })

  const student2User = await prisma.user.create({
    data: {
      email: "student2@demo.com",
      passwordHash: hashedPassword,
      name: "Maria Garcia",
      role: "STUDENT",
      studentProfile: {
        create: {
          interests: "Physics,Chemistry,Research",
          careerGoals: "Research Scientist",
        },
      },
    },
    include: { studentProfile: true },
  })

  const student3User = await prisma.user.create({
    data: {
      email: "student3@demo.com",
      passwordHash: hashedPassword,
      name: "Rahul Patel",
      role: "STUDENT",
      studentProfile: {
        create: {
          interests: "Web Development,Cloud Computing",
          careerGoals: "Full Stack Developer",
        },
      },
    },
    include: { studentProfile: true },
  })

  // Create Classes
  const class1 = await prisma.class.create({
    data: {
      courseName: "Data Structures & Algorithms",
      courseCode: "CS301",
      teacherId: teacher1User.teacherProfile!.id,
    },
  })

  const class2 = await prisma.class.create({
    data: {
      courseName: "Web Development",
      courseCode: "CS302",
      teacherId: teacher1User.teacherProfile!.id,
    },
  })

  const class3 = await prisma.class.create({
    data: {
      courseName: "Advanced Mathematics",
      courseCode: "MATH301",
      teacherId: teacher2User.teacherProfile!.id,
    },
  })

  const class4 = await prisma.class.create({
    data: {
      courseName: "Physics Lab",
      courseCode: "PHY301",
      teacherId: teacher3User.teacherProfile!.id,
    },
  })

  const class5 = await prisma.class.create({
    data: {
      courseName: "Database Systems",
      courseCode: "CS401",
      teacherId: teacher1User.teacherProfile!.id,
    },
  })

  const class6 = await prisma.class.create({
    data: {
      courseName: "Software Engineering",
      courseCode: "CS402",
      teacherId: teacher1User.teacherProfile!.id,
    },
  })

  // Create Timetable Slots
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]

  const slots = [
    { classId: class1.id, dayOfWeek: "MONDAY", startTime: "09:00", endTime: "10:30", room: "CS-101" },
    { classId: class2.id, dayOfWeek: "MONDAY", startTime: "10:45", endTime: "12:15", room: "CS-102" },
    { classId: class3.id, dayOfWeek: "MONDAY", startTime: "13:15", endTime: "14:45", room: "MATH-201" },
    { classId: class4.id, dayOfWeek: "TUESDAY", startTime: "09:00", endTime: "10:30", room: "PHY-LAB" },
    { classId: class5.id, dayOfWeek: "TUESDAY", startTime: "10:45", endTime: "12:15", room: "CS-103" },
    { classId: class1.id, dayOfWeek: "WEDNESDAY", startTime: "09:00", endTime: "10:30", room: "CS-101" },
    { classId: class6.id, dayOfWeek: "WEDNESDAY", startTime: "13:15", endTime: "14:45", room: "CS-104" },
    { classId: class2.id, dayOfWeek: "THURSDAY", startTime: "09:00", endTime: "10:30", room: "CS-102" },
    { classId: class3.id, dayOfWeek: "THURSDAY", startTime: "10:45", endTime: "12:15", room: "MATH-201" },
    { classId: class5.id, dayOfWeek: "FRIDAY", startTime: "09:00", endTime: "10:30", room: "CS-103" },
    { classId: class6.id, dayOfWeek: "FRIDAY", startTime: "10:45", endTime: "12:15", room: "CS-104" },
    { classId: class4.id, dayOfWeek: "FRIDAY", startTime: "13:15", endTime: "14:45", room: "PHY-LAB" },
  ]

  const timetableSlots = []
  for (const slot of slots) {
    const created = await prisma.timetableSlot.create({ data: slot })
    timetableSlots.push(created)
  }

  // Enroll students in classes
  const studentProfileId1 = student1User.studentProfile!.id
  const studentProfileId2 = student2User.studentProfile!.id
  const studentProfileId3 = student3User.studentProfile!.id

  await prisma.classEnrollment.createMany({
    data: [
      { studentId: studentProfileId1, classId: class1.id },
      { studentId: studentProfileId1, classId: class2.id },
      { studentId: studentProfileId1, classId: class3.id },
      { studentId: studentProfileId1, classId: class5.id },
      { studentId: studentProfileId2, classId: class3.id },
      { studentId: studentProfileId2, classId: class4.id },
      { studentId: studentProfileId2, classId: class1.id },
      { studentId: studentProfileId3, classId: class1.id },
      { studentId: studentProfileId3, classId: class2.id },
      { studentId: studentProfileId3, classId: class5.id },
      { studentId: studentProfileId3, classId: class6.id },
    ],
  })

  // Create some past attendance records
  const pastStatuses = ["PRESENT", "PRESENT", "PRESENT", "LATE", "ABSENT", "PRESENT"]
  for (let i = 0; i < timetableSlots.length && i < 6; i++) {
    const slot = timetableSlots[i]
    const daysAgo = i + 1
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - daysAgo)

    try {
      await prisma.attendanceRecord.create({
        data: {
          studentId: studentProfileId1,
          timetableSlotId: slot.id,
          status: pastStatuses[i],
          markedAt: pastDate,
          createdAt: pastDate,
        },
      })
    } catch {}
  }

  // Create Personal Goals for student
  await prisma.personalGoal.createMany({
    data: [
      {
        studentId: studentProfileId1,
        title: "Improve Algorithms Grade",
        description: "Score above 90% in CS301 exams",
        progress: 75,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        studentId: studentProfileId1,
        title: "Complete Web Project",
        description: "Build a full-stack portfolio project",
        progress: 40,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      },
      {
        studentId: studentProfileId1,
        title: "Join Coding Club",
        description: "Participate in weekly coding contests",
        progress: 100,
        isCompleted: true,
        deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        studentId: studentProfileId1,
        title: "Learn Docker & Kubernetes",
        description: "Complete online DevOps course",
        progress: 20,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    ],
  })

  // Create Activity Suggestions
  await prisma.activitySuggestion.createMany({
    data: [
      {
        title: "LeetCode Practice",
        description: "Solve algorithmic problems to strengthen DSA skills",
        category: "Academic",
        estimatedTime: 45,
        relevantCourses: "CS301",
      },
      {
        title: "Build a Portfolio Website",
        description: "Apply web development skills by building your personal portfolio",
        category: "Academic",
        estimatedTime: 60,
        relevantCourses: "CS302",
      },
      {
        title: "Database Design Workshop",
        description: "Practice ER diagrams and normalization exercises",
        category: "Academic",
        estimatedTime: 30,
        relevantCourses: "CS401",
      },
      {
        title: "Coding Club Meeting",
        description: "Weekly competitive programming contest with peers",
        category: "Competition",
        estimatedTime: 90,
        relevantCourses: "CS301,CS302",
      },
      {
        title: "Career Counseling Session",
        description: "Meet with career advisor to plan internship applications",
        category: "Career",
        estimatedTime: 30,
        relevantCourses: "",
      },
      {
        title: "Research Paper Reading",
        description: "Read latest AI/ML papers from arXiv",
        category: "Research",
        estimatedTime: 40,
        relevantCourses: "CS301",
      },
      {
        title: "Physics Problem Set",
        description: "Complete assigned physics problem sets",
        category: "Assignment",
        estimatedTime: 50,
        relevantCourses: "PHY301",
      },
      {
        title: "Study Group - Data Structures",
        description: "Join peer study group in library room 201",
        category: "Academic",
        estimatedTime: 60,
        relevantCourses: "CS301",
      },
      {
        title: "Sports & Recreation",
        description: "Basketball practice at campus gymnasium",
        category: "Sport",
        estimatedTime: 60,
        relevantCourses: "",
      },
      {
        title: "Internship Application Review",
        description: "Review and apply to summer internship opportunities",
        category: "Career",
        estimatedTime: 45,
        relevantCourses: "",
      },
    ],
  })

  console.log("✅ Database seeded successfully!")
  console.log("\n📋 Demo Credentials:")
  console.log("  Admin:    admin@demo.com    / password123")
  console.log("  Teacher:  teacher@demo.com  / password123")
  console.log("  Student:  student@demo.com  / password123")
  console.log("\n  Extra users:")
  console.log("  Teacher2: teacher2@demo.com / password123")
  console.log("  Teacher3: teacher3@demo.com / password123")
  console.log("  Student2: student2@demo.com / password123")
  console.log("  Student3: student3@demo.com / password123")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
