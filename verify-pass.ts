
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    try {
        const email = "admin@cims.com"
        const passwordToTry = "password123"

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            console.log("User not found")
            return
        }

        const isMatch = await bcrypt.compare(passwordToTry, user.password)
        console.log(`Password "password123" matches for ${email}: ${isMatch}`)

    } catch (error) {
        console.error("Verification error:", error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
