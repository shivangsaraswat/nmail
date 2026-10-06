import { auth } from "@/auth"
import { db } from "@/db"
import { senderIdentities, userSenderPermissions } from "@/db/schema"
import { getCampaign } from "@/app/actions/campaigns"
import { WorkspaceClient } from "@/components/campaign-workspace"
import { eq } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"

export default async function CampaignWorkspacePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
    const session = await auth()
    if (!session?.user?.id) redirect("/api/auth/signin")
    const { id } = await params
    const query = await searchParams
    let campaign
    try {
        campaign = await getCampaign(id)
    } catch {
        notFound()
    }
    const identities = session.user.role === "admin"
        ? await db.query.senderIdentities.findMany({ where: eq(senderIdentities.isActive, true) })
        : (await db.query.userSenderPermissions.findMany({
            where: eq(userSenderPermissions.userId, session.user.id),
            with: { senderIdentity: true },
        })).map(item => item.senderIdentity).filter(identity => identity.isActive)
    return <WorkspaceClient
        campaign={{
            ...campaign,
            columns: campaign.columns.map(column => ({ id: column.id, displayName: column.displayName, variableKey: column.variableKey, position: column.position, required: column.required })),
            rows: campaign.rows.map(row => ({ id: row.id, data: row.data, status: row.status, error: row.error, sentAt: row.sentAt })),
        }}
        identities={identities.map(identity => ({ id: identity.id, displayName: identity.displayName, emailAddress: identity.emailAddress }))}
            initialTab={query.tab === "schedule" ? "schedule" : "data"}
    />
}
