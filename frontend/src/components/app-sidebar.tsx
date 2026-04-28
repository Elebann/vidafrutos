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
  FrameIcon,
  PieChartIcon,
  MapIcon,
  Bean,
  BriefcaseBusiness,
  ScanBarcode,
  BrainCircuit,
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
          title: "Agregar producto",
          url: "/add-product",
          icon: <Bean />,
        },
        {
          title: "Item 1.2",
          url: "/section/item-1-2",
          icon: <MapIcon />,
        },
        {
          title: "Item 1.3",
          url: "/section/item-1-3",
          icon: <FrameIcon />,
        },
      ],
    },
    {
      label: "Ventas",
      items: [
        {
          title: "Item 2.1",
          url: "/section/item-2-1",
          icon: <PieChartIcon />,
        },
        {
          title: "Item 3.1",
          url: "/section/item-3-1",
          icon: <MapIcon />,
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
          url: "#"
        },
        {
          title: "Predicción (ML)",
          icon: <BrainCircuit />,
          url: "#"
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
