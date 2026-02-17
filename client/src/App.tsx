import { Switch, Route } from "wouter";
import { useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import NewMeeting from "@/pages/new-meeting";
import MeetingsList from "@/pages/meetings-list";
import MeetingDetail from "@/pages/meeting-detail";
import ContactsList from "@/pages/contacts-list";
import ContactDetail from "@/pages/contact-detail";
import CompaniesList from "@/pages/companies-list";
import CompanyDetail from "@/pages/company-detail";
import NewMeetingManual from "@/pages/new-meeting-manual";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";
import { MobileAppPopup } from "@/components/mobile-app-popup";
import { Loader2 } from "lucide-react";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

function MobileHome() {
  const isMobile = useIsMobile();
  return isMobile ? <NewMeeting /> : <Dashboard />;
}

function SidebarMobileClose() {
  const { setOpenMobile } = useSidebar();
  const [location] = useLocation();

  useEffect(() => {
    setOpenMobile(false);
  }, [location, setOpenMobile]);

  return null;
}

function AuthenticatedLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <SidebarMobileClose />
      <MobileAppPopup />
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 p-2 border-b sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/" component={MobileHome} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/meetings/new" component={NewMeeting} />
              <Route path="/meetings/new-manual" component={NewMeetingManual} />
              <Route path="/meetings/:id" component={MeetingDetail} />
              <Route path="/meetings" component={MeetingsList} />
              <Route path="/contacts/:id" component={ContactDetail} />
              <Route path="/contacts" component={ContactsList} />
              <Route path="/companies/:id" component={CompanyDetail} />
              <Route path="/companies" component={CompaniesList} />
              <Route path="/reports" component={Reports} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route component={Landing} />
      </Switch>
    );
  }

  return <AuthenticatedLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
