import { useLocation, Link } from "wouter";
import { LayoutDashboard, Mic, Users, Building2, CheckSquare, BarChart3, LogOut, ListTodo, Settings, CalendarDays, CloudUpload, WifiOff, Loader2, Trash2 } from "lucide-react";
import logoImg from "@/assets/images/logo.png";
import logoFullImg from "@/assets/images/logo-full.png";
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
import { useTranslation } from "react-i18next";
import { usePendingUploads } from "@/hooks/use-pending-uploads";

export function AppSidebar() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { pending, uploading, online, retryAll, clearAll } = usePendingUploads();

  const navItems = [
    { title: t("nav.recordMeeting"), url: "/meetings/new", icon: Mic },
    { title: t("nav.dashboard"), url: "/dashboard", icon: LayoutDashboard },
    { title: t("nav.meetings"), url: "/meetings", icon: CheckSquare },
    { title: t("nav.tasks"), url: "/tasks", icon: ListTodo },
    { title: t("nav.agenda"), url: "/agenda", icon: CalendarDays },
    { title: t("nav.contacts"), url: "/contacts", icon: Users },
    { title: t("nav.companies"), url: "/companies", icon: Building2 },
    { title: t("nav.reports"), url: "/reports", icon: BarChart3 },
    { title: t("nav.settings"), url: "/settings", icon: Settings },
  ];

  const initials = user
    ? `${(user.firstName || "")[0] || ""}${(user.lastName || "")[0] || ""}`.toUpperCase() || "U"
    : "U";

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-2">
        <div className="flex items-center gap-2">
          <img src={logoFullImg} alt="VoiceCRM" className="w-10 h-10" />
          <span className="text-[10px] text-sidebar-foreground/50 leading-tight">{t("nav.smartMeetings")}</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
            {t("nav.menu")}
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

                const isGravarReuniao = item.url === "/meetings/new";
                const buttonClasses = isGravarReuniao && !isActive ? "bg-gradient-to-r from-emerald-500/10 to-cyan-500/10" : "";

                return (
                  <div key={item.url}>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={buttonClasses}
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <Link href={item.url}>
                          <item.icon className={`h-4 w-4 ${isGravarReuniao ? "text-emerald-500" : ""}`} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {isGravarReuniao && <div className="my-2 mx-3 h-px bg-sidebar-border" />}
                  </div>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {pending.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="mx-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-1">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                  ) : !online ? (
                    <WifiOff className="h-4 w-4 text-amber-500" />
                  ) : (
                    <CloudUpload className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-xs font-medium text-amber-500" data-testid="text-pending-count">
                    {pending.length} {t("pendingUploads.pending", { count: pending.length })}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">
                  {uploading
                    ? t("pendingUploads.uploading")
                    : !online
                      ? t("pendingUploads.waitingConnection")
                      : t("pendingUploads.readyToUpload")}
                </p>
                <div className="flex gap-2">
                  {online && !uploading && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-xs gap-1 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                      onClick={retryAll}
                      data-testid="button-retry-pending"
                    >
                      <CloudUpload className="h-3 w-3" />
                      {t("pendingUploads.retryAll")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
                    onClick={clearAll}
                    data-testid="button-clear-pending"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t("pendingUploads.clearAll")}
                  </Button>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
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
