import { useLocation, Link } from "wouter";
import { LayoutDashboard, Mic, Users, Building2, CheckSquare, BarChart3, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { title: "Gravar Reunião", url: "/meetings/new", icon: Mic },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Reuniões", url: "/meetings", icon: CheckSquare },
  { title: "Contatos", url: "/contacts", icon: Users },
  { title: "Empresas", url: "/companies", icon: Building2 },
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const initials = user
    ? `${(user.firstName || "")[0] || ""}${(user.lastName || "")[0] || ""}`.toUpperCase() || "U"
    : "U";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-sidebar-primary">
            <Mic className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-sidebar-foreground tracking-tight">VoiceCRM</h1>
            <p className="text-xs text-sidebar-foreground/60">Reuniões inteligentes</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                let isActive: boolean;
                if (item.url === "/dashboard") {
                  isActive = location === "/" || location === "/dashboard";
                } else if (item.url === "/meetings/new") {
                  isActive = location === "/meetings/new";
                } else if (item.url === "/meetings") {
                  isActive = location.startsWith("/meetings") && location !== "/meetings/new" && location !== "/meetings/new-manual";
                } else {
                  isActive = location.startsWith(item.url);
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate" data-testid="text-user-name">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate" data-testid="text-user-email">
              {user?.email}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => logout()}
            className="text-sidebar-foreground/60"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
