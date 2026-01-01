
"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash } from "lucide-react"
import { toggleIdentityStatus, deleteIdentity } from "@/app/actions/identities"

interface IdentityActionsProps {
    id: string
    isActive: boolean
}

export function IdentityActions({ id, isActive }: IdentityActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                    onClick={() => toggleIdentityStatus(id, isActive)}
                >
                    {isActive ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => deleteIdentity(id)}
                >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
