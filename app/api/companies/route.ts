
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const companies = await prisma.company.findMany({
            include: {
                _count: {
                    select: { projects: true },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        return NextResponse.json(companies)
    } catch (error) {
        console.error("[COMPANIES_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // Role check: CLIENT cannot create companies (Assuming ADMIN, MANAGER, INSPECTION_BOY can)
        if (session.user.role === "CLIENT") {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const body = await req.json()
        const { name, address, contactPerson, contactPhone, logoUrl } = body

        if (!name) {
            return new NextResponse("Name is required", { status: 400 })
        }

        const company = await prisma.company.create({
            data: {
                name,
                address,
                contactPerson,
                contactPhone,
                logoUrl,
                createdBy: session.user.id,
            },
        })

        return NextResponse.json(company)
    } catch (error) {
        console.error("[COMPANIES_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
