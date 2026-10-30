import { Link, usePage } from '@inertiajs/react';
import {
    Baby,
    Banknote,
    Bus,
    ChartColumn,
    FilePlus2,
    FileText,
    FolderOpen,
    PartyPopper,
    CalendarCheck,
    ClipboardCheck,
    Cog,
    BookHeart,
    BookX,
    Globe,
    GraduationCap,
    HeartPulse,
    History,
    LayoutGrid,
    Megaphone,
    MessagesSquare,
    NotebookPen,
    Package,
    School,
    Settings2,
    Smile,
    UserPlus,
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
import { index as messages } from '@/routes/messages';
import { index as myPayments } from '@/routes/payments';
import { index as audit } from '@/routes/admin/audit';
import { index as billing } from '@/routes/admin/billing';
import { index as complaints } from '@/routes/admin/complaints';
import { index as adminDocuments } from '@/routes/admin/documents';
import { index as enrollments } from '@/routes/admin/enrollments';
import { index as finance } from '@/routes/admin/finance';
import { index as inventory } from '@/routes/admin/inventory';
import { index as leads } from '@/routes/admin/leads';
import { index as payroll } from '@/routes/admin/payroll';
import { index as services } from '@/routes/admin/services';
import { index as settings } from '@/routes/admin/settings';
import { index as siteEditor } from '@/routes/admin/site';
import { index as staffAttendance } from '@/routes/admin/staff-attendance';
import { index as students } from '@/routes/admin/students';
import { index as users } from '@/routes/admin/users';
import {
    mine as childrenAttendance,
    staff as myAttendance,
} from '@/routes/attendance';
import { index as announcements } from '@/routes/announcements';
import { index as myChildren } from '@/routes/children';
import { index as classrooms } from '@/routes/classrooms';
import { mine as myDailyLogs } from '@/routes/daily-logs';
import { mine as myReportCards } from '@/routes/report-cards';
import { index as documents } from '@/routes/documents';
import { index as incidents } from '@/routes/incidents';
import { index as myEnrollment } from '@/routes/enrollment';
import { index as events } from '@/routes/events';
import {
    index as manageInduction,
    mine as myInduction,
} from '@/routes/induction';
import type { NavItem } from '@/types';

const footerNavItems: NavItem[] = [
    {
        title: 'Ver sitio público',
        href: home(),
        icon: Globe,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const mainNavItems: NavItem[] = [
        { title: 'Inicio', href: dashboard(), icon: LayoutGrid },
        { title: 'Comunicados', href: announcements(), icon: Megaphone },
        ...(hasRole(auth.roles, 'admin', 'teacher', 'intern', 'parent')
            ? [{ title: 'Mensajes', href: messages(), icon: MessagesSquare }]
            : []),
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
                  { title: 'Mis boletas', href: payslips(), icon: FileText },
              ]
            : []),
        ...(hasRole(auth.roles, 'admin', 'teacher', 'intern')
            ? [
                  {
                      title: 'Incidentes',
                      href: incidents(),
                      icon: HeartPulse,
                  },
              ]
            : []),
        ...(hasRole(auth.roles, 'parent')
            ? [
                  { title: 'Mis hijos', href: myChildren(), icon: Smile },
                  {
                      title: 'Cuaderno diario',
                      href: myDailyLogs(),
                      icon: NotebookPen,
                  },
                  {
                      title: 'Libretas de notas',
                      href: myReportCards(),
                      icon: GraduationCap,
                  },
                  {
                      title: 'Asistencia',
                      href: childrenAttendance(),
                      icon: CalendarCheck,
                  },
                  { title: 'Mis pagos', href: myPayments(), icon: Wallet },
                  { title: 'Matrícula', href: myEnrollment(), icon: FilePlus2 },
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
    ];
    const adminNavItems: NavItem[] = hasRole(auth.roles, 'admin')
        ? [
              { title: 'Alumnos', href: students(), icon: Baby },
              { title: 'Pagos', href: billing(), icon: Wallet },
              { title: 'Servicios', href: services(), icon: Bus },
              { title: 'Planilla', href: payroll(), icon: Banknote },
              { title: 'Finanzas', href: finance(), icon: ChartColumn },
              { title: 'Inventario', href: inventory(), icon: Package },
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
              { title: 'Auditoría', href: audit(), icon: History },
              { title: 'Configuración', href: settings(), icon: Cog },
          ]
        : [];
    const siteNavItems: NavItem[] = hasRole(auth.roles, 'admin')
        ? [
              { title: 'Sitio web', href: siteEditor(), icon: Globe },
              { title: 'Admisiones', href: leads(), icon: UserPlus },
              {
                  title: 'Matrículas en línea',
                  href: enrollments(),
                  icon: FilePlus2,
              },
          ]
        : [];

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
                {adminNavItems.length > 0 && (
                    <NavMain items={adminNavItems} label="Administración" />
                )}
                {siteNavItems.length > 0 && (
                    <NavMain items={siteNavItems} label="Sitio y admisiones" />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
