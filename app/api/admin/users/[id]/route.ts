import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@prisma/client"
import bcrypt from "bcryptjs"

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== Role.ADMIN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    try {
        const body = await req.json()
        const { isActive, password } = body

        const updateData: any = {}

        if (typeof isActive === "boolean") {
            updateData.isActive = isActive
        }

        if (password) {
            updateData.password = await bcrypt.hash(password, 10)
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 })
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData
        })

        const { password: _, ...safeUser } = user
        return NextResponse.json(safeUser)
    } catch (error) {
        console.error("PATCH_USER_ERROR", error)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
