"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"

// Gmail color palette
const TEXT_COLORS = [
    // Row 1 - Black to white
    ['#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff'],
    // Row 2 - Bright colors
    ['#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff'],
    // Row 3
    ['#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc'],
    // Row 4
    ['#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd'],
    // Row 5
    ['#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0'],
    // Row 6
    ['#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79'],
    // Row 7
    ['#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47'],
    // Row 8
    ['#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130'],
]

const BACKGROUND_COLORS = [
    // Row 1 - Black to white
    ['#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff'],
    // Row 2 - Bright colors
    ['#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff'],
    // Row 3
    ['#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc'],
    // Row 4
    ['#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd'],
    // Row 5
    ['#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0'],
    // Row 6
    ['#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79'],
    // Row 7
    ['#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47'],
    // Row 8
    ['#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130'],
]

interface ColorPickerProps {
    onTextColorChange: (color: string) => void
    onBackgroundColorChange: (color: string) => void
    currentTextColor?: string
}

export function GmailColorPicker({ onTextColorChange, onBackgroundColorChange, currentTextColor = '#000000' }: ColorPickerProps) {
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
                className="p-1 hover:bg-gray-100 rounded text-gray-600 flex flex-col items-center justify-center"
                title="Text color"
            >
                <span className="text-sm font-bold leading-none">A</span>
                <div className="w-4 h-1 rounded-sm mt-0.5" style={{ backgroundColor: currentTextColor }}></div>
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-[420px]">
                    <div className="flex gap-6">
                        {/* Background Color */}
                        <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">Background color</div>
                            <div className="flex flex-col gap-0.5">
                                {BACKGROUND_COLORS.map((row, rowIndex) => (
                                    <div key={`bg-row-${rowIndex}`} className="flex gap-0.5">
                                        {row.map((color, colIndex) => (
                                            <button
                                                key={`bg-${rowIndex}-${colIndex}`}
                                                type="button"
                                                className="w-5 h-5 rounded-sm border border-gray-200 hover:scale-110 transition-transform"
                                                style={{ backgroundColor: color }}
                                                onClick={() => {
                                                    onBackgroundColorChange(color)
                                                    setIsOpen(false)
                                                }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Text Color */}
                        <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">Text color</div>
                            <div className="flex flex-col gap-0.5">
                                {TEXT_COLORS.map((row, rowIndex) => (
                                    <div key={`text-row-${rowIndex}`} className="flex gap-0.5">
                                        {row.map((color, colIndex) => (
                                            <button
                                                key={`text-${rowIndex}-${colIndex}`}
                                                type="button"
                                                className="w-5 h-5 rounded-sm border border-gray-200 hover:scale-110 transition-transform"
                                                style={{ backgroundColor: color }}
                                                onClick={() => {
                                                    onTextColorChange(color)
                                                    setIsOpen(false)
                                                }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
