"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Code, Eye, Check, X } from "lucide-react"

interface HtmlEditorModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialHtml: string
    onInsert: (html: string) => void
}

export function HtmlEditorModal({ open, onOpenChange, initialHtml, onInsert }: HtmlEditorModalProps) {
    const [htmlCode, setHtmlCode] = useState(initialHtml)
    const [showPreview, setShowPreview] = useState(true)

    // Sync with initial HTML when modal opens
    useEffect(() => {
        if (open) {
            setHtmlCode(initialHtml)
        }
    }, [open, initialHtml])

    const handleInsert = () => {
        onInsert(htmlCode)
        onOpenChange(false)
    }

    const handleCancel = () => {
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b bg-muted/30">
                    <DialogTitle className="flex items-center gap-2.5 text-lg">
                        <div className="p-1.5 rounded-md bg-primary/10">
                            <Code className="h-4 w-4 text-primary" />
                        </div>
                        Insert HTML
                    </DialogTitle>
                    <DialogDescription className="text-sm mt-1.5">
                        Paste your HTML code below and preview it before inserting into your email.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 overflow-hidden p-6">
                    {/* HTML Code Editor */}
                    <div className="flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Code className="h-4 w-4 text-muted-foreground" />
                                HTML Code
                            </label>
                        </div>
                        <Textarea
                            value={htmlCode}
                            onChange={(e) => setHtmlCode(e.target.value)}
                            placeholder="<div style='font-family: Arial, sans-serif;'>&#10;  <h1>Hello!</h1>&#10;  <p>Your HTML content here...</p>&#10;</div>"
                            className="flex-1 font-mono text-sm resize-none min-h-[350px] bg-slate-950 text-slate-100 border-slate-700 placeholder:text-slate-500 rounded-lg p-4 focus-visible:ring-2 focus-visible:ring-primary/50"
                            spellCheck={false}
                        />
                    </div>

                    {/* Preview Panel */}
                    <div className="flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                Preview
                            </label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPreview(!showPreview)}
                                className="text-xs h-7 px-2.5 rounded-md"
                            >
                                {showPreview ? "Hide" : "Show"} Preview
                            </Button>
                        </div>
                        <div className="flex-1 border-2 border-dashed border-gray-200 rounded-lg bg-white overflow-auto min-h-[350px] shadow-inner">
                            {showPreview && htmlCode ? (
                                <iframe
                                    srcDoc={`
                                        <!DOCTYPE html>
                                        <html>
                                        <head>
                                            <meta charset="utf-8">
                                            <meta name="viewport" content="width=device-width, initial-scale=1">
                                            <style>
                                                body { 
                                                    margin: 16px; 
                                                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                                }
                                            </style>
                                        </head>
                                        <body>${htmlCode}</body>
                                        </html>
                                    `}
                                    className="w-full h-full border-0"
                                    title="HTML Preview"
                                    sandbox="allow-same-origin"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                    {!showPreview ? "Preview hidden" : "Enter HTML code to see preview"}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-shrink-0 gap-3 px-6 py-4 border-t bg-muted/30">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        className="gap-2 h-9 px-4 rounded-lg"
                    >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleInsert}
                        className="gap-2 h-9 px-4 rounded-lg bg-primary hover:bg-primary/90"
                        disabled={!htmlCode.trim()}
                    >
                        <Check className="h-3.5 w-3.5" />
                        Insert HTML
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
