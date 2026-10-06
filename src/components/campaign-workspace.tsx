"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Editor } from "@tiptap/core"
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Save, Send, Trash2, Upload } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TiptapEditor } from "@/components/tiptap-editor"
import { toast } from "sonner"
import { cancelScheduledCampaign, replaceCampaignData, scheduleCampaign, sendCampaign, sendTestCampaign, updateCampaign, validateCampaign } from "@/app/actions/campaigns"

type Column = { id: string; displayName: string; variableKey: string; position: number; required: boolean }
type Row = { id: string; data: Record<string, string>; status: string; error: string | null; sentAt: Date | null }
type Campaign = { id: string; name: string; description: string | null; status: string; senderIdentityId: string | null; subjectTemplate: string; htmlTemplate: string; scheduledAt: Date | null; columns: Column[]; rows: Row[] }
type Identity = { id: string; displayName: string; emailAddress: string }

export function WorkspaceClient({ campaign: initial, identities, initialTab = "data" }: { campaign: Campaign; identities: Identity[]; initialTab?: string }) {
    const [campaign, setCampaign] = useState(initial)
    const [tab, setTab] = useState(initialTab)
    const [saving, setSaving] = useState(false)
    const [previewIndex, setPreviewIndex] = useState(0)
    const [variableToInsert, setVariableToInsert] = useState<{ text: string; id: number }>()
    const [scheduleDate, setScheduleDate] = useState("")
    const [scheduleTime, setScheduleTime] = useState("")
    const [scheduleBusy, setScheduleBusy] = useState(false)
    const [minimumDate, setMinimumDate] = useState("")
    const [validation, setValidation] = useState<{ valid: boolean; errors: string[] } | null>(null)
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const editorRef = useRef<Editor | null>(null)
    const scheduleInitialized = useRef(false)

    useEffect(() => {
        if (scheduleInitialized.current) return
        scheduleInitialized.current = true
        const now = new Date()
        const localPart = (value: number) => String(value).padStart(2, "0")
        setMinimumDate(`${now.getFullYear()}-${localPart(now.getMonth() + 1)}-${localPart(now.getDate())}`)
        if (campaign.scheduledAt) {
            const scheduled = new Date(campaign.scheduledAt)
            setScheduleDate(`${scheduled.getFullYear()}-${localPart(scheduled.getMonth() + 1)}-${localPart(scheduled.getDate())}`)
            setScheduleTime(`${localPart(scheduled.getHours())}:${localPart(scheduled.getMinutes())}`)
        }
    }, [campaign.scheduledAt])

    const saveData = (columns = campaign.columns, rows = campaign.rows) => {
        if (saveTimer.current) clearTimeout(saveTimer.current)
        setSaving(true)
        saveTimer.current = setTimeout(async () => {
            try {
                await replaceCampaignData(campaign.id, { columns, rows: rows.map(row => ({ id: row.id, data: row.data })) })
            } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save data") }
            setSaving(false)
        }, 500)
    }
    const updateMail = (patch: Partial<Campaign>) => {
        setCampaign(current => ({ ...current, ...patch }))
        if (patch.subjectTemplate !== undefined || patch.htmlTemplate !== undefined || patch.senderIdentityId !== undefined) {
            updateCampaign(campaign.id, {
                senderIdentityId: patch.senderIdentityId,
                subjectTemplate: patch.subjectTemplate,
                htmlTemplate: patch.htmlTemplate,
            }).catch(error => toast.error(error instanceof Error ? error.message : "Could not save campaign"))
        }
    }
    const addRow = () => {
        if (campaign.rows.length >= 100) return toast.error("A campaign can contain a maximum of 100 recipients.")
        const row = { id: crypto.randomUUID(), data: Object.fromEntries(campaign.columns.map(column => [column.variableKey, ""])), status: "pending", error: null, sentAt: null }
        const rows = [...campaign.rows, row]
        setCampaign({ ...campaign, rows }); saveData(campaign.columns, rows)
    }
    const addColumn = () => {
        const column = { id: crypto.randomUUID(), displayName: `Column ${campaign.columns.length + 1}`, variableKey: `column_${campaign.columns.length + 1}`, position: campaign.columns.length, required: false }
        const columns = [...campaign.columns, column]
        const rows = campaign.rows.map(row => ({ ...row, data: { ...row.data, [column.variableKey]: "" } }))
        setCampaign({ ...campaign, columns, rows }); saveData(columns, rows)
    }
    const updateCell = (rowIndex: number, key: string, value: string) => {
        const rows = campaign.rows.map((row, index) => index === rowIndex ? { ...row, data: { ...row.data, [key]: value } } : row)
        setCampaign({ ...campaign, rows }); saveData(campaign.columns, rows)
    }
    const deleteRow = (index: number) => {
        const rows = campaign.rows.filter((_, rowIndex) => rowIndex !== index)
        setCampaign({ ...campaign, rows }); saveData(campaign.columns, rows)
    }
    const deleteColumn = (index: number) => {
        const key = campaign.columns[index].variableKey
        const columns = campaign.columns.filter((_, columnIndex) => columnIndex !== index).map((column, position) => ({ ...column, position }))
        const rows = campaign.rows.map(row => { const data = { ...row.data }; delete data[key]; return { ...row, data } })
        setCampaign({ ...campaign, columns, rows }); saveData(columns, rows)
    }
    const importCsv = (file: File) => {
        const reader = new FileReader()
        reader.onload = () => {
            const lines = String(reader.result).split(/\r?\n/).filter(Boolean).map(line => line.split(",").map(cell => cell.trim().replace(/^"|"$/g, "")))
            if (lines.length < 2) return toast.error("CSV must include a header and at least one row.")
            const headers = lines[0]
            const keys = headers.map((header, index) => index === 0 ? "email" : header.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || `column_${index + 1}`)
            const columns = headers.map((displayName, position) => ({ id: crypto.randomUUID(), displayName, variableKey: keys[position], position, required: keys[position] === "email" }))
            const rows = lines.slice(1, 101).map(values => ({ id: crypto.randomUUID(), status: "pending", error: null, sentAt: null, data: Object.fromEntries(keys.map((key, index) => [key, values[index] || ""])) }))
            setCampaign({ ...campaign, columns, rows }); saveData(columns, rows); toast.success(`${rows.length} rows imported`)
        }
        reader.readAsText(file)
    }
    const selectedRow = campaign.rows[previewIndex]
    const renderedSubject = selectedRow ? render(campaign.subjectTemplate, selectedRow.data) : campaign.subjectTemplate
    const renderedHtml = selectedRow ? render(campaign.htmlTemplate, selectedRow.data) : campaign.htmlTemplate
    const usedVariables = useMemo(() => [...new Set((campaign.subjectTemplate + campaign.htmlTemplate).match(/{{\s*([a-zA-Z0-9_]+)\s*}}/g)?.map(value => value.replace(/[{} ]/g, "")) || [])], [campaign.subjectTemplate, campaign.htmlTemplate])
    function render(template: string, data: Record<string, string>) { return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => data[key] || "") }
    async function runValidation() { const result = await validateCampaign(campaign.id); setValidation(result); setTab("preview") }
    async function send() {
        try { await sendCampaign(campaign.id); toast.success("Campaign sent"); setCampaign({ ...campaign, status: "completed" }) } catch (error) { toast.error(error instanceof Error ? error.message : "Campaign could not be sent") }
    }
    async function saveSchedule() {
        if (!scheduleDate || !scheduleTime) return toast.error("Choose both a date and time.")
        setScheduleBusy(true)
        try {
            const result = await scheduleCampaign(campaign.id, new Date(`${scheduleDate}T${scheduleTime}`).toISOString())
            setCampaign(current => ({ ...current, status: "scheduled", scheduledAt: new Date(result.scheduledAt) }))
            toast.success("Campaign scheduled")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not schedule campaign")
        } finally {
            setScheduleBusy(false)
        }
    }
    async function cancelSchedule() {
        setScheduleBusy(true)
        try {
            await cancelScheduledCampaign(campaign.id)
            setCampaign(current => ({ ...current, status: "draft", scheduledAt: null }))
            setScheduleDate("")
            setScheduleTime("")
            toast.success("Schedule cancelled")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not cancel schedule")
        } finally {
            setScheduleBusy(false)
        }
    }
    return <div className="space-y-5">
        <div className="flex items-start gap-3"><Button variant="ghost" size="icon" asChild><Link href="/dashboard/campaigns"><ArrowLeft /></Link></Button><div className="min-w-0 flex-1"><h1 className="truncate text-2xl font-bold">{campaign.name}</h1><p className="text-sm text-muted-foreground">{campaign.rows.length} / 100 recipients · <span className="capitalize">{campaign.status.replace("_", " ")}</span>{saving && " · Saving..."}</p></div><Button variant="outline" onClick={runValidation}><Save /> Validate</Button><Button onClick={send} disabled={campaign.status === "sending" || campaign.status === "scheduled"}><Send /> {campaign.status === "scheduled" ? "Scheduled" : "Send Campaign"}</Button></div>
        <Tabs value={tab} onValueChange={setTab}>
            <TabsList><TabsTrigger value="data">Data</TabsTrigger><TabsTrigger value="mail">Mail</TabsTrigger><TabsTrigger value="preview">Preview</TabsTrigger><TabsTrigger value="schedule">Schedule</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger></TabsList>
            <TabsContent value="data" className="mt-5 space-y-4">
                <div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" onClick={addRow}><Plus /> Add Row</Button><Button size="sm" variant="outline" onClick={addColumn}><Plus /> Add Column</Button><label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm hover:bg-accent"><Upload className="h-4 w-4" /> Import CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={event => event.target.files?.[0] && importCsv(event.target.files[0])} /></label><span className="ml-auto text-sm text-muted-foreground">Email is required for every row.</span></div>
                <div className="overflow-auto rounded-lg border"><table className="w-full min-w-[700px] text-sm"><thead className="bg-muted/50"><tr>{campaign.columns.map((column, index) => <th key={column.id} className="min-w-[160px] border-b p-2 text-left font-medium"><div className="flex items-center gap-1"><Input className="h-8 font-medium" value={column.displayName} onChange={event => { const columns = campaign.columns.map((item, i) => i === index ? { ...item, displayName: event.target.value } : item); setCampaign({ ...campaign, columns }); saveData(columns, campaign.rows) }} /><Button variant="ghost" size="icon-sm" onClick={() => deleteColumn(index)}><Trash2 className="h-3.5 w-3.5" /></Button></div><div className="px-2 pt-1 text-[10px] font-normal text-muted-foreground">{`{{${column.variableKey}}}`}</div></th>)}<th className="w-10 border-b" /></tr></thead><tbody>{campaign.rows.map((row, rowIndex) => <tr key={row.id} className="border-b last:border-0">{campaign.columns.map(column => <td key={column.id} className="p-2"><Input value={row.data[column.variableKey] || ""} onChange={event => updateCell(rowIndex, column.variableKey, event.target.value)} /></td>)}<td className="p-2"><Button variant="ghost" size="icon-sm" onClick={() => deleteRow(rowIndex)}><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody></table></div>
            </TabsContent>
            <TabsContent value="mail" className="mt-5 space-y-4">
                <div className="grid gap-4 rounded-lg border p-4"><label className="space-y-1 text-sm font-medium">From<select className="mt-1 h-9 w-full rounded-md border bg-background px-3 font-normal" value={campaign.senderIdentityId || ""} onChange={event => updateMail({ senderIdentityId: event.target.value || null })}><option value="">Choose an authorized sender</option>{identities.map(identity => <option key={identity.id} value={identity.id}>{identity.displayName} &lt;{identity.emailAddress}&gt;</option>)}</select></label><label className="space-y-1 text-sm font-medium">Subject<Input value={campaign.subjectTemplate} onChange={event => updateMail({ subjectTemplate: event.target.value })} placeholder="Congratulations {{first_name}}" /></label>                                                <div className="rounded-md border"><TiptapEditor value={campaign.htmlTemplate} insertText={variableToInsert} onChange={htmlTemplate => updateMail({ htmlTemplate })} onEditorReady={editor => { editorRef.current = editor }} /></div><div className="flex flex-wrap gap-2">{campaign.columns.map(column => <Button key={column.id} size="sm" variant="outline" onClick={() => setVariableToInsert({ text: `{{${column.variableKey}}}`, id: Date.now() })}>Insert {column.displayName}</Button>)}</div></div>
                <p className="text-xs text-muted-foreground">Use the copied variable in the subject or editor. Variables used: {usedVariables.length ? usedVariables.map(key => `{{${key}}}`).join(", ") : "none"}.</p>
            </TabsContent>
            <TabsContent value="preview" className="mt-5 space-y-4">
                <div className="flex items-center gap-2"><Button variant="outline" size="icon" disabled={previewIndex === 0} onClick={() => setPreviewIndex(index => index - 1)}><ChevronLeft /></Button><span className="text-sm">Preview as {selectedRow?.data.email || "recipient"} · {campaign.rows.length ? previewIndex + 1 : 0} / {campaign.rows.length}</span><Button variant="outline" size="icon" disabled={previewIndex >= campaign.rows.length - 1} onClick={() => setPreviewIndex(index => index + 1)}><ChevronRight /></Button><Button className="ml-auto" variant="outline" disabled={!selectedRow} onClick={async () => { try { await sendTestCampaign(campaign.id, selectedRow!.id); toast.success("Test email sent to your account") } catch (error) { toast.error(error instanceof Error ? error.message : "Test email failed") } }}><Send /> Send Test Email</Button></div>
                <div className="rounded-lg border bg-white p-6 text-black"><div className="mb-5 border-b pb-4"><div className="text-xs text-gray-500">Subject</div><div className="font-semibold">{renderedSubject || "No subject"}</div></div><iframe title="Personalised email preview" srcDoc={renderedHtml} className="min-h-[320px] w-full border-0" sandbox="" /></div>
                {validation && <div className={`rounded-lg border p-4 ${validation.valid ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-900"}`}><div className="font-medium">{validation.valid ? "Campaign ready to send" : "Campaign cannot be sent"}</div>{validation.errors.length > 0 && <ul className="mt-2 list-disc pl-5 text-sm">{validation.errors.map(error => <li key={error}>{error}</li>)}</ul>}</div>}
            </TabsContent>
            <TabsContent value="schedule" className="mt-5 space-y-5">
                <div className="rounded-xl border bg-card p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex-1"><h2 className="font-semibold">Schedule campaign delivery</h2><p className="mt-1 text-sm text-muted-foreground">Choose a date and time. Your local time zone will be used.</p></div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${campaign.status === "scheduled" ? "bg-blue-100 text-blue-800" : "bg-muted text-muted-foreground"}`}>{campaign.status === "scheduled" ? "Scheduled" : "Not scheduled"}</span>
                    </div>
                    <div className="mt-5 grid max-w-xl gap-4 sm:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium">Date<Input type="date" min={minimumDate} value={scheduleDate} onChange={event => setScheduleDate(event.target.value)} disabled={scheduleBusy || campaign.status === "completed"} /></label>
                        <label className="space-y-2 text-sm font-medium">Time<Input type="time" value={scheduleTime} onChange={event => setScheduleTime(event.target.value)} disabled={scheduleBusy || campaign.status === "completed"} /></label>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                        <Button onClick={saveSchedule} disabled={scheduleBusy || campaign.status === "completed"}>{scheduleBusy ? "Saving..." : campaign.status === "scheduled" ? "Update schedule" : "Schedule campaign"}</Button>
                        {campaign.status === "scheduled" && <Button variant="outline" onClick={cancelSchedule} disabled={scheduleBusy}>Cancel schedule</Button>}
                    </div>
                </div>
                {campaign.status === "scheduled" && campaign.scheduledAt && <div className="overflow-hidden rounded-xl border border-blue-200 bg-blue-50 text-blue-950"><div className="border-b border-blue-200 px-5 py-4"><p className="text-sm font-semibold">Scheduled delivery</p><p className="mt-1 text-xs text-blue-800">This entry is also available from the main Scheduled page.</p></div><div className="overflow-auto"><table className="w-full min-w-[620px] text-sm"><thead className="border-b border-blue-200 text-left text-xs text-blue-800"><tr><th className="px-5 py-3">Campaign</th><th className="px-5 py-3">Recipients</th><th className="px-5 py-3">Scheduled for</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr></thead><tbody><tr><td className="px-5 py-4 font-medium">{campaign.name}</td><td className="px-5 py-4">{campaign.rows.length}</td><td className="whitespace-nowrap px-5 py-4">{scheduleDate} {scheduleTime}</td><td className="px-5 py-4 font-medium">Scheduled</td><td className="px-5 py-4"><Button size="sm" variant="outline" onClick={cancelSchedule} disabled={scheduleBusy}>Cancel</Button></td></tr></tbody></table></div></div>}
            </TabsContent>
            <TabsContent value="activity" className="mt-5 overflow-hidden rounded-lg border"><div className="border-b p-4 font-semibold">Recipient activity</div><div className="overflow-auto"><table className="w-full min-w-[620px] text-sm"><thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="p-3">Recipient</th>{campaign.columns.filter(column => column.variableKey !== "email").map(column => <th key={column.id} className="p-3">{column.displayName}</th>)}<th className="p-3">Status</th><th className="p-3">Sent at</th></tr></thead><tbody>{campaign.rows.map(row => <tr key={row.id} className="border-t"><td className="p-3 font-medium">{row.data.email || "No email"}</td>{campaign.columns.filter(column => column.variableKey !== "email").map(column => <td key={column.id} className="max-w-[180px] truncate p-3">{row.data[column.variableKey] || "—"}</td>)}<td className="p-3 capitalize text-muted-foreground">{row.error || row.status}</td><td className="whitespace-nowrap p-3 text-muted-foreground">{row.sentAt ? row.sentAt.toISOString().replace("T", " ").slice(0, 16) : "—"}</td></tr>)}</tbody></table></div></TabsContent>
        </Tabs>
    </div>
}
