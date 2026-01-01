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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { UserPlus } from "lucide-react"
import { inviteUser } from "@/app/actions/users"
import { toast } from "sonner"

export function InviteUserDialog() {
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState("")
    const [name, setName] = useState("")
    const [role, setRole] = useState("user")
    const [isPending, setIsPending] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!email) {
            toast.error("Email is required")
            return
        }

        setIsPending(true)
        try {
            await inviteUser(email, name || undefined, role)
            toast.success(`User ${email} has been invited`)
            setOpen(false)
            setEmail("")
            setName("")
            setRole("user")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to invite user")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Invite New User</DialogTitle>
                        <DialogDescription>
                            Add a new user to the system. They will be able to sign in with Google using this email.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="user@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name (optional)</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Inviting..." : "Invite User"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
