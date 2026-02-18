import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone, SquarePlus } from "lucide-react";
import { useTranslation } from "react-i18next";

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    return "ios";
  }
  if (/Android/i.test(ua)) {
    return "android";
  }
  return "other";
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

function IOSInstructions() {
  const { t } = useTranslation();
  const steps = [
    {
      number: 1,
      icon: <ShareIcon />,
      text: t("mobilePopup.iosStep1"),
      detail: t("mobilePopup.iosStep1Detail"),
    },
    {
      number: 2,
      icon: <SquarePlus className="h-5 w-5 text-primary" />,
      text: t("mobilePopup.iosStep2"),
      detail: t("mobilePopup.iosStep2Detail"),
    },
    {
      number: 3,
      icon: <Smartphone className="h-5 w-5 text-primary" />,
      text: t("mobilePopup.iosStep3"),
      detail: t("mobilePopup.iosStep3Detail"),
    },
  ];

  return (
    <div className="flex flex-col gap-3 mt-1" data-testid="ios-instructions">
      {steps.map((step) => (
        <div
          key={step.number}
          className="flex items-start gap-3 p-3 rounded-md bg-muted/50"
          data-testid={`ios-step-${step.number}`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {step.number}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {step.icon}
              <span className="text-sm font-medium">{step.text}</span>
            </div>
            <span className="text-xs text-muted-foreground">{step.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      className="h-5 w-5 text-primary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

export function MobileAppPopup() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const platform = typeof window !== "undefined" ? detectPlatform() : "other";
  const deferredPromptRef = useRef<any>(null);
  const [installReady, setInstallReady] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setInstallReady(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (isStandalone) return;

    const timer = setTimeout(() => setOpen(true), 2000);
    return () => clearTimeout(timer);
  }, [isMobile]);

  function handleDismiss() {
    setOpen(false);
  }

  async function handleInstall() {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt();
      const result = await deferredPromptRef.current.userChoice;
      if (result.outcome === "accepted") {
        deferredPromptRef.current = null;
        setInstallReady(false);
      }
      handleDismiss();
    }
  }

  if (!isMobile) return null;

  const isIOS = platform === "ios";
  const isAndroid = platform === "android";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] rounded-md" data-testid="popup-mobile-app">
        <DialogHeader className="text-center items-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-lg" data-testid="text-popup-title">
            {t("mobilePopup.title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground" data-testid="text-popup-description">
            {t("mobilePopup.description")}
          </DialogDescription>
        </DialogHeader>

        {isIOS ? (
          <IOSInstructions />
        ) : isAndroid && installReady ? (
          <div className="flex flex-col gap-3 mt-2">
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleInstall}
              data-testid="button-install-app"
            >
              <Smartphone className="h-5 w-5" />
              {t("mobilePopup.installButton")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-1">
            <div className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                1
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium">{t("mobilePopup.androidStep1")}</span>
                <span className="text-xs text-muted-foreground">{t("mobilePopup.androidStep1Detail")}</span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                2
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium">{t("mobilePopup.androidStep2")}</span>
                <span className="text-xs text-muted-foreground">{t("mobilePopup.androidStep2Detail")}</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleDismiss}
          className="mt-1 text-sm text-muted-foreground hover:text-foreground transition-colors text-center w-full"
          data-testid="button-dismiss-popup"
        >
          {t("common.notNow")}
        </button>
      </DialogContent>
    </Dialog>
  );
}
