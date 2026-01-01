"use client"

import { useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { toast } from "sonner"

interface CSVUploadButtonProps {
    onEmailsExtracted: (emails: string[]) => void
}

export function CSVUploadButton({ onEmailsExtracted }: CSVUploadButtonProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    const parseCSV = useCallback((text: string): string[] => {
        const lines = text.split(/\r?\n/).filter(line => line.trim())
        if (lines.length === 0) return []

        // Try to find email column
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
        const emailColumnIndex = headers.findIndex(h =>
            h === 'email' || h === 'e-mail' || h === 'mail' || h === 'email address' || h === 'emailaddress'
        )

        const emails: string[] = []
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        // Start from line 1 if we found headers, otherwise start from 0
        const startIndex = emailColumnIndex >= 0 ? 1 : 0
        const columnToUse = emailColumnIndex >= 0 ? emailColumnIndex : 0

        for (let i = startIndex; i < lines.length; i++) {
            const columns = lines[i].split(',').map(c => c.trim().replace(/"/g, ''))

            if (emailColumnIndex >= 0) {
                // Use the email column
                const email = columns[columnToUse]?.trim()
                if (email && emailRegex.test(email)) {
                    emails.push(email)
                }
            } else {
                // Try to find an email in any column
                for (const col of columns) {
                    const trimmed = col.trim()
                    if (emailRegex.test(trimmed)) {
                        emails.push(trimmed)
                        break
                    }
                }
            }
        }

        return [...new Set(emails)] // Remove duplicates
    }, [])

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.endsWith('.csv')) {
            toast.error("Please upload a CSV file")
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target?.result as string
            const emails = parseCSV(text)

            if (emails.length === 0) {
                toast.error("No valid emails found in CSV")
            } else {
                toast.success(`Found ${emails.length} email${emails.length > 1 ? 's' : ''}`)
                onEmailsExtracted(emails)
            }
        }
        reader.onerror = () => {
            toast.error("Failed to read file")
        }
        reader.readAsText(file)

        // Reset input so same file can be selected again
        e.target.value = ''
    }, [parseCSV, onEmailsExtracted])

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleClick}>
                <Upload className="h-4 w-4 mr-1" />
                CSV
            </Button>
        </>
    )
}
