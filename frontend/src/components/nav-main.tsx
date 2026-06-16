import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavLink } from "react-router-dom"

export function NavMain({
  groups,
  alertUrls = [],
}: {
  groups: {
    label: string
    items: {
      title: string
      url: string
      icon?: React.ReactNode
    }[]
  }[]
  alertUrls?: string[]
}) {
  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => (
              <SidebarMenuItem key={`${group.label}-${item.title}`}>
                <SidebarMenuButton
                  render={<NavLink to={item.url} end />}
                  tooltip={item.title}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
                {alertUrls.includes(item.url) && (
                  <SidebarMenuBadge>
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
