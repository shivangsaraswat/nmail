import { auth } from "@/auth"
import { TemplatesClient } from "./templates-client"

export default async function TemplatesPage() {
    const session = await auth()
    const isAdmin = session?.user?.role === 'admin'

    return (
        <div className="p-6">
            <TemplatesClient isAdmin={isAdmin} />
        </div>
    )
}
