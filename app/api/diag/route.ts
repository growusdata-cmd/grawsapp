
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
    try {
        // Try a tiny query
        const result = await prisma.$queryRaw`SELECT 1 as connected`
        return NextResponse.json({
            status: "connected",
            result,
            db_url_exists: !!process.env.DATABASE_URL,
            env: process.env.NODE_ENV
        })
    } catch (error: any) {
        console.error("Diagnostic Error:", error)
        return NextResponse.json({
            status: "error",
            message: error.message,
            stack: error.stack,
            db_url_exists: !!process.env.DATABASE_URL,
            env: process.env.NODE_ENV
        }, { status: 500 })
    }
}
