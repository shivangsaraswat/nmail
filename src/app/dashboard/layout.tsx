
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) {
        redirect("/api/auth/signin")
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full">
                <div className="p-6">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}

