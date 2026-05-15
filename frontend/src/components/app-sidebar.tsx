"use client"

import * as React from "react"

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
import {
  GalleryVerticalEndIcon,
  AudioLinesIcon,
  TerminalIcon,
  BriefcaseBusiness,
  ScanBarcode,
  BrainCircuit,
  PackagePlus,
  IdCard,
  Receipt,
  Wallet,
  House,
  PackageSearch,
  PackageOpen,
  UserCog,
  Boxes,
  UserKey,
  ScanLine,
  FolderPen,
  Folder,
} from "lucide-react"

// This is sample data.
const data = {
  user: {
    name: "Evan",
    email: "evan@example.com",
    avatar: "",
  },
  teams: [
    {
      name: "Vida Frutos",
      logo: <GalleryVerticalEndIcon />,
      plan: "",
    },
    {
      name: "Acme Corp.",
      logo: <AudioLinesIcon />,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: <TerminalIcon />,
      plan: "Free",
    },
  ],
  navMain: [
    {
      label: "Principal",
      items: [
        {
          title: "Vista general",
          url: "/index",
          icon: <House />,
        },
      ],
    },
    {
      label: "Pedidos",
      items: [
        {
          title: "Nuevo Pedido",
          url: "#",
          icon: <PackagePlus />,
        },
        {
          title: "Ver Pedidos",
          url: "#",
          icon: <PackageSearch />,
        },
      ],
    },
    {
      label: "Clientes",
      items: [
        {
          title: "Ver Clientes",
          icon: <BriefcaseBusiness />,
          url: "#",
        },
      ],
    },
    {
      label: "Producción",
      items: [
        {
          title: "Historial de Producción",
          icon: <ScanBarcode />,
          url: "#",
        },
        {
          title: "Predicción de Ventas (ML)",
          icon: <BrainCircuit />,
          url: "#",
        },
      ],
    },
    {
      label: "Inventario",
      items: [
        {
          title: "Ver Inventario",
          icon: <Folder />,
          url: "#",
        },
        {
          title: "Actualizar Inventario",
          icon: <FolderPen />,
          url: "#"
        },
      ],
    },
    {
      label: "Tributario",
      items: [
        {
          title: "Ver Facturas",
          url: "#",
          icon: <Wallet />,
        },
        {
          title: "Generar Factura",
          url: "#",
          icon: <Receipt />,
        },
      ],
    },
    {
      label: "Gestión",
      items: [
        {
          title: "Gestionar Usuarios",
          url: "#",
          icon: <UserCog />,
        },
        {
          title: "Roles de Usuarios",
          url: "#",
          icon: <UserKey />,
        },
        {
          title: "Gestionar Clientes",
          icon: <IdCard />,
          url: "#",
        },
        {
          title: "Gestionar Productos",
          icon: <PackageOpen />,
          url: "#",
        },
        {
          title: "Definir Estados de Pedidos",
          url: "#",
          icon: <Boxes />,
        },
        {
          title: "Definir alerta de stock",
          url: "#",
          icon: <ScanLine />,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible={"icon"} variant="sidebar" {...props}>
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
