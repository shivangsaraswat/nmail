
import { auth } from "@/auth"
import { db } from "@/db"
import { userSenderPermissions, senderIdentities } from "@/db/schema"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { ComposeForm } from "@/components/compose-form"

export default async function ComposePage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/api/auth/signin")
    }

    let allowedIdentities

    // Admins have access to ALL active sender identities
    if (session.user.role === 'admin') {
        allowedIdentities = await db.query.senderIdentities.findMany({
            where: eq(senderIdentities.isActive, true)
        })
    } else {
        // Regular users only see their assigned identities
        const permissions = await db.query.userSenderPermissions.findMany({
            where: eq(userSenderPermissions.userId, session.user.id),
            with: {
                senderIdentity: true
            }
        })

        // Filter only active identities
        allowedIdentities = permissions
            .map(p => p.senderIdentity)
            .filter(id => id.isActive)
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Compose Email</h2>
                <p className="text-muted-foreground text-sm">
                    Send a new secure email using an approved identity.
                </p>
            </div>

            <div className="bg-card rounded-lg border shadow-sm">
                <ComposeForm allowedIdentities={allowedIdentities} />
            </div>
        </div>
    )
}
