
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

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const company = await prisma.company.findUnique({
            where: {
                id: params.id,
            },
            include: {
                projects: {
                    orderBy: { createdAt: 'desc' }
                },
            },
        })

        if (!company) {
            return new NextResponse("Not Found", { status: 404 })
        }

        return NextResponse.json(company)
    } catch (error) {
        console.error("[COMPANY_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const body = await req.json()
        const { name, address, contactPerson, contactPhone, logoUrl } = body

        if (!name) {
            return new NextResponse("Name is required", { status: 400 })
        }

        const company = await prisma.company.update({
            where: {
                id: params.id,
            },
            data: {
                name,
                address,
                contactPerson,
                contactPhone,
                logoUrl,
            },
        })

        return NextResponse.json(company)
    } catch (error) {
        console.error("[COMPANY_PUT]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const company = await prisma.company.delete({
            where: {
                id: params.id,
            },
        })

        return NextResponse.json(company)
    } catch (error) {
        console.error("[COMPANY_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
