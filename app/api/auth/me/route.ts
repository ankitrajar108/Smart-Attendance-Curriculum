import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req)
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentProfile: user.studentProfile,
      teacherProfile: user.teacherProfile,
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ message: "Auth check failed" }, { status: 500 })
  }
}
