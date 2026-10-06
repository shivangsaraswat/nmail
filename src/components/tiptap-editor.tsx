"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import type { Editor } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import Image from "@tiptap/extension-image"
import { TextStyle } from "@tiptap/extension-text-style"
import FontFamily from "@tiptap/extension-font-family"
import { Color } from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import TextAlign from "@tiptap/extension-text-align"
import { FontSize } from "@/lib/tiptap-font-size"
import {
    AlignCenter, AlignLeft, AlignRight, Bold, Check, Code2, Highlighter,
    Image as ImageIcon, Italic, Link as LinkIcon, List, ListOrdered,
    Minus, Palette, Redo2, RemoveFormatting, Strikethrough, Underline as UnderlineIcon,
    Undo2,
} from "lucide-react"
import { useEffect, useState } from "react"

interface TiptapEditorProps {
    value: string
    onChange: (value: string) => void
    onEditorReady?: (editor: Editor) => void
    minHeight?: string
    insertText?: { text: string; id: number }
}

const FONT_FAMILIES = [
    { label: "Default", value: "" },
    { label: "Arial", value: "Arial" },
    { label: "Georgia", value: "Georgia" },
    { label: "Helvetica", value: "Helvetica" },
    { label: "Tahoma", value: "Tahoma" },
    { label: "Times New Roman", value: "Times New Roman" },
    { label: "Trebuchet MS", value: "Trebuchet MS" },
    { label: "Verdana", value: "Verdana" },
]

const FONT_SIZES = [
    { label: "Small", value: "13px" },
    { label: "Normal", value: "16px" },
    { label: "Large", value: "20px" },
    { label: "Huge", value: "28px" },
]

const COLORS = [
    "#111827", "#4b5563", "#9ca3af", "#ffffff",
    "#dc2626", "#ea580c", "#ca8a04", "#16a34a",
    "#0891b2", "#2563eb", "#7c3aed", "#db2777",
    "#fecaca", "#fed7aa", "#fef08a", "#bbf7d0",
    "#bae6fd", "#c7d2fe", "#ddd6fe", "#fbcfe8",
]

