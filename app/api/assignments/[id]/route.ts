
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@prisma/client"

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { status } = body

        if (!status) {
            return NextResponse.json({ error: "Missing status" }, { status: 400 })
        }

        const assignment = await prisma.assignment.update({
            where: {
                id: params.id
            },
            data: {
                status
            }
        })

        return NextResponse.json(assignment)
    } catch (error) {
        console.error("PATCH_ASSIGNMENT_ERROR", error)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
