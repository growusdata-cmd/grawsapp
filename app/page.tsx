
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  } else {
    // Redirect to respective dashboard
    const role = session.user.role
    switch (role) {
      case "ADMIN":
        redirect("/admin")
      case "MANAGER":
        redirect("/manager")
      case "INSPECTION_BOY":
        redirect("/inspection")
      case "CLIENT":
        redirect("/client")
      default:
        redirect("/login")
    }
  }
}
