import * as React from "react"
import {
  Archive,
  BarChart3,
  Boxes,
  ClipboardList,
  Factory,
  FileClock,
  GalleryVerticalEndIcon,
  House,
  Package,
  PackagePlus,
  Receipt,
  ShieldCheck,
  Truck,
  UserPlus,
  Users,
  Bean,
  PackageOpen,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useInventoryAlerts } from "@/contexts/inventory-alert-context"

const data = {
  teams: [
    {
      name: "Vida Frutos",
      logo: <GalleryVerticalEndIcon />,
      plan: "Inventario y ventas",
    },
  ],
  navMain: [
    {
      label: "Principal",
      items: [
        {
          title: "Vista general",
          url: "/",
          icon: <House />,
        },
      ],
    },
    {
      label: "Ventas",
      items: [
        {
          title: "Pedidos",
          url: "/pedidos",
          icon: <ClipboardList />,
        },
        {
          title: "Nuevo pedido",
          url: "/pedidos/nuevo",
          icon: <PackagePlus />,
        },
        {
          title: "Clientes",
          url: "/clientes",
          icon: <Users />,
        },
      ],
    },
    {
      label: "Inventario",
      items: [
        {
          title: "Inventario",
          url: "/inventario",
          icon: <Boxes />,
        },
        {
          title: "Actualizar Inventario",
          url: "/inventario/actualizar",
          icon: <Archive />,
        },
      ],
    },
    {
      label: "Producción",
      items: [
        {
          title: "Producción diaria",
          url: "/produccion",
          icon: <Factory />,
        },
        {
          title: "Armado de caja",
          url: "/despacho",
          icon: <PackageOpen />,
        },
        {
          title: "Envíos",
          icon: <Truck />,
          url: "/enviados",
        },
      ],
    },
    {
      label: "Registro de pagos",
      items: [
        {
          title: "Pagos",
          url: "/pagos",
          icon: <Receipt />,
        },
      ],
    },
    {
      label: "Administración",
      items: [
        {
          title: "Reportes",
          url: "/reportes",
          icon: <BarChart3 />,
        },
        {
          title: "Administración",
          url: "/admin/usuarios",
          icon: <ShieldCheck />,
        },
        {
          title: "Auditoría",
          url: "/auditoria",
          icon: <FileClock />,
        },
        {
          title: "Nuevo cliente",
          url: "/clientes/nuevo",
          icon: <UserPlus />,
        },
        {
          title: "Productos",
          url: "/productos",
          icon: <Package />,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { lowStockProducts } = useInventoryAlerts()
  const alertUrls = lowStockProducts.length > 0 ? ["/inventario"] : []

  return (
    <Sidebar collapsible="icon" variant="sidebar" {...props}>
      <SidebarHeader>
        {/* Minimal header with logo and app name */}
        <div className="relative flex w-full items-center gap-3 px-3 py-2 transition-[padding,gap] duration-200 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sidebar-border bg-[rgba(246,241,238,0.8)] p-2 transition-all duration-200
            group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:left-1/2 group-data-[collapsible=icon]:top-1/2 group-data-[collapsible=icon]:-translate-x-1/2 group-data-[collapsible=icon]:-translate-y-1/2 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
            <Bean className="h-5 w-5 text-VFBrown" />
          </div>

          <div className="flex flex-col overflow-hidden transition-all duration-200 max-w-36 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none">
            <span className="text-sm font-semibold leading-tight">VidaFrutos</span>
            <span className="text-xs text-muted-foreground">Inventario y ventas</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={data.navMain} alertUrls={alertUrls} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
