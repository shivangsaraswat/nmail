import { auth } from "@/auth"
import { db } from "@/db"
import { scheduledEmails } from "@/db/schema"
import { campaigns } from "@/db/schema"
import { and, desc, eq } from "drizzle-orm"
import { format } from "date-fns"
import { Clock3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cancelScheduledEmailAction, editScheduledEmailAction } from "@/app/actions/email"
import { cancelScheduledCampaign } from "@/app/actions/campaigns"

async function cancelScheduledFormAction(formData: FormData) {
    "use server"
    await cancelScheduledEmailAction(formData)
}

async function editScheduledFormAction(formData: FormData) {
    "use server"
    await editScheduledEmailAction(formData)
}

export default async function ScheduledPage() {
    const session = await auth()
    if (!session?.user?.id) return null

    const messages = await db.query.scheduledEmails.findMany({
        where: and(eq(scheduledEmails.userId, session.user.id), eq(scheduledEmails.status, "scheduled")),
        orderBy: [desc(scheduledEmails.scheduledFor)],
        with: { senderIdentity: true },
    })
    const scheduledCampaigns = await db.query.campaigns.findMany({
        where: and(eq(campaigns.ownerId, session.user.id), eq(campaigns.status, "scheduled")),
        orderBy: [desc(campaigns.scheduledAt)],
        with: { rows: true },
    })

    return (
        <div className="space-y-5">
            <div>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Scheduled</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Messages waiting for delivery.</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
                {messages.length === 0 && scheduledCampaigns.length === 0 ? (
                    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                        <Clock3 className="mb-3 size-8 text-muted-foreground" />
                        <p className="font-medium">Nothing scheduled</p>
                        <p className="mt-1 text-sm text-muted-foreground">Scheduled messages will appear here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {scheduledCampaigns.map((campaign) => (
                            <div key={campaign.id} className="flex items-center gap-4 px-5 py-4">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{campaign.name}</p>
                                    <p className="mt-1 truncate text-xs text-muted-foreground">Campaign · {campaign.rows.length} recipients</p>
                                </div>
                                <div className="ml-auto shrink-0 text-right text-xs">
                                    <p className="font-medium text-foreground">Scheduled</p>
                                    {campaign.scheduledAt && <p className="mt-1 text-muted-foreground">{format(campaign.scheduledAt, "MMM d, yyyy, h:mm a")}</p>}
                                </div>
                                <Button asChild variant="outline" size="sm"><a href={`/dashboard/campaigns/${campaign.id}?tab=schedule`}>Open schedule</a></Button>
                                <form action={async () => { "use server"; await cancelScheduledCampaign(campaign.id) }}>
                                    <Button type="submit" variant="outline" size="sm">Cancel</Button>
                                </form>
                            </div>
                        ))}
                        {messages.map((message) => (
                            <div key={message.id} className="flex items-center gap-4 px-5 py-4">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{message.subject}</p>
                                    <p className="mt-1 truncate text-xs text-muted-foreground">To: {(message.recipients as string[]).join(", ")}</p>
                                </div>
                                <div className="ml-auto shrink-0 text-right text-xs">
                                    <p className="font-medium capitalize text-foreground">{message.status}</p>
                                    <p className="mt-1 text-muted-foreground">{format(message.scheduledFor, "MMM d, yyyy, h:mm a")}</p>
                                </div>
                                <form action={editScheduledFormAction}>
                                    <input type="hidden" name="scheduledId" value={message.id} />
                                    <Button type="submit" variant="outline" size="sm">Edit</Button>
                                </form>
                                <form action={cancelScheduledFormAction}>
                                        <input type="hidden" name="scheduledId" value={message.id} />
                                        <Button type="submit" variant="outline" size="sm">Cancel</Button>
                                </form>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
