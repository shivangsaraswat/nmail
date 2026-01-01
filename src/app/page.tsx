
import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TopRightPattern, BottomLeftPattern } from "@/components/ui/patterns"

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 text-center relative overflow-hidden">
      <TopRightPattern />
      <BottomLeftPattern />
      <img src="/nmail-logo.png" alt="Nmail Logo" className="absolute top-8 left-8 h-8" />

      <img src="/logo-namdapha.webp" alt="Namdapha Logo" className="h-24 mb-6" />

      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl mb-4">
        Namdapha
      </h1>
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl mb-4">
        Centralized Outbound Email
      </h1>
      <p className="text-lg text-muted-foreground max-w-[600px] mb-8">
        Namdapha House internal email sending system.
        Log in to access your assigned sender identities.
      </p>

      <div className="flex gap-4 justify-center">
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
