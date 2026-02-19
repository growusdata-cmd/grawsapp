
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@prisma/client"

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get("role")

    if (role === "INSPECTION_BOY") {
        const users = await prisma.user.findMany({
            where: {
                role: Role.INSPECTION_BOY,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        })
        return NextResponse.json(users)
    }

    return NextResponse.json({ error: "Invalid role filter" }, { status: 400 })
}
