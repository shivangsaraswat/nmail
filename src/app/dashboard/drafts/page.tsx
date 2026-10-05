import Link from "next/link"
import { auth } from "@/auth"
import { db } from "@/db"
import { emailDrafts } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { format } from "date-fns"
import { FilePenLine, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteDraftAction } from "@/app/actions/email"

async function deleteDraftFormAction(formData: FormData) {
    "use server"
    await deleteDraftAction(formData)
}

export default async function DraftsPage() {
    const session = await auth()
    if (!session?.user?.id) return null

    const drafts = await db.query.emailDrafts.findMany({
        where: eq(emailDrafts.userId, session.user.id),
        orderBy: [desc(emailDrafts.updatedAt)],
        with: { senderIdentity: true },
    })

    return (
        <div className="space-y-5">
            <div>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Drafts</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Continue unfinished messages.</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
                {drafts.length === 0 ? (
                    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                        <FilePenLine className="mb-3 size-8 text-muted-foreground" />
                        <p className="font-medium">No drafts</p>
                        <p className="mt-1 text-sm text-muted-foreground">Saved messages will appear here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {drafts.map((draft) => (
                            <div key={draft.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-accent/50">
                                <Link href={`/dashboard/compose?draftId=${draft.id}`} className="flex min-w-0 flex-1 items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{draft.subject || "(no subject)"}</p>
                                        <p className="mt-1 truncate text-xs text-muted-foreground">To: {(draft.recipients as string[]).join(", ") || "No recipient yet"}</p>
                                    </div>
                                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                                        <p>{draft.senderIdentity.displayName}</p>
                                        <p className="mt-1">{format(draft.updatedAt, "MMM d, h:mm a")}</p>
                                    </div>
                                </Link>
                                <form action={deleteDraftFormAction}>
                                    <input type="hidden" name="draftId" value={draft.id} />
                                    <Button type="submit" variant="ghost" size="icon-sm" title="Delete draft" className="shrink-0 text-muted-foreground hover:text-destructive">
                                        <Trash2 className="size-4" />
                                    </Button>
                                </form>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
