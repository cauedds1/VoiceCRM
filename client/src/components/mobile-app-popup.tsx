import { useState, useEffect, useRef } from "react";
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

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

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
  const [installing, setInstalling] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setOpen(false);
      localStorage.setItem(POPUP_DISMISSED_KEY, "installed");
      deferredPromptRef.current = null;
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (isStandalone) return;

    const dismissed = localStorage.getItem(POPUP_DISMISSED_KEY);
    if (dismissed === "installed") return;

    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < DISMISS_DURATION_MS) return;
    }

    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [isMobile]);

  function handleDismiss() {
    setOpen(false);
    localStorage.setItem(POPUP_DISMISSED_KEY, Date.now().toString());
  }

  async function handleInstall() {
    if (deferredPromptRef.current) {
      setInstalling(true);
      try {
        await deferredPromptRef.current.prompt();
        const choice = await deferredPromptRef.current.userChoice;
        if (choice.outcome === "accepted") {
          localStorage.setItem(POPUP_DISMISSED_KEY, "installed");
          setOpen(false);
        }
      } finally {
        setInstalling(false);
        deferredPromptRef.current = null;
      }
    } else {
      alert(
        "Para instalar o VoiceCRM:\n\n" +
        "1. Toque no menu do navegador (⋮ ou ⫶)\n" +
        "2. Selecione \"Adicionar à tela inicial\"\n" +
        "3. Confirme a instalação\n\n" +
        "O app será adicionado à sua tela inicial!"
      );
    }
  }

  if (!isMobile) return null;

  const isInstalled = localStorage.getItem(POPUP_DISMISSED_KEY) === "installed";
  if (isInstalled) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] rounded-md" data-testid="popup-mobile-app">
        <DialogHeader className="text-center items-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-lg" data-testid="text-popup-title">
            Instalar VoiceCRM
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Instale o VoiceCRM no seu celular para acesso rápido. Grave reuniões, acesse contatos e acompanhe tarefas direto da tela inicial.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-2">
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleInstall}
            disabled={installing}
            data-testid="button-install-app"
          >
            <Download className="h-5 w-5" />
            {installing ? "Instalando..." : "Baixar App"}
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
