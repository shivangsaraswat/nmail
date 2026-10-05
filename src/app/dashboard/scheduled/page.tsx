import { auth } from "@/auth"
import { db } from "@/db"
import { scheduledEmails } from "@/db/schema"
import { and, desc, eq } from "drizzle-orm"
import { format } from "date-fns"
import { Clock3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cancelScheduledEmailAction, editScheduledEmailAction } from "@/app/actions/email"

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

    return (
        <div className="space-y-5">
            <div>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Scheduled</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Messages waiting for delivery.</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
                {messages.length === 0 ? (
                    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                        <Clock3 className="mb-3 size-8 text-muted-foreground" />
                        <p className="font-medium">Nothing scheduled</p>
                        <p className="mt-1 text-sm text-muted-foreground">Scheduled messages will appear here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
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
