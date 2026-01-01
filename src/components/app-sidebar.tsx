
"use client"

import { Home, Send, History, Users, Shield, LogOut, ChevronsUpDown, PanelLeft, FileText, Moon, Sun } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
    SidebarHeader,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession, signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from 'next/link'
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

export function AppSidebar() {
    const { data: session } = useSession()
    const user = session?.user

    const isAdmin = user?.role === 'admin'

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="h-14 border-b">
                <div className="flex h-full w-full items-center justify-between px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                    <span className="font-bold text-xl group-data-[collapsible=icon]:hidden">Nmail</span>
                    <SidebarTrigger />
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Dashboard">
                                    <Link href="/dashboard">
                                        <Home />
                                        <span>Dashboard</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Compose Email">
                                    <Link href="/dashboard/compose">
                                        <Send />
                                        <span>Compose Email</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Sent History">
                                    <Link href="/dashboard/history">
                                        <History />
                                        <span>Sent History</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Templates">
                                    <Link href="/dashboard/templates">
                                        <FileText />
                                        <span>Templates</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Admin Section - Conditionally Rendered */}
                {isAdmin && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Administration</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="Sender Identities">
                                        <Link href="/dashboard/identities">
                                            <Shield />
                                            <span>Sender Identities</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="Manage Users">
                                        <Link href="/dashboard/users">
                                            <Users />
                                            <span>Manage Users</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <SidebarFooter className="border-t p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton className="w-full h-auto py-2" tooltip={user?.name || "User"}>
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={user?.image || undefined} />
                                        <AvatarFallback className="text-xs">{user?.name?.substring(0, 2) || "U"}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-start text-xs flex-1 overflow-hidden">
                                        <span className="font-medium truncate w-full text-left">{user?.name}</span>
                                        <span className="text-muted-foreground truncate w-full text-left">{user?.email}</span>
                                    </div>
                                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" align="start" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <ThemeToggleMenuItem />
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600 cursor-pointer"
                                    onClick={() => signOut()}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}

// Theme Toggle Menu Item for Dropdown
function ThemeToggleMenuItem() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <DropdownMenuItem className="cursor-pointer">
                <Sun className="mr-2 h-4 w-4" />
                Theme
            </DropdownMenuItem>
        )
    }

    return (
        <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
            {theme === 'dark' ? (
                <>
                    <Sun className="mr-2 h-4 w-4" />
                    Light Mode
                </>
            ) : (
                <>
                    <Moon className="mr-2 h-4 w-4" />
                    Dark Mode
                </>
            )}
        </DropdownMenuItem>
    )
}
