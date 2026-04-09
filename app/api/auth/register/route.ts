import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role } = await req.json()

    if (!email || !password || !name || !role) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    if (!["STUDENT", "TEACHER", "ADMIN"].includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ message: "Email already registered" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        studentProfile: role === "STUDENT" ? { create: { interests: "", careerGoals: "" } } : undefined,
        teacherProfile: role === "TEACHER" ? { create: { department: "" } } : undefined,
      },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    })

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        studentProfile: user.studentProfile,
        teacherProfile: user.teacherProfile,
      },
      token,
    })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ message: "Registration failed" }, { status: 500 })
  }
}
