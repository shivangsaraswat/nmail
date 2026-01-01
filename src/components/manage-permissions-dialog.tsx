
"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Key } from "lucide-react"
import { togglePermission } from "@/app/actions/users"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface SenderIdentity {
    id: string
    displayName: string
    emailAddress: string
}

interface ManagePermissionsDialogProps {
    userId: string
    userName: string
    allIdentities: SenderIdentity[]
    assignedIdentityIds: string[]
}

export function ManagePermissionsDialog({
    userId,
    userName,
    allIdentities,
    assignedIdentityIds
}: ManagePermissionsDialogProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const handleToggle = async (identityId: string, checked: boolean) => {
        await togglePermission(userId, identityId, checked)
        router.refresh()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Key className="mr-2 h-4 w-4" />
                    Permissions
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manage Permissions</DialogTitle>
                    <DialogDescription>
                        Select which sender identities <strong>{userName}</strong> can use.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {allIdentities.length === 0 && <p className="text-muted-foreground text-sm">No active sender identities available.</p>}

                    {allIdentities.map((identity) => {
                        const isChecked = assignedIdentityIds.includes(identity.id)
                        return (
                            <div key={identity.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`perm-${identity.id}`}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => handleToggle(identity.id, checked as boolean)}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label htmlFor={`perm-${identity.id}`} className="font-medium">
                                        {identity.displayName}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {identity.emailAddress}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}
