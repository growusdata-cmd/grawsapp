
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    try {
        const userCount = await prisma.user.count()
        console.log(`Total users in database: ${userCount}`)

        const admin = await prisma.user.findUnique({
            where: { email: "admin@cims.com" }
        })

        if (admin) {
            console.log("Admin user found!")
            console.log("Admin Name:", admin.name)
            console.log("Admin Active:", admin.isActive)
            console.log("Admin Role:", admin.role)
            // DON'T PRINT PASSWORD HASH FOR SECURITY, but we can verify it exists
            console.log("Admin Password Hash set:", !!admin.password)
        } else {
            console.log("Admin user NOT found!")
        }
    } catch (error) {
        console.error("Database connection error:", error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
