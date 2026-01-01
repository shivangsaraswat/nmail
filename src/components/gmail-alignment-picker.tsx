"use client"

import { useState, useRef, useEffect } from "react"
import { AlignLeft, AlignCenter, AlignRight, ChevronDown } from "lucide-react"

interface AlignmentPickerProps {
    onAlignChange: (align: 'left' | 'center' | 'right') => void
    currentAlign?: 'left' | 'center' | 'right'
}

const ALIGNMENTS = [
    { value: 'left' as const, icon: AlignLeft },
    { value: 'center' as const, icon: AlignCenter },
    { value: 'right' as const, icon: AlignRight },
]

export function GmailAlignmentPicker({ onAlignChange, currentAlign = 'left' }: AlignmentPickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Get current alignment icon
    const CurrentIcon = ALIGNMENTS.find(a => a.value === currentAlign)?.icon || AlignLeft

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 flex items-center gap-0.5"
                title="Text alignment"
            >
                <CurrentIcon className="h-4 w-4" />
                <ChevronDown className="h-3 w-3" />
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-1 z-50">
                    <div className="flex flex-col gap-0.5">
                        {ALIGNMENTS.map((alignment) => {
                            const Icon = alignment.icon
                            return (
                                <button
                                    key={alignment.value}
                                    type="button"
                                    className={`p-2 rounded hover:bg-gray-100 flex items-center justify-center ${currentAlign === alignment.value ? 'bg-gray-100' : ''
                                        }`}
                                    onClick={() => {
                                        onAlignChange(alignment.value)
                                        setIsOpen(false)
                                    }}
                                    title={`Align ${alignment.value}`}
                                >
                                    <Icon className="h-5 w-5 text-gray-700" />
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
