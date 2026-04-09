import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req)
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        department: u.teacherProfile?.department || null,
        interests: u.studentProfile?.interests || null,
      }))
    )
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = getAuthUser(req)
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ message: "User ID required" }, { status: 400 })
    }
    if (id === authUser.userId) {
      return NextResponse.json({ message: "Cannot delete yourself" }, { status: 400 })
    }

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ message: "User deleted" })
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete user" }, { status: 500 })
  }
}
