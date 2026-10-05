
import { auth } from "@/auth"
import { db } from "@/db"
import { userSenderPermissions, senderIdentities, emailTemplates, emailDrafts } from "@/db/schema"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { ComposeForm } from "@/components/compose-form"

interface ComposePageProps {
    searchParams: Promise<{ templateId?: string; draftId?: string }>
}

export default async function ComposePage({ searchParams }: ComposePageProps) {
    const session = await auth()
    const params = await searchParams

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

    // Fetch template if templateId is provided
    let initialTemplate: { htmlContent: string; name: string } | undefined
    if (params.templateId) {
        const template = await db.query.emailTemplates.findFirst({
            where: eq(emailTemplates.id, params.templateId)
        })
        if (template) {
            initialTemplate = {
                htmlContent: template.htmlContent,
                name: template.name
            }
        }
    }

    let initialDraft: {
        id: string
        senderIdentityId: string
        to: string
        cc: string
        bcc: string
        subject: string
        htmlContent: string
    } | undefined
    if (params.draftId) {
        const draft = await db.query.emailDrafts.findFirst({
            where: eq(emailDrafts.id, params.draftId),
        })
        if (draft && draft.userId === session.user.id) {
            initialDraft = {
                id: draft.id,
                senderIdentityId: draft.senderIdentityId,
                to: (draft.recipients as string[]).join(", "),
                cc: (draft.ccRecipients as string[]).join(", "),
                bcc: (draft.bccRecipients as string[]).join(", "),
                subject: draft.subject,
                htmlContent: draft.htmlContent,
            }
        }
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
                <ComposeForm allowedIdentities={allowedIdentities} initialTemplate={initialTemplate} initialDraft={initialDraft} />
            </div>
        </div>
    )
}
