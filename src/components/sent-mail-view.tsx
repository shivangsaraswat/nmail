"use client"

import { deleteSentEmailAction } from "@/app/actions/email"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { format } from "date-fns"
import { Archive, CheckCircle2, ChevronDown, Mail, Search, Trash2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SentMessage {
    id: string
    subject: string
    recipients: string[]
    htmlContent: string
    sentAt: string
    deliveryStatus: string
    errorMessage: string | null
    senderName: string
    senderEmail: string
    sentBy: string | null
    isAdminView: boolean
}

interface SentMailViewProps {
    messages: SentMessage[]
}

function getInitials(value: string) {
    return value
        .split(/[\s@]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "S"
}

export function SentMailView({ messages }: SentMailViewProps) {
    const [selectedId, setSelectedId] = useState("")
    const [search, setSearch] = useState("")
    const [showMessageDetails, setShowMessageDetails] = useState(false)
    const [isDeleting, startDeleting] = useTransition()
    const router = useRouter()

    const filteredMessages = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return messages

        return messages.filter((message) => [
            message.subject,
            message.senderName,
            message.senderEmail,
            message.recipients.join(" "),
            message.sentBy || "",
        ].some((value) => value.toLowerCase().includes(query)))
    }, [messages, search])

    const selectedMessage = messages.find((message) => message.id === selectedId)

    const selectMessage = (id: string) => {
        setSelectedId(id)
        setShowMessageDetails(false)
    }

    const deleteMessage = (id: string) => {
        if (!window.confirm("Delete this sent email?")) return
        startDeleting(async () => {
            const data = new FormData()
            data.set("emailId", id)
            const result = await deleteSentEmailAction(data)
            if (result.success) {
                setSelectedId("")
                router.refresh()
            }
        })
    }

    return (
        <div className="flex min-h-[calc(100vh-3rem)] flex-col gap-5">
            <section className="min-h-0 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
                {selectedMessage ? (
                        <article className="flex h-full min-h-[620px] flex-col">
                            <div className="flex items-center justify-between border-b border-border/80 px-5 py-4 sm:px-8">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="gap-2 px-2 text-sm"
                                    onClick={() => setSelectedId("")}
                                >
                                    <span aria-hidden="true">←</span>
                                    Back to sent mail
                                </Button>
                                <div className="flex items-center gap-2">
                                    {selectedMessage.deliveryStatus === "sent" ? (
                                        <Badge className="gap-1 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
                                            <CheckCircle2 className="size-3" /> Delivered
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive" className="gap-1 rounded-full">
                                            <XCircle className="size-3" /> Failed
                                        </Badge>
                                    )}
                                    <Button type="button" variant="ghost" size="icon-sm" title="Delete sent email" disabled={isDeleting} onClick={() => deleteMessage(selectedMessage.id)} className="text-muted-foreground hover:text-destructive">
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto">
                                <div className="px-5 pb-5 pt-6 sm:px-8">
                                    <h2 className="max-w-3xl text-2xl font-semibold tracking-tight text-foreground">{selectedMessage.subject || "(no subject)"}</h2>
                                    <div className="mt-5 flex flex-wrap items-start gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                            {getInitials(selectedMessage.senderName)}
                                        </div>
                                        <div className="min-w-0 flex-1 text-sm">
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                <span className="font-semibold">{selectedMessage.senderName}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowMessageDetails((visible) => !visible)}
                                                className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                                aria-expanded={showMessageDetails}
                                            >
                                                to me
                                                <ChevronDown className={`size-3 transition-transform ${showMessageDetails ? "rotate-180" : ""}`} />
                                            </button>
                                        </div>
                                        <time className="text-xs text-muted-foreground" dateTime={selectedMessage.sentAt}>
                                            {format(new Date(selectedMessage.sentAt), "MMM d, yyyy, h:mm a")}
                                        </time>
                                    </div>

                                    {showMessageDetails && (
                                        <div className="ml-[52px] mt-3 grid max-w-xl gap-1.5 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground sm:grid-cols-[56px_1fr]">
                                            <span>from:</span>
                                            <span className="text-foreground">{selectedMessage.senderName} &lt;{selectedMessage.senderEmail}&gt;</span>
                                            <span>to:</span>
                                            <span className="text-foreground">{selectedMessage.recipients.join(", ") || "unknown recipient"}</span>
                                            {selectedMessage.isAdminView && selectedMessage.sentBy && (
                                                <>
                                                    <span>sent by:</span>
                                                    <span className="text-foreground">{selectedMessage.sentBy}</span>
                                                </>
                                            )}
                                            <span>subject:</span>
                                            <span className="text-foreground">{selectedMessage.subject || "(no subject)"}</span>
                                        </div>
                                    )}
                                </div>

                                {selectedMessage.errorMessage && (
                                    <div className="mx-5 mb-5 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive sm:mx-8">
                                        {selectedMessage.errorMessage}
                                    </div>
                                )}

                                <div className="mx-5 mb-8 overflow-hidden rounded-xl border border-border/80 bg-white shadow-sm sm:mx-8">
                                    {selectedMessage.htmlContent ? (
                                        <iframe
                                            key={selectedMessage.id}
                                            title={`Email content: ${selectedMessage.subject || "No subject"}`}
                                            srcDoc={selectedMessage.htmlContent}
                                            sandbox="allow-same-origin"
                                            className="block min-h-[520px] w-full bg-white"
                                        />
                                    ) : (
                                        <div className="flex min-h-[300px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
                                            This message was sent before full message content was stored.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </article>
                    ) : (
                        <div>
                            <div className="border-b border-border/80 bg-card px-4 pb-4 pt-4 sm:px-6">
                                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <Mail className="size-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-semibold">Sent</h2>
                                            <p className="text-xs text-muted-foreground">{messages.length} {messages.length === 1 ? "message" : "messages"}</p>
                                        </div>
                                        <Badge variant="outline" className="gap-1 rounded-full bg-background text-[11px] font-medium">
                                            <Archive className="size-3" />
                                            {messages.length} total
                                        </Badge>
                                    </div>
                                    <div className="relative w-full sm:w-72">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={search}
                                            onChange={(event) => setSearch(event.target.value)}
                                            placeholder="Search sent mail"
                                            className="h-9 rounded-lg border-border/70 bg-muted/40 pl-9 text-sm shadow-none focus-visible:bg-background"
                                        />
                                    </div>
                                </div>
                            </div>

                            {filteredMessages.length === 0 ? (
                                <div className="flex min-h-72 flex-col items-center justify-center px-8 text-center">
                                    <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                        <Search className="size-5" />
                                    </div>
                                    <p className="text-sm font-medium">No sent mail found</p>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Try a different subject, recipient, or sender.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <div className="min-w-[760px]">
                                        <div className="grid grid-cols-[minmax(210px,1.1fr)_minmax(260px,2fr)_minmax(190px,1fr)_minmax(240px,auto)] items-center border-b border-border/70 bg-muted/30 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            <span>To</span>
                                            <span>Subject</span>
                                            <span>From</span>
                                            <span className="text-right">Sent</span>
                                        </div>
                                        {filteredMessages.map((message) => (
                                            <div
                                                key={message.id}
                                                onClick={() => selectMessage(message.id)}
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter" || event.key === " ") selectMessage(message.id)
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                className="grid w-full cursor-pointer grid-cols-[minmax(210px,1.1fr)_minmax(260px,2fr)_minmax(190px,1fr)_minmax(240px,auto)] items-center border-b border-border/60 px-6 py-3 text-left transition-colors hover:bg-accent/60"
                                            >
                                                <div className="flex min-w-0 items-center gap-3 pr-4">
                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                                                        {getInitials(message.senderName)}
                                                    </div>
                                                    <span className="truncate text-sm font-medium text-foreground">{message.recipients.join(", ") || "No recipient"}</span>
                                                </div>
                                                <div className="min-w-0 pr-5">
                                                    <p className="truncate text-sm font-medium text-foreground">{message.subject || "(no subject)"}</p>
                                                </div>
                                                <div className="min-w-0 pr-5">
                                                    <p className="truncate text-sm text-foreground">{message.senderName}</p>
                                                </div>
                                                <div className="flex items-center justify-end gap-3 text-right">
                                                    <time className="text-xs text-muted-foreground" dateTime={message.sentAt}>
                                                        {format(new Date(message.sentAt), "MMM d, yyyy")}
                                                    </time>
                                                    {message.deliveryStatus === "sent" ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600"><CheckCircle2 className="size-3" /> Sent</span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive"><XCircle className="size-3" /> Failed</span>
                                                    )}
                                                    <Button type="button" variant="ghost" size="icon-sm" title="Delete sent email" disabled={isDeleting} onClick={(event) => { event.stopPropagation(); deleteMessage(message.id) }} className="size-7 text-muted-foreground hover:text-destructive">
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
            </section>
        </div>
    )
}
