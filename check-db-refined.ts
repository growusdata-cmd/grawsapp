
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: { email: true }
        })

        console.log("All emails in DB (JSON format to see spaces/chars):")
        users.forEach(u => {
            console.log(JSON.stringify(u.email))
        })

    } catch (error) {
        console.error("Database connection error:", error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
