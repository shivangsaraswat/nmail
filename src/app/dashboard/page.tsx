
import { auth } from "@/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
    const session = await auth()

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Welcome back, {session?.user?.name}</h1>
                <p className="text-muted-foreground">Manage your outgoing communications securely.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Compose Email</CardTitle>
                        <CardDescription>Send a new official email</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* TODO: Link to compose */}
                        <p className="text-sm text-muted-foreground">Start writing a new message using approved templates.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Sent History</CardTitle>
                        <CardDescription>View past communications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* TODO: Recent count */}
                        <p className="text-sm text-muted-foreground">You have sent 0 emails this month.</p>
                    </CardContent>
                </Card>

                {session?.user.role === 'admin' && (
                    <Card className="border-blue-200 bg-blue-50/50">
                        <CardHeader>
                            <CardTitle>Admin Controls</CardTitle>
                            <CardDescription>System Management</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Manage users and sender identities.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
