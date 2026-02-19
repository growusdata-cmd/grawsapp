
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return new NextResponse("Unauthorized", { status: 401 })

        const project = await prisma.project.findUnique({
            where: {
                id: params.id,
            },
            include: {
                company: true,
            },
        })

        if (!project) return new NextResponse("Not Found", { status: 404 })

        return NextResponse.json(project)
    } catch (error) {
        console.error("[PROJECT_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return new NextResponse("Unauthorized", { status: 401 })

        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const body = await req.json()
        const { name, description } = body

        if (!name) return new NextResponse("Name is required", { status: 400 })

        const project = await prisma.project.update({
            where: {
                id: params.id,
            },
            data: {
                name,
                description,
            },
        })

        return NextResponse.json(project)
    } catch (error) {
        console.error("[PROJECT_PUT]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return new NextResponse("Unauthorized", { status: 401 })

        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const project = await prisma.project.delete({
            where: {
                id: params.id,
            },
        })

        return NextResponse.json(project)
    } catch (error) {
        console.error("[PROJECT_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
