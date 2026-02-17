import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Smartphone } from "lucide-react";

const POPUP_DISMISSED_KEY = "voicecrm_app_popup_dismissed";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000;

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

export function MobileAppPopup() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (isStandalone) return;

    const dismissed = localStorage.getItem(POPUP_DISMISSED_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (!isNaN(dismissedAt) && Date.now() - dismissedAt < DISMISS_DURATION_MS) return;
    }

    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [isMobile]);

  function handleDismiss() {
    setOpen(false);
    localStorage.setItem(POPUP_DISMISSED_KEY, Date.now().toString());
  }

  function handleDownload() {
    const link = document.createElement("a");
    link.href = "/voicecrm.apk";
    link.download = "VoiceCRM.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleDismiss();
  }

  if (!isMobile) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] rounded-md" data-testid="popup-mobile-app">
        <DialogHeader className="text-center items-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-lg" data-testid="text-popup-title">
            Baixe o App VoiceCRM
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Instale o VoiceCRM no seu celular para acesso rápido. Grave reuniões, acesse contatos e acompanhe tarefas direto da tela inicial.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-2">
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleDownload}
            data-testid="button-install-app"
          >
            <Download className="h-5 w-5" />
            Baixar App
          </Button>
        </div>

        <button
          onClick={handleDismiss}
          className="mt-1 text-sm text-muted-foreground hover:text-foreground transition-colors text-center w-full"
          data-testid="button-dismiss-popup"
        >
          Agora não
        </button>
      </DialogContent>
    </Dialog>
  );
}
