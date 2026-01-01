"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown } from "lucide-react"

interface FontSizePickerProps {
    onSizeChange: (size: string) => void
    currentSize?: string
}

const FONT_SIZES = [
    { label: 'Small', value: '0.875em', fontSize: '13px' },
    { label: 'Normal', value: '1em', fontSize: '16px' },
    { label: 'Large', value: '1.5em', fontSize: '22px' },
    { label: 'Huge', value: '2em', fontSize: '32px' },
]

export function GmailFontSizePicker({ onSizeChange, currentSize = '1em' }: FontSizePickerProps) {
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

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 flex items-center gap-0.5"
                title="Font size"
            >
                <span className="text-base font-bold">T</span>
                <span className="text-xs font-bold">T</span>
                <ChevronDown className="h-3 w-3 ml-0.5" />
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[120px]">
                    {FONT_SIZES.map((size) => (
                        <button
                            key={size.value}
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
                            onClick={() => {
                                onSizeChange(size.value)
                                setIsOpen(false)
                            }}
                        >
                            <span className="w-5 flex justify-center">
                                {currentSize === size.value && (
                                    <Check className="h-4 w-4 text-gray-700" />
                                )}
                            </span>
                            <span style={{ fontSize: size.fontSize }} className="text-gray-800">
                                {size.label}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
