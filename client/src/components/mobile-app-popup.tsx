import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone, X } from "lucide-react";
import { SiApple, SiGoogleplay } from "react-icons/si";

const POPUP_DISMISSED_KEY = "voicecrm_app_popup_dismissed";

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

    const dismissed = localStorage.getItem(POPUP_DISMISSED_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  function handleDismiss() {
    setOpen(false);
    localStorage.setItem(POPUP_DISMISSED_KEY, Date.now().toString());
  }

  function handleStoreClick(store: "ios" | "android") {
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
            Tenha o VoiceCRM sempre à mão. Grave reuniões, acesse contatos e acompanhe tarefas direto do seu celular.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-2">
          <Button
            className="w-full gap-3 h-12"
            onClick={() => handleStoreClick("ios")}
            data-testid="button-download-ios"
          >
            <SiApple className="h-5 w-5" />
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[10px] opacity-80">Disponível na</span>
              <span className="text-sm font-semibold">App Store</span>
            </div>
          </Button>

          <Button
            className="w-full gap-3 h-12"
            onClick={() => handleStoreClick("android")}
            data-testid="button-download-android"
          >
            <SiGoogleplay className="h-5 w-5" />
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[10px] opacity-80">Disponível no</span>
              <span className="text-sm font-semibold">Google Play</span>
            </div>
          </Button>
        </div>

        <button
          onClick={handleDismiss}
          className="mt-1 text-sm text-muted-foreground hover:text-foreground transition-colors text-center w-full"
          data-testid="button-dismiss-popup"
        >
          Continuar no navegador
        </button>
      </DialogContent>
    </Dialog>
  );
}
