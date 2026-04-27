"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon, TerminalSquareIcon, BotIcon, BookOpenIcon, Settings2Icon, FrameIcon, PieChartIcon, MapIcon } from "lucide-react"

// This is sample data.
const data = {
  user: {
    name: "Evan",
    email: "evan@example.com",
    avatar:
      "",
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
      title: "Item 1",
      url: "#",
      icon: <TerminalSquareIcon />,
      isActive: true,
      items: [
        {
          title: "SubItem 1.1",
          url: "#",
        },
        {
          title: "SubItem 1.2",
          url: "#",
        },
        {
          title: "SubItem 1.3",
          url: "#",
        },
      ],
    },
    {
      title: "Item 2",
      url: "#",
      icon: <BotIcon />,
      items: [
        {
          title: "SubItem 2.1",
          url: "#",
        },
        {
          title: "SubItem 2.2",
          url: "#",
        },
        {
          title: "SubItem 2.3",
          url: "#",
        },
      ],
    },
    {
      title: "Item 3",
      url: "#",
      icon: <BookOpenIcon />,
      items: [
        {
          title: "SubItem 3.1",
          url: "#",
        },
        {
          title: "SubItem 3.2",
          url: "#",
        },
        {
          title: "SubItem 3.3",
          url: "#",
        },
        {
          title: "SubItem 3.4",
          url: "#",
        },
      ],
    },
    {
      title: "Item 4",
      url: "#",
      icon: <Settings2Icon />,
      items: [
        {
          title: "SubItem 4.1",
          url: "#",
        },
        {
          title: "SubItem 4.2",
          url: "#",
        },
        {
          title: "SubItem 4.3",
          url: "#",
        },
        {
          title: "SubItem 4.4",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: <FrameIcon />,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: <PieChartIcon />,
    },
    {
      name: "Travel",
      url: "#",
      icon: <MapIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
