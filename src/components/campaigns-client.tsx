"use client"

import Link from "next/link"
import { useState } from "react"
import { Plus, Megaphone, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createCampaign, deleteCampaign } from "@/app/actions/campaigns"
import { toast } from "sonner"

type CampaignSummary = { id: string; name: string; description: string | null; status: string; scheduledAt: Date | null; updatedAt: Date; recipientCount: number }

export function CampaignsClient({ campaigns }: { campaigns: CampaignSummary[] }) {
    const [showCreate, setShowCreate] = useState(false)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [creating, setCreating] = useState(false)
    async function create() {
        if (!name.trim()) return toast.error("Enter a campaign name")
        setCreating(true)
        try {
            const result = await createCampaign(name, description)
            window.location.href = `/dashboard/campaigns/${result.id}`
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not create campaign")
            setCreating(false)
        }
    }
    return <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold">Personalised Mail</h1>
                <p className="mt-1 text-sm text-muted-foreground">Create and send personalised emails using campaign data and templates.</p>
            </div>
            <Button onClick={() => setShowCreate(true)}><Plus /> Create Campaign</Button>
        </div>
        {campaigns.length === 0 ? <div className="rounded-xl border border-dashed p-14 text-center">
            <Megaphone className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h2 className="font-semibold">No campaigns yet</h2>
            <p className="mb-5 mt-1 text-sm text-muted-foreground">Start with a recipient list and a personalised message.</p>
            <Button variant="outline" onClick={() => setShowCreate(true)}>Create your first campaign</Button>
        </div> : <div className="overflow-hidden rounded-xl border bg-card">
            <div className="grid grid-cols-[1fr_120px_120px_140px_80px] gap-4 border-b bg-muted/40 px-5 py-3 text-xs font-medium text-muted-foreground">
                <span>Campaign</span><span>Recipients</span><span>Status</span><span>Last activity</span><span />
            </div>
            {campaigns.map(campaign => <div key={campaign.id} className="grid grid-cols-[1fr_120px_120px_140px_80px] items-center gap-4 border-b px-5 py-4 last:border-0">
                <Link href={`/dashboard/campaigns/${campaign.id}`} className="min-w-0 hover:underline"><div className="truncate font-medium">{campaign.name}</div><div className="truncate text-xs text-muted-foreground">{campaign.description || "No description"}</div></Link>
                <span className="text-sm">{campaign.recipientCount} / 100</span>
                <span className="text-sm capitalize">{campaign.status.replace("_", " ")}</span>
                <span className="text-xs text-muted-foreground">{campaign.updatedAt.toISOString().slice(0, 10)}</span>
                <Button variant="ghost" size="icon" onClick={async () => { if (confirm("Delete this campaign?")) { await deleteCampaign(campaign.id); window.location.reload() } }}><Trash2 className="h-4 w-4" /></Button>
            </div>)}
        </div>}
        {showCreate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
                <h2 className="text-lg font-semibold">Create Campaign</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your campaign starts as a draft.</p>
                <div className="mt-5 space-y-4"><Input autoFocus placeholder="Campaign name" value={name} onChange={e => setName(e.target.value)} /><Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} /></div>
                <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button disabled={creating} onClick={create}>{creating ? "Creating..." : "Create Campaign"}</Button></div>
            </div>
        </div>}
    </div>
}
