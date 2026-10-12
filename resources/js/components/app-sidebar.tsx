import { Link, usePage } from '@inertiajs/react';
import {
    Baby,
    Banknote,
    ChartColumn,
    FileText,
    FolderOpen,
    PartyPopper,
    CalendarCheck,
    ClipboardCheck,
    BookHeart,
    BookX,
    Globe,
    LayoutGrid,
    Megaphone,
    School,
    Settings2,
    Users,
    Wallet,
} from 'lucide-react';
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
import { index as payslips } from '@/routes/payslips';
import { index as myPayments } from '@/routes/payments';
import { index as billing } from '@/routes/admin/billing';
import { index as complaints } from '@/routes/admin/complaints';
import { index as adminDocuments } from '@/routes/admin/documents';
import { index as finance } from '@/routes/admin/finance';
import { index as payroll } from '@/routes/admin/payroll';
import { index as staffAttendance } from '@/routes/admin/staff-attendance';
import { index as students } from '@/routes/admin/students';
import { index as users } from '@/routes/admin/users';
import {
    mine as childrenAttendance,
    staff as myAttendance,
} from '@/routes/attendance';
import { index as announcements } from '@/routes/announcements';
import { index as classrooms } from '@/routes/classrooms';
import { index as documents } from '@/routes/documents';
import { index as events } from '@/routes/events';
import {
    index as manageInduction,
    mine as myInduction,
} from '@/routes/induction';
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
        { title: 'Comunicados', href: announcements(), icon: Megaphone },
        { title: 'Eventos', href: events(), icon: PartyPopper },
        {
            title: 'Documentos',
            href: auth.roles.includes('admin') ? adminDocuments() : documents(),
            icon: FolderOpen,
        },
        ...(hasRole(auth.roles, 'admin', 'teacher')
            ? [{ title: 'Salones', href: classrooms(), icon: School }]
            : []),
        ...(hasRole(auth.roles, 'teacher', 'intern')
            ? [
                  {
                      title: 'Mi asistencia',
                      href: myAttendance(),
                      icon: ClipboardCheck,
                  },
              ]
            : []),
        ...(hasRole(auth.roles, 'parent')
            ? [
                  {
                      title: 'Asistencia',
                      href: childrenAttendance(),
                      icon: CalendarCheck,
                  },
                  { title: 'Mis pagos', href: myPayments(), icon: Wallet },
              ]
            : []),
        ...(hasRole(auth.roles, 'parent', 'teacher', 'intern')
            ? [{ title: 'Mi inducción', href: myInduction(), icon: BookHeart }]
            : []),
        ...(hasRole(auth.roles, 'admin', 'teacher')
            ? [
                  {
                      title: 'Gestionar inducción',
                      href: manageInduction(),
                      icon: Settings2,
                  },
              ]
            : []),
        ...(hasRole(auth.roles, 'admin')
            ? [
                  { title: 'Pagos', href: billing(), icon: Wallet },
                  { title: 'Planilla', href: payroll(), icon: Banknote },
                  { title: 'Finanzas', href: finance(), icon: ChartColumn },
                  { title: 'Alumnos', href: students(), icon: Baby },
                  {
                      title: 'Asistencia del personal',
                      href: staffAttendance(),
                      icon: ClipboardCheck,
                  },
                  { title: 'Personas', href: users(), icon: Users },
                  {
                      title: 'Libro de Reclamaciones',
                      href: complaints(),
                      icon: BookX,
                  },
              ]
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