function ToolButton({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode }) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${active ? "bg-accent text-foreground" : ""}`}
        >
            {children}
        </button>
    )
}

function ColorMenu({ label, icon, onSelect }: { label: string; icon: React.ReactNode; onSelect: (color: string) => void }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="relative">
            <ToolButton label={label} onClick={() => setOpen(value => !value)}>{icon}</ToolButton>
            {open && (
                <div className="absolute left-0 top-9 z-30 grid w-40 grid-cols-4 gap-1 rounded-lg border bg-popover p-2 shadow-xl">
                    {COLORS.map(color => (
                        <button
                            key={color}
                            type="button"
                            aria-label={`${label}: ${color}`}
                            title={color}
                            className="h-7 w-7 rounded border border-black/10 transition-transform hover:scale-110"
                            style={{ backgroundColor: color }}
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => { onSelect(color); setOpen(false) }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export function TiptapEditor({ value, onChange, onEditorReady, minHeight = "220px", insertText }: TiptapEditorProps) {
    const [sourceMode, setSourceMode] = useState(false)
    const [sourceValue, setSourceValue] = useState(value)
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-blue-600 underline" } }),
            Underline,
            Image.configure({ inline: true, allowBase64: true }),
            TextStyle,
            FontFamily.configure({ types: ["textStyle"] }),
            Color.configure({ types: ["textStyle"] }),
            Highlight.configure({ multicolor: true }),
            FontSize.configure({ types: ["textStyle"] }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: "w-full rounded-b-md bg-background px-4 py-3 text-sm leading-6 focus:outline-none [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
            },
            transformPastedHTML: html => html,
        },
        onUpdate: ({ editor: nextEditor }) => {
            const html = nextEditor.getHTML()
            setSourceValue(html)
            onChange(html)
        },
        onCreate: ({ editor: createdEditor }) => onEditorReady?.(createdEditor),
    })

    useEffect(() => {
        if (!editor || sourceMode || value === editor.getHTML()) return
        editor.commands.setContent(value, { emitUpdate: false })
        setSourceValue(value)
    }, [editor, sourceMode, value])

    useEffect(() => {
        if (!editor || !insertText) return
        if (sourceMode) updateSource(`${sourceValue}${insertText.text}`)
        else editor.chain().focus().insertContent(insertText.text).run()
        // insertText is an event-like prop; the parent changes it for each insertion.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [insertText])

    function updateSource(nextValue: string) {
        setSourceValue(nextValue)
        onChange(nextValue)
    }

    function toggleSourceMode() {
        if (!sourceMode) {
            setSourceValue(editor?.getHTML() || value)
        } else if (editor) {
            editor.commands.setContent(sourceValue, { emitUpdate: false })
            onChange(sourceValue)
        }
        setSourceMode(mode => !mode)
    }

    function insertLink() {
        if (!editor) return
        const href = window.prompt("Enter the link URL")
        if (href === null) return
        if (!href.trim()) editor.chain().focus().unsetLink().run()
        else editor.chain().focus().setLink({ href: href.trim() }).run()
    }

    function insertImage() {
        if (!editor) return
        const src = window.prompt("Enter an image URL")
        if (src?.trim()) editor.chain().focus().setImage({ src: src.trim(), alt: "Email image" }).run()
    }

    if (!editor) return <div className="min-h-[220px] animate-pulse rounded-md bg-muted/30" />

    return (
        <div className="overflow-visible rounded-md border bg-background">
            <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1.5">
                <select
                    aria-label="Text style"
                    className="h-8 max-w-28 rounded border bg-background px-2 text-xs"
                    defaultValue="paragraph"
                    onChange={event => {
                        const type = event.target.value
                        if (type === "paragraph") editor.chain().focus().setParagraph().run()
                        else editor.chain().focus().toggleHeading({ level: Number(type.replace("heading", "")) as 1 | 2 | 3 }).run()
                    }}
                >
                    <option value="paragraph">Paragraph</option>
                    <option value="heading1">Heading 1</option>
                    <option value="heading2">Heading 2</option>
                    <option value="heading3">Heading 3</option>
                </select>
                <select
                    aria-label="Font family"
                    className="h-8 max-w-36 rounded border bg-background px-2 text-xs"
                    defaultValue=""
                    onChange={event => {
                        const family = event.target.value
                        if (family) editor.chain().focus().setFontFamily(family).run()
                        else editor.chain().focus().unsetFontFamily().run()
                    }}
                >
                    {FONT_FAMILIES.map(font => <option key={font.label} value={font.value} style={{ fontFamily: font.value || undefined }}>{font.label}</option>)}
                </select>
                <select
                    aria-label="Font size"
                    className="h-8 w-24 rounded border bg-background px-2 text-xs"
                    defaultValue="16px"
                    onChange={event => editor.chain().focus().setFontSize(event.target.value).run()}
                >
                    {FONT_SIZES.map(size => <option key={size.value} value={size.value}>{size.label}</option>)}
                </select>
                <span className="mx-1 h-5 w-px bg-border" />
                <ToolButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></ToolButton>
                <ToolButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></ToolButton>
                <ToolButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></ToolButton>
                <ToolButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></ToolButton>
                <ColorMenu label="Text color" icon={<Palette className="h-4 w-4" />} onSelect={color => editor.chain().focus().setColor(color).run()} />
                <ColorMenu label="Highlight color" icon={<Highlighter className="h-4 w-4" />} onSelect={color => editor.chain().focus().toggleHighlight({ color }).run()} />
                <span className="mx-1 h-5 w-px bg-border" />
                <ToolButton label="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="h-4 w-4" /></ToolButton>
                <ToolButton label="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="h-4 w-4" /></ToolButton>
                <ToolButton label="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="h-4 w-4" /></ToolButton>
                <ToolButton label="Bulleted list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></ToolButton>
                <ToolButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></ToolButton>
                <ToolButton label="Block quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Minus className="h-4 w-4" /></ToolButton>
                <ToolButton label="Insert link" active={editor.isActive("link")} onClick={insertLink}><LinkIcon className="h-4 w-4" /></ToolButton>
                <ToolButton label="Insert image" onClick={insertImage}><ImageIcon className="h-4 w-4" /></ToolButton>
                <ToolButton label="Remove formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}><RemoveFormatting className="h-4 w-4" /></ToolButton>
                <span className="mx-1 h-5 w-px bg-border" />
                <ToolButton label="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></ToolButton>
                <ToolButton label="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></ToolButton>
                <ToolButton label={sourceMode ? "Visual editor" : "Edit HTML source"} active={sourceMode} onClick={toggleSourceMode}><Code2 className="h-4 w-4" /></ToolButton>
            </div>
            {sourceMode ? (
                <textarea
                    aria-label="HTML source"
                    value={sourceValue}
                    onChange={event => updateSource(event.target.value)}
                    className="w-full resize-y rounded-b-md bg-[#111827] px-4 py-3 font-mono text-xs leading-5 text-slate-100 focus:outline-none"
                    style={{ minHeight }}
                    spellCheck={false}
                />
            ) : (
                <div style={{ minHeight }}><EditorContent editor={editor} /></div>
            )}
            <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground">
                <span>{sourceMode ? "HTML source" : "Rich text editor"} · Changes are saved with your message</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Email-safe formatting</span>
            </div>
        </div>
    )
}
