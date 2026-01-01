
import { auth } from "@/auth"
import { db } from "@/db"
import { senderIdentities } from "@/db/schema"
import { redirect } from "next/navigation"
import { desc } from "drizzle-orm"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CreateIdentityDialog } from "@/components/create-identity-dialog"
import { IdentityActions } from "@/components/identity-actions"

export default async function IdentitiesPage() {
    const session = await auth()

    if (session?.user?.role !== 'admin') {
        redirect("/dashboard")
    }

    const identities = await db.query.senderIdentities.findMany({
        orderBy: [desc(senderIdentities.createdAt)],
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Sender Identities</h2>
                    <p className="text-muted-foreground">
                        Manage the "From" addresses available to your organization.
                    </p>
                </div>
                <CreateIdentityDialog />
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Display Name</TableHead>
                            <TableHead>Email Address</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {identities.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No sender identities found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            identities.map((identity) => (
                                <TableRow key={identity.id}>
                                    <TableCell className="font-medium">{identity.displayName}</TableCell>
                                    <TableCell>{identity.emailAddress}</TableCell>
                                    <TableCell>
                                        <Badge variant={identity.isActive ? "default" : "secondary"}>
                                            {identity.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <IdentityActions id={identity.id} isActive={identity.isActive} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
