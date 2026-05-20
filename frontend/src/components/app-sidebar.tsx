import * as React from "react"
import {
  Archive,
  BarChart3,
  Boxes,
  BrainCircuit,
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
import { useAuth } from "@/hooks/use-auth"

const data = {
  user: {
    name: "Vida Frutos",
    avatar: "",
  },
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
        {
          title: "Nuevo cliente",
          url: "/clientes/nuevo",
          icon: <UserPlus />,
        },
      ],
    },
    {
      label: "Inventario",
      items: [
        {
          title: "Stock",
          url: "/inventario",
          icon: <Boxes />,
        },
        {
          title: "Actualizar stock",
          url: "/inventario/actualizar",
          icon: <Archive />,
        },
        {
          title: "Productos",
          url: "/productos",
          icon: <Package />,
        },
      ],
    },
    {
      label: "Produccion",
      items: [
        {
          title: "Produccion diaria",
          url: "/produccion",
          icon: <Factory />,
        },
        {
          title: "Despacho",
          url: "/despacho",
          icon: <Truck />,
        },
        {
          title: "Prediccion IA",
          url: "/prediccion",
          icon: <BrainCircuit />,
        },
      ],
    },
    {
      label: "Tributario",
      items: [
        {
          title: "Facturas",
          url: "/facturas",
          icon: <Receipt />,
        },
      ],
    },
    {
      label: "Gestion",
      items: [
        {
          title: "Reportes",
          url: "/reportes",
          icon: <BarChart3 />,
        },
        {
          title: "Administracion",
          url: "/admin/usuarios",
          icon: <ShieldCheck />,
        },
        {
          title: "Auditoria",
          url: "/auditoria",
          icon: <FileClock />,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const userData = user
    ? {
        name: user.username || "Usuario",
        avatar: "",
      }
    : data.user

  return (
    <Sidebar collapsible="icon" variant="sidebar" {...props}>
      <SidebarHeader>
        {/* Minimal header with logo and app name */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#804f17] text-sidebar-primary-foreground">
            <Bean className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">VidaFrutos</span>
            <span className="text-xs text-muted-foreground">Inventario y ventas</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
