
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { createSenderIdentity } from "@/app/actions/identities"

export function CreateIdentityDialog() {
    const [open, setOpen] = useState(false)

    async function onSubmit(formData: FormData) {
        await createSenderIdentity(formData)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Identity
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Sender Identity</DialogTitle>
                    <DialogDescription>
                        Add a new "From" address. Users will see this Display Name.
                    </DialogDescription>
                </DialogHeader>
                <form action={onSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="displayName" className="text-right">
                            Display Name
                        </Label>
                        <Input id="displayName" name="displayName" defaultValue="Organization Name" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="emailAddress" className="text-right">
                            Email
                        </Label>
                        <Input id="emailAddress" name="emailAddress" type="email" placeholder="official@example.com" className="col-span-3" required />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
