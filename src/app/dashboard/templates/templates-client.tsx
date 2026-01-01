"use client"

import { useState, useEffect } from "react"
import { MoreVertical, Pencil, Trash2, Plus, Eye, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from "@/app/actions/templates"
import { useRouter } from "next/navigation"

interface Template {
    id: string
    name: string
    description: string | null
    htmlContent: string
    createdAt: Date
    createdBy: {
        name: string | null
        email: string
    }
}

interface TemplatesClientProps {
    isAdmin: boolean
}

export function TemplatesClient({ isAdmin }: TemplatesClientProps) {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
    const [editTemplate, setEditTemplate] = useState<Template | null>(null)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        loadTemplates()
    }, [])

    async function loadTemplates() {
        setLoading(true)
        const result = await getTemplates()
        if (result.templates) {
            setTemplates(result.templates)
        }
        setLoading(false)
    }

    async function handleCreate(formData: FormData) {
        const result = await createTemplate(formData)
        if (result.success) {
            toast.success("Template created successfully")
            setIsCreateOpen(false)
            loadTemplates()
        } else {
            toast.error(result.error || "Failed to create template")
        }
    }

    async function handleUpdate(id: string, formData: FormData) {
        const result = await updateTemplate(id, formData)
        if (result.success) {
            toast.success("Template updated successfully")
            setEditTemplate(null)
            loadTemplates()
        } else {
            toast.error(result.error || "Failed to update template")
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this template?")) return
        const result = await deleteTemplate(id)
        if (result.success) {
            toast.success("Template deleted successfully")
            loadTemplates()
        } else {
            toast.error(result.error || "Failed to delete template")
        }
    }

    function handleUseTemplate(template: Template) {
        // Navigate to compose with template
        router.push(`/dashboard/compose?templateId=${template.id}`)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {isAdmin ? "Create and manage email templates" : "Browse and use email templates"}
                    </p>
                </div>
                {isAdmin && (
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Template
                    </Button>
                )}
            </div>

            {/* Templates Grid */}
            {templates.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                    <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
                    <p className="text-gray-500 text-sm mb-4">
                        {isAdmin ? "Create your first email template to get started" : "No templates available yet"}
                    </p>
                    {isAdmin && (
                        <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Template
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        >
                            {/* Preview Thumbnail */}
                            <div
                                className="h-40 bg-gray-100 overflow-hidden relative"
                                onClick={() => setPreviewTemplate(template)}
                            >
                                <iframe
                                    srcDoc={template.htmlContent}
                                    className="w-full h-full pointer-events-none transform scale-50 origin-top-left"
                                    style={{ width: '200%', height: '200%' }}
                                    title={template.name}
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20 group-hover:bg-black/10 transition-colors" />
                            </div>

                            {/* Template Info */}
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0" onClick={() => setPreviewTemplate(template)}>
                                        <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                                        {template.description && (
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-2">
                                            By {template.createdBy.name || template.createdBy.email}
                                        </p>
                                    </div>
                                    {isAdmin && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditTemplate(template)}>
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(template.id)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Preview Modal */}
            <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{previewTemplate?.name}</DialogTitle>
                        {previewTemplate?.description && (
                            <DialogDescription>{previewTemplate.description}</DialogDescription>
                        )}
                    </DialogHeader>
                    <div className="flex-1 overflow-auto bg-gray-100 rounded-lg p-4 -mx-2">
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <iframe
                                srcDoc={previewTemplate?.htmlContent}
                                className="w-full border-0"
                                style={{ minHeight: '500px' }}
                                title="Template Preview"
                                onLoad={(e) => {
                                    const iframe = e.target as HTMLIFrameElement
                                    if (iframe.contentDocument?.body) {
                                        const height = iframe.contentDocument.body.scrollHeight
                                        iframe.style.height = `${Math.max(500, height + 40)}px`
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                            Close
                        </Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                                if (previewTemplate) {
                                    handleUseTemplate(previewTemplate)
                                }
                            }}
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Use Template
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create/Edit Modal */}
            <Dialog open={isCreateOpen || !!editTemplate} onOpenChange={(open) => {
                if (!open) {
                    setIsCreateOpen(false)
                    setEditTemplate(null)
                }
            }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
                        <DialogDescription>
                            {editTemplate ? "Update the template details below" : "Create a new email template"}
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        action={(formData) => {
                            if (editTemplate) {
                                handleUpdate(editTemplate.id, formData)
                            } else {
                                handleCreate(formData)
                            }
                        }}
                        className="flex-1 overflow-auto space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="name">Template Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g., Welcome Email"
                                defaultValue={editTemplate?.name || ""}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                name="description"
                                placeholder="Brief description of this template"
                                defaultValue={editTemplate?.description || ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="htmlContent">HTML Content *</Label>
                            <Textarea
                                id="htmlContent"
                                name="htmlContent"
                                placeholder="Paste your HTML email template here..."
                                className="min-h-[300px] font-mono text-sm"
                                defaultValue={editTemplate?.htmlContent || ""}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsCreateOpen(false)
                                    setEditTemplate(null)
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                {editTemplate ? "Save Changes" : "Create Template"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
    )
}
