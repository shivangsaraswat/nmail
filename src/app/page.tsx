
import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl mb-4">
        Centralized Outbound Email
      </h1>
      <p className="text-lg text-muted-foreground max-w-[600px] mb-8">
        Secure, permission-based email sending for your organization.
        Log in to access your assigned sender identities.
      </p>

      <div className="flex gap-4">
        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: "/dashboard" })
          }}
        >
          <Button size="lg" type="submit">Sign In with Google</Button>
        </form>
      </div>
    </div>
  )
}
