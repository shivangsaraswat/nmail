"use client"

import { useActionState, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sendEmailAction, type EmailState } from "@/app/actions/email"
import { CSVUploadButton } from "@/components/csv-upload-button"
import { TiptapEditor } from "@/components/tiptap-editor"
import { HtmlEditorModal } from "@/components/html-editor-modal"
import { GmailColorPicker } from "@/components/gmail-color-picker"
import { GmailFontSizePicker } from "@/components/gmail-font-size-picker"
import { toast } from "sonner"
import { Loader2, Code, ChevronDown, Upload, Trash2, Smile, Image as ImageIcon, Lock as LockClock, Link as LinkIcon, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Undo, Redo, Strikethrough, Quote, Paperclip, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SenderIdentity {
    id: string
    displayName: string
    emailAddress: string
}

interface ComposeFormProps {
    allowedIdentities: SenderIdentity[]
}

const initialState: EmailState = {
    success: false,
    message: "",
    error: ""
}

export function ComposeForm({ allowedIdentities }: ComposeFormProps) {
    const [state, formAction, isPending] = useActionState(sendEmailAction, initialState)

    // Form state
    const [selectedIdentity, setSelectedIdentity] = useState(allowedIdentities[0]?.id || "")
    const [to, setTo] = useState("")
    const [cc, setCc] = useState("")
    const [bcc, setBcc] = useState("")
    const [subject, setSubject] = useState("")
    const [htmlContent, setHtmlContent] = useState("")

    // UI state
    const [showCc, setShowCc] = useState(false)
    const [showBcc, setShowBcc] = useState(false)
    const [showFromDropdown, setShowFromDropdown] = useState(false)
    const [htmlModalOpen, setHtmlModalOpen] = useState(false)
    const [editor, setEditor] = useState<any>(null)
    const [showFormattingToolbar, setShowFormattingToolbar] = useState(false)
    const [attachments, setAttachments] = useState<File[]>([])
    const [isHtmlMode, setIsHtmlMode] = useState(false) // When true, shows iframe preview instead of Tiptap

    useEffect(() => {
        if (state?.success) {
            toast.success("Email Sent Successfully", {
                description: "Your message has been dispatched.",
            })
            // Reset form
            setTo("")
            setCc("")
            setBcc("")
            setSubject("")
            setHtmlContent("")
            setShowCc(false)
            setShowBcc(false)
            setAttachments([])
            setIsHtmlMode(false)
        } else if (state?.error) {
            toast.error("Failed to Send", {
                description: state.error,
            })
        }
    }, [state])

    const handleToCSVImport = (emails: string[]) => {
        const currentEmails = to.split(",").map(e => e.trim()).filter(e => e)
        const combined = [...new Set([...currentEmails, ...emails])]
        setTo(combined.join(", "))
    }

    const handleCcCSVImport = (emails: string[]) => {
        const currentEmails = cc.split(",").map(e => e.trim()).filter(e => e)
        const combined = [...new Set([...currentEmails, ...emails])]
        setCc(combined.join(", "))
    }

    const handleBccCSVImport = (emails: string[]) => {
        const currentEmails = bcc.split(",").map(e => e.trim()).filter(e => e)
        const combined = [...new Set([...currentEmails, ...emails])]
        setBcc(combined.join(", "))
    }

    const handleHtmlInsert = (html: string) => {
        // Set the HTML content state (this is what gets sent in the email)
        setHtmlContent(html)

        // Check if this is complex HTML (with style tags, DOCTYPE, or full HTML structure)
        const isComplexHtml = html.includes('<style') ||
            html.includes('<!DOCTYPE') ||
            html.includes('<html') ||
            html.includes('<head')

        if (isComplexHtml) {
            // Enable HTML preview mode - show iframe instead of Tiptap
            setIsHtmlMode(true)
        } else {
            // Simple HTML - update the Tiptap editor
            setIsHtmlMode(false)
            if (editor) {
                editor.commands.setContent(html)
            }
        }
    }

    const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files) {
            setAttachments(prev => [...prev, ...Array.from(files)])
        }
        e.target.value = ''
    }

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index))
    }

    const selectedIdentityData = allowedIdentities.find(i => i.id === selectedIdentity)

    return (
        <>
            <form action={formAction} className="flex flex-col h-full bg-white rounded-t-lg shadow-xl overflow-hidden border border-gray-200">
                {/* Gmail-style Window Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#F2F6FC] border-b border-gray-200 cursor-move">
                    <span className="text-sm font-medium text-gray-700">New Message</span>
                </div>

                {/* Form Fields Area */}
                <div className="px-4">
                    {/* From Row */}
                    <div className="flex items-center h-10 border-b border-gray-200 group">
                        <span className="text-sm text-gray-500 w-[50px] flex-shrink-0">From</span>
                        <div className="flex-1">
                            <Select name="senderIdentityId" value={selectedIdentity} onValueChange={setSelectedIdentity} required>
                                <SelectTrigger className="w-full border-0 shadow-none h-auto p-0 text-sm focus:ring-0 hover:bg-transparent data-[placeholder]:text-muted-foreground">
                                    <div className="flex items-center gap-1 text-gray-800">
                                        <SelectValue placeholder="Select Sender Identity" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {allowedIdentities.map((identity) => (
                                        <SelectItem key={identity.id} value={identity.id}>
                                            <span className="font-medium text-gray-900">{identity.displayName}</span>
                                            <span className="text-gray-500 ml-1">&lt;{identity.emailAddress}&gt;</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* To Row */}
                    <div className="flex items-center h-10 border-b border-gray-200 group relative">
                        <span className="text-sm text-gray-500 w-[50px] flex-shrink-0 group-focus-within:text-gray-800 transition-colors">To</span>
                        <div className="flex-1 flex items-center">
                            <Input
                                id="to"
                                name="to"
                                placeholder=""
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                required
                                className="border-0 shadow-none h-6 p-0 text-sm focus-visible:ring-0 placeholder:text-gray-500 caret-blue-600"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            {!showCc && <span onClick={() => setShowCc(true)} className="cursor-pointer hover:underline hover:text-gray-800">Cc</span>}
                            {!showBcc && <span onClick={() => setShowBcc(true)} className="cursor-pointer hover:underline hover:text-gray-800">Bcc</span>}
                            <CSVUploadButton onEmailsExtracted={handleToCSVImport} />
                        </div>
                    </div>

                    {/* Cc Row */}
                    {showCc && (
                        <div className="flex items-center py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-500 w-[40px] flex-shrink-0">Cc</span>
                            <div className="flex-1">
                                <Input
                                    id="cc"
                                    name="cc"
                                    value={cc}
                                    onChange={(e) => setCc(e.target.value)}
                                    className="border-0 shadow-none h-auto p-0 text-sm focus-visible:ring-0"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    {/* Bcc Row */}
                    {showBcc && (
                        <div className="flex items-center py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-500 w-[40px] flex-shrink-0">Bcc</span>
                            <div className="flex-1">
                                <Input
                                    id="bcc"
                                    name="bcc"
                                    value={bcc}
                                    onChange={(e) => setBcc(e.target.value)}
                                    className="border-0 shadow-none h-auto p-0 text-sm focus-visible:ring-0"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    {/* Subject Row */}
                    <div className="flex items-center h-10 border-b border-gray-200">
                        <Input
                            id="subject"
                            name="subject"
                            placeholder="Subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                            className="border-0 shadow-none h-6 p-0 text-sm focus-visible:ring-0 placeholder:text-gray-500 font-normal caret-blue-600"
                        />
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 px-4 py-2 overflow-y-auto min-h-[300px]">
                    {isHtmlMode ? (
                        /* HTML Preview Mode - shows exact preview of complex HTML */
                        <div className="h-full">
                            <div className="flex items-center justify-between mb-2 px-2">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Code className="h-3 w-3" />
                                    HTML Preview Mode
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsHtmlMode(false)
                                        setHtmlContent('')
                                        if (editor) {
                                            editor.commands.setContent('')
                                        }
                                    }}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    Switch to Editor
                                </button>
                            </div>
                            <iframe
                                srcDoc={htmlContent}
                                className="w-full border border-gray-200 rounded-lg bg-white"
                                title="Email Preview"
                                sandbox="allow-same-origin"
                                style={{ minHeight: '400px' }}
                                onLoad={(e) => {
                                    const iframe = e.target as HTMLIFrameElement
                                    if (iframe.contentDocument?.body) {
                                        const height = iframe.contentDocument.body.scrollHeight
                                        iframe.style.height = `${Math.max(400, height + 40)}px`
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        /* Regular Tiptap Editor */
                        <TiptapEditor value={htmlContent} onChange={setHtmlContent} onEditorReady={setEditor} />
                    )}
                    <input type="hidden" name="html" value={htmlContent} />
                </div>

                {/* Persistent Formatting Toolbar */}
                {editor && !isHtmlMode && (
                    <div className="mx-4 mb-2 p-1.5 flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                        {/* Font Family */}
                        <Select
                            defaultValue="sans-serif"
                            onValueChange={(value) => {
                                editor.chain().focus().setFontFamily(value).run()
                            }}
                        >
                            <SelectTrigger className="w-[100px] h-7 border-none shadow-none text-xs focus:ring-0 p-1 hover:bg-gray-100 rounded bg-transparent">
                                <SelectValue placeholder="Sans Serif" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sans-serif">Sans Serif</SelectItem>
                                <SelectItem value="serif">Serif</SelectItem>
                                <SelectItem value="monospace">Monospace</SelectItem>
                                <SelectItem value="Georgia, serif">Georgia</SelectItem>
                                <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                                <SelectItem value="'Comic Sans MS', cursive">Comic Sans</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Font Size */}
                        <GmailFontSizePicker
                            onSizeChange={(size) => {
                                editor.chain().focus().setFontSize(size).run()
                            }}
                        />

                        <div className="w-px h-5 bg-gray-300"></div>

                        {/* Text Color */}
                        <GmailColorPicker
                            onTextColorChange={(color) => {
                                editor.chain().focus().setColor(color).run()
                            }}
                            onBackgroundColorChange={(color) => {
                                editor.chain().focus().toggleHighlight({ color }).run()
                            }}
                        />

                        <div className="w-px h-5 bg-gray-300"></div>

                        {/* Basic Formatting */}
                        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={cn("p-1.5 hover:bg-gray-100 rounded text-gray-600", editor.isActive('bold') && "bg-gray-200")} title="Bold"><Bold className="h-4 w-4" /></button>
                        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={cn("p-1.5 hover:bg-gray-100 rounded text-gray-600", editor.isActive('italic') && "bg-gray-200")} title="Italic"><Italic className="h-4 w-4" /></button>
                        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={cn("p-1.5 hover:bg-gray-100 rounded text-gray-600", editor.isActive('underline') && "bg-gray-200")} title="Underline"><Underline className="h-4 w-4" /></button>

                        <div className="w-px h-5 bg-gray-300"></div>

                        {/* Lists */}
                        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={cn("p-1.5 hover:bg-gray-100 rounded text-gray-600", editor.isActive('bulletList') && "bg-gray-200")} title="Bullet list"><List className="h-4 w-4" /></button>
                        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={cn("p-1.5 hover:bg-gray-100 rounded text-gray-600", editor.isActive('orderedList') && "bg-gray-200")} title="Numbered list"><ListOrdered className="h-4 w-4" /></button>
                        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={cn("p-1.5 hover:bg-gray-100 rounded text-gray-600", editor.isActive('blockquote') && "bg-gray-200")} title="Quote"><Quote className="h-4 w-4" /></button>
                        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={cn("p-1.5 hover:bg-gray-100 rounded text-gray-600", editor.isActive('strike') && "bg-gray-200")} title="Strikethrough"><Strikethrough className="h-4 w-4" /></button>

                        <div className="w-px h-5 bg-gray-300"></div>

                        {/* Undo/Redo */}
                        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-30" title="Undo"><Undo className="h-4 w-4" /></button>
                        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-30" title="Redo"><Redo className="h-4 w-4" /></button>
                    </div>
                )}

                {/* Attachments Display */}
                {attachments.length > 0 && (
                    <div className="mx-4 mb-2 flex flex-wrap gap-2">
                        {attachments.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 text-sm">
                                <Paperclip className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-700 max-w-[150px] truncate">{file.name}</span>
                                <span className="text-gray-400 text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                                <button
                                    type="button"
                                    onClick={() => removeAttachment(index)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {/* Hidden inputs for attachments - each file needs its own input */}
                {attachments.map((file, index) => {
                    // Create a DataTransfer to set files on input
                    const dataTransfer = new DataTransfer()
                    dataTransfer.items.add(file)
                    return (
                        <input
                            key={`attachment-${index}`}
                            type="file"
                            name="attachments"
                            className="hidden"
                            ref={(input) => {
                                if (input) {
                                    input.files = dataTransfer.files
                                }
                            }}
                        />
                    )
                })}

                {/* Footer Toolbar */}
                <div className="px-4 py-3 flex items-center justify-between sticky bottom-0 bg-white/95 backdrop-blur z-10 transition-all">
                    <div className="flex items-center gap-2">
                        {/* Send Button Group */}
                        <div className="flex items-center rounded-full bg-[#0B57D0] hover:bg-[#0b57d0]/90 transition-colors text-white h-9 group shadow-sm hover:shadow">
                            <Button
                                type="submit"
                                disabled={isPending || allowedIdentities.length === 0}
                                className="bg-transparent hover:bg-transparent border-0 h-full rounded-l-full pl-6 pr-4 font-medium text-sm shadow-none"
                            >
                                {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                                {isPending ? "Sending..." : "Send"}
                            </Button>
                            <div className="h-full w-px bg-blue-700/50"></div>
                            <Button type="button" size="sm" className="bg-transparent hover:bg-transparent border-0 h-full rounded-r-full px-2 shadow-none">
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Formatting Toggle */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-black bg-gray-100 rounded ml-2 hover:bg-gray-200"
                            title="Formatting options"
                        >
                            <span className="font-serif underline text-lg font-medium">A</span>
                        </Button>

                        {/* Attachment Icons */}
                        <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 w-10 text-gray-600 hover:bg-gray-100">
                            <Paperclip className="h-5 w-5" />
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.xls,.xlsx"
                                multiple
                                onChange={handleFileAttachment}
                            />
                        </label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-gray-600 hover:bg-gray-100 rounded"
                            title="Insert link"
                            onClick={() => {
                                if (!editor) return;
                                const previousUrl = editor.getAttributes('link').href
                                const url = window.prompt('URL', previousUrl)
                                if (url === null) return
                                if (url === '') {
                                    editor.chain().focus().extendMarkRange('link').unsetLink().run()
                                    return
                                }
                                editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
                            }}
                        >
                            <LinkIcon className="h-5 w-5" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-100 rounded" title="Insert emoji">
                            <Smile className="h-5 w-5" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-100 rounded" title="Insert files using Drive">
                            <img src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" className="h-5 w-5 opacity-70 grayscale hover:grayscale-0 transition-all" alt="Drive" />
                        </Button>

                        {/* Image Upload */}
                        <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 text-gray-600 hover:bg-gray-100">
                            <ImageIcon className="h-5 w-5" />
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file && editor) {
                                        const reader = new FileReader()
                                        reader.onload = (event) => {
                                            const src = event.target?.result as string
                                            editor.chain().focus().setImage({ src }).run()
                                        }
                                        reader.readAsDataURL(file)
                                    }
                                    // Reset input
                                    e.target.value = ''
                                }}
                            />
                        </label>
                        <Button type="button" variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-100 rounded" title="Toggle confidential mode">
                            <LockClock className="h-5 w-5" />
                        </Button>

                        {/* HTML Editor Button */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setHtmlModalOpen(true)}
                            className="text-gray-600 hover:bg-gray-100 rounded"
                            title="Edit HTML"
                        >
                            <Code className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-gray-500 hover:bg-gray-100 rounded hover:text-red-600"
                            title="Discard draft"
                            onClick={() => {
                                setHtmlContent('')
                                setIsHtmlMode(false)
                                setAttachments([])
                                setSubject('')
                                setTo('')
                                setCc('')
                                setBcc('')
                                if (editor) {
                                    editor.commands.setContent('')
                                }
                            }}
                        >
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </form >

            {/* HTML Editor Modal */}
            < HtmlEditorModal
                open={htmlModalOpen}
                onOpenChange={setHtmlModalOpen}
                initialHtml={htmlContent}
                onInsert={handleHtmlInsert}
            />
        </>
    )
}
