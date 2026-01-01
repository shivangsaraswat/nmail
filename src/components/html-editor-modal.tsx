"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Code, Eye, Upload, X } from "lucide-react"

interface HtmlEditorModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialHtml: string
    onInsert: (html: string) => void
}

type TabType = 'code' | 'preview' | 'upload'

export function HtmlEditorModal({ open, onOpenChange, initialHtml, onInsert }: HtmlEditorModalProps) {
    const [htmlCode, setHtmlCode] = useState(initialHtml)
    const [activeTab, setActiveTab] = useState<TabType>('code')

    // Sync with initial HTML when modal opens
    useEffect(() => {
        if (open) {
            setHtmlCode(initialHtml)
            setActiveTab('code')
        }
    }, [open, initialHtml])

    const handleInsert = () => {
        onInsert(htmlCode)
        onOpenChange(false)
    }

    const handleCancel = () => {
        onOpenChange(false)
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                const content = event.target?.result as string
                setHtmlCode(content)
                setActiveTab('code')
            }
            reader.readAsText(file)
        }
        e.target.value = ''
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="max-w-7xl w-[95vw] h-[85vh] max-h-[800px] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Accessibility: Hidden title for screen readers */}
                <VisuallyHidden>
                    <DialogTitle>Insert HTML</DialogTitle>
                </VisuallyHidden>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-xl font-medium text-gray-900">Insert HTML</h2>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-0 px-6 border-b bg-gray-50">
                    <button
                        onClick={() => setActiveTab('code')}
                        className={`px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === 'code'
                            ? 'text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        CODE
                        {activeTab === 'code' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === 'preview'
                            ? 'text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        PREVIEW
                        {activeTab === 'preview' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === 'upload'
                            ? 'text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        UPLOAD
                        {activeTab === 'upload' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto">
                    {activeTab === 'code' && (
                        <div className="h-full">
                            <textarea
                                value={htmlCode}
                                onChange={(e) => setHtmlCode(e.target.value)}
                                placeholder="<h1>Hello!</h1>&#10;<p>Your HTML content here...</p>"
                                className="w-full h-full font-mono text-sm resize-none bg-[#1e1e1e] text-[#d4d4d4] p-4 focus:outline-none"
                                style={{
                                    minHeight: '100%',
                                    lineHeight: '1.6',
                                    tabSize: 2,
                                }}
                                spellCheck={false}
                            />
                        </div>
                    )}

                    {activeTab === 'preview' && (
                        <div className="h-full bg-white">
                            {htmlCode ? (
                                <iframe
                                    srcDoc={`
                                        <!DOCTYPE html>
                                        <html>
                                        <head>
                                            <meta charset="utf-8">
                                            <meta name="viewport" content="width=device-width, initial-scale=1">
                                            <style>
                                                body { 
                                                    margin: 24px; 
                                                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                                    line-height: 1.5;
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
                                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                    Enter HTML code in the CODE tab to see preview
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'upload' && (
                        <div className="h-full flex items-center justify-center bg-gray-50 p-8">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Upload className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload HTML File</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Select an HTML file from your computer
                                </p>
                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 cursor-pointer transition-colors">
                                    <Upload className="h-4 w-4" />
                                    Choose File
                                    <input
                                        type="file"
                                        accept=".html,.htm"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        className="h-9 px-6 text-sm font-medium rounded-md"
                    >
                        CANCEL
                    </Button>
                    <Button
                        type="button"
                        onClick={handleInsert}
                        className="h-9 px-6 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700"
                        disabled={!htmlCode.trim()}
                    >
                        INSERT
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
