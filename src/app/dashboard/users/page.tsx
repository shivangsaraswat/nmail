
import { auth } from "@/auth"
import { db } from "@/db"
import { users, senderIdentities } from "@/db/schema"
import { redirect } from "next/navigation"
import { desc, eq } from "drizzle-orm"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ManagePermissionsDialog } from "@/components/manage-permissions-dialog"
import { updateUserRole } from "@/app/actions/users"
import { Button } from "@/components/ui/button"
import { InviteUserDialog } from "@/components/invite-user-dialog"

export default async function UsersPage() {
    const session = await auth()

    if (session?.user?.role !== 'admin') {
        redirect("/dashboard")
    }

    const currentUserId = session.user.id

    const allUsers = await db.query.users.findMany({
        orderBy: [desc(users.createdAt)],
        with: {
            permissions: true
        }
    })

    const allIdentities = await db.query.senderIdentities.findMany({
        where: eq(senderIdentities.isActive, true)
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
                    <p className="text-muted-foreground">
                        Manage user roles and assign sender permissions.
                    </p>
                </div>
                <InviteUserDialog />
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Permissions</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.image || ""} />
                                        <AvatarFallback>{user.name?.substring(0, 2) || "U"}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {user.name}
                                            {user.id === currentUserId && <span className="text-muted-foreground ml-1">(you)</span>}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'admin' ? "default" : "outline"}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-muted-foreground">
                                        {user.role === 'admin' ? 'All (admin)' : `${user.permissions.length} identities`}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right flex justify-end gap-2">
                                    {/* Only show permissions dialog for non-admin users */}
                                    {user.role !== 'admin' && (
                                        <ManagePermissionsDialog
                                            userId={user.id}
                                            userName={user.name || "User"}
                                            allIdentities={allIdentities}
                                            assignedIdentityIds={user.permissions.map(p => p.senderIdentityId)}
                                        />
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
