
import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Plus, Building2, Phone, User } from "lucide-react"

export default async function CompaniesPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/login")
    }

    if (session.user.role === "CLIENT") {
        redirect("/client")
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
                <Button asChild>
                    <Link href="/companies/create">
                        <Plus className="mr-2 h-4 w-4" /> Add Company
                    </Link>
                </Button>
            </div>

            {companies.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed shadow-sm">
                    <div className="flex flex-col items-center gap-1 text-center">
                        <h3 className="text-2xl font-bold tracking-tight">
                            No companies added
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            You can start by adding a new company.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/companies/create">Add Company</Link>
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {companies.map((company) => (
                        <Card key={company.id} className="transition-all hover:bg-accent/5">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <Building2 className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{company.name}</CardTitle>
                                        <CardDescription>{company.address || "No address provided"}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>{company.contactPerson || "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{company.contactPhone || "N/A"}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex items-center justify-between border-t bg-muted/50 px-6 py-3">
                                <div className="text-xs text-muted-foreground">
                                    {company._count.projects} Projects
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/companies/${company.id}`}>View Details</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
