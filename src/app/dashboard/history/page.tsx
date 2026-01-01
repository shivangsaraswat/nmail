
import { auth } from "@/auth"
import { db } from "@/db"
import { emailLogs, senderIdentities } from "@/db/schema"
import { redirect } from "next/navigation"
import { desc, eq, and } from "drizzle-orm"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export default async function HistoryPage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/api/auth/signin")
    }

    // Admin sees all, User sees only theirs
    // Actually, specs say "View only their own sent emails" for Organization User.
    // Super Admin: "View all system logs". 

    const whereClause = session.user.role === 'admin'
        ? undefined
        : eq(emailLogs.userId, session.user.id)

    const logs = await db.query.emailLogs.findMany({
        where: whereClause,
        orderBy: [desc(emailLogs.sentAt)],
        with: {
            senderIdentity: true,
            user: true // To see who sent it (for admins)
        },
        limit: 50 // Simple limit for now
    })

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Sent History</h2>
                <p className="text-muted-foreground">
                    {session.user.role === 'admin' ? "All outgoing emails from the system." : "Emails sent by you."}
                </p>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sent At</TableHead>
                            {session.user.role === 'admin' && <TableHead>User</TableHead>}
                            <TableHead>From (Identity)</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={session.user.role === 'admin' ? 6 : 5} className="text-center py-6 text-muted-foreground">
                                    No emails found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {format(log.sentAt, "MMM d, yyyy HH:mm")}
                                    </TableCell>
                                    {session.user.role === 'admin' && (
                                        <TableCell>
                                            <div className="flex flex-col text-xs">
                                                <span className="font-medium">{log.user.name}</span>
                                                <span className="text-muted-foreground">{log.user.email}</span>
                                            </div>
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        {log.senderIdentity.displayName}
                                        <div className="text-xs text-muted-foreground">{log.senderIdentity.emailAddress}</div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        {(log.recipients as string[]).join(", ")}
                                    </TableCell>
                                    <TableCell className="max-w-[250px] truncate font-medium">
                                        {log.subject}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={log.deliveryStatus === 'sent' ? 'default' : 'destructive'}>
                                            {log.deliveryStatus}
                                        </Badge>
                                        {log.errorMessage && (
                                            <div className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={log.errorMessage}>
                                                {log.errorMessage}
                                            </div>
                                        )}
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
