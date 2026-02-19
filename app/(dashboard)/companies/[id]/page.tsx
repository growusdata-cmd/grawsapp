
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import CompanyDetailsClient from "./CompanyDetailsClient"

export default async function CompanyDetailsPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)

    if (!session) redirect("/login")
    if (session.user.role === "CLIENT") redirect("/client")

    return (
        <CompanyDetailsClient
            companyId={params.id}
            session={{
                user: {
                    id: session.user.id,
                    name: session.user.name || "",
                    role: session.user.role,
                },
            }}
        />
    )
}
