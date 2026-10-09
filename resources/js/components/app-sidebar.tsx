import { Link, usePage } from '@inertiajs/react';
import { Globe, LayoutGrid, School } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { hasRole } from '@/lib/school';
import { dashboard, home } from '@/routes';
import { index as classrooms } from '@/routes/classrooms';
import type { NavItem } from '@/types';

const footerNavItems: NavItem[] = [
    {
        title: 'Sitio web',
        href: home(),
        icon: Globe,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const mainNavItems: NavItem[] = [
        { title: 'Inicio', href: dashboard(), icon: LayoutGrid },
        ...(hasRole(auth.roles, 'admin', 'teacher')
            ? [{ title: 'Salones', href: classrooms(), icon: School }]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
