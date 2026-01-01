
"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { useEffect } from 'react'

interface TiptapEditorProps {
    value: string
    onChange: (value: string) => void
}

export function TiptapEditor({ value, onChange, onEditorReady }: TiptapEditorProps & { onEditorReady?: (editor: any) => void }) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                // Keep paragraph and heading defaults
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline cursor-pointer',
                },
            }),
            Underline,
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            TextStyle.configure({
                HTMLAttributes: {},
            }),
            FontFamily.configure({
                types: ['textStyle'],
            }),
            Color.configure({
                types: ['textStyle'],
            }),
            Highlight.configure({
                multicolor: true,
            }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: "min-h-[150px] w-full rounded-md bg-transparent px-3 py-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            },
            // Allow paste to preserve inline styles
            transformPastedHTML(html) {
                return html
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        onCreate: ({ editor }) => {
            if (onEditorReady) {
                onEditorReady(editor)
            }
        }
    })

    // Sync external value changes to editor
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            // Only update if the value is different from current editor content
            // This prevents infinite loops
            const currentContent = editor.getHTML()
            if (value !== currentContent) {
                editor.commands.setContent(value)
            }
        }
    }, [value, editor])

    return (
        <div className="[&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-gray-300 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic">
            <EditorContent editor={editor} />
        </div>
    )
}
