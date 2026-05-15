"use client"

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
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Vida Frutos",
    email: "admin@vidafrutos.cl",
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
  return (
    <Sidebar collapsible="icon" variant="sidebar" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
