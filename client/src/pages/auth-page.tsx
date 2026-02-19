import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Mic, ArrowRight, Loader2, Shield, Database, Brain, HardDrive, UserCheck, Mail, FileText, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from "react-i18next";

export default function AuthPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const policyScrollRef = useRef<HTMLDivElement>(null);
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const isPending = isLoggingIn || isRegistering;

  const handlePolicyScroll = () => {
    const el = policyScrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setScrolledToBottom(true);
    }
  };

  useEffect(() => {
    if (mode === "register") {
      setScrolledToBottom(false);
      setAcceptedTerms(false);
    }
  }, [mode]);

  const policySections = [
    { icon: Database, titleKey: "privacy.dataCollectionTitle", textKey: "privacy.dataCollectionText" },
    { icon: Brain, titleKey: "privacy.dataProcessingTitle", textKey: "privacy.dataProcessingText" },
    { icon: HardDrive, titleKey: "privacy.dataStorageTitle", textKey: "privacy.dataStorageText" },
    { icon: UserCheck, titleKey: "privacy.userRightsTitle", textKey: "privacy.userRightsText" },
    { icon: Shield, titleKey: "privacy.dataSecurityTitle", textKey: "privacy.dataSecurityText" },
    { icon: Mail, titleKey: "privacy.contactTitle", textKey: "privacy.contactText" },
    { icon: FileText, titleKey: "privacy.termsTitle", textKey: "privacy.termsText" },
    { icon: CheckCircle, titleKey: "privacy.consentTitle", textKey: "privacy.consentText" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        if (!acceptedTerms) {
          toast({ title: t("auth.acceptTermsRequired"), variant: "destructive" });
          return;
        }
        await register({ email, password, firstName, lastName });
      }
      navigate("/");
    } catch (error: any) {
      const message = error?.message || t("auth.unexpectedError");
      let parsed = message;
      try {
        const body = JSON.parse(message.replace(/^\d+:\s*/, ""));
        parsed = body.message || message;
      } catch {}
      toast({ title: parsed, variant: "destructive" });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-background flex"
    >
      <div className={`flex-1 flex items-center justify-center p-6 ${mode === "register" ? "overflow-y-auto" : ""}`}>
        <div className={`w-full ${mode === "register" ? "max-w-2xl my-6" : "max-w-md"}`}>
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-gradient-to-br from-emerald-500 to-cyan-500">
                <Mic className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight">VoiceCRM</span>
            </div>
            <LanguageSwitcher />
          </div>

          <Card>
            <CardHeader className="pb-4">
              <h1 className="text-xl font-bold" data-testid="text-auth-title">
                {mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {mode === "login"
                  ? t("auth.loginSubtitle")
                  : t("auth.registerSubtitle")}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">{t("auth.firstName")}</label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder={t("auth.firstName")}
                        required
                        data-testid="input-first-name"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">{t("auth.lastName")}</label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder={t("auth.lastName")}
                        required
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{t("auth.email")}</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{t("auth.password")}</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? t("auth.passwordMinChars") : t("auth.passwordPlaceholder")}
                    required
                    minLength={mode === "register" ? 6 : undefined}
                    data-testid="input-password"
                  />
                </div>

                {mode === "register" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-500 shrink-0" />
                      <h3 className="text-sm font-semibold">{t("privacy.title")}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{t("auth.readPolicyBelow")}</p>
                    <div
                      ref={policyScrollRef}
                      onScroll={handlePolicyScroll}
                      className="max-h-64 overflow-y-auto rounded-md border border-border p-4 space-y-4 bg-muted/30"
                      data-testid="container-privacy-policy-scroll"
                    >
                      {policySections.map((section) => {
                        const Icon = section.icon;
                        return (
                          <div key={section.titleKey} className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <h4 className="text-xs font-semibold">{t(section.titleKey)}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line pl-5.5">
                              {t(section.textKey)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    {!scrolledToBottom && (
                      <p className="text-xs text-muted-foreground text-center animate-pulse">
                        {t("auth.scrollToRead")}
                      </p>
                    )}
                    <div className={`flex items-start gap-2 p-3 rounded-md border ${acceptedTerms ? "border-emerald-500/30 bg-emerald-500/5" : "border-border"} transition-colors`}>
                      <Checkbox
                        id="terms"
                        checked={acceptedTerms}
                        onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                        disabled={!scrolledToBottom}
                        data-testid="checkbox-accept-terms"
                        className="mt-0.5"
                      />
                      <label
                        htmlFor="terms"
                        className={`text-xs leading-relaxed cursor-pointer ${scrolledToBottom ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {t("auth.acceptTermsCheckbox")}
                      </label>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 border-0 text-white" disabled={isPending || (mode === "register" && !acceptedTerms)} data-testid="button-submit-auth">
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {mode === "login" ? t("auth.login") : t("auth.register")}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}
                  <button
                    type="button"
                    onClick={() => setMode(mode === "login" ? "register" : "login")}
                    className="ml-1 text-primary font-medium"
                    data-testid="button-toggle-mode"
                  >
                    {mode === "login" ? t("auth.register") : t("auth.login")}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {mode === "login" && (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-emerald-950 via-teal-950 to-cyan-950 p-12">
          <div className="max-w-md">
            <h2 className="text-2xl font-bold tracking-tight mb-4 text-white">
              {t("auth.heroTitle")} <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{t("auth.heroHighlight")}</span> {t("auth.heroTitleEnd")}
            </h2>
            <p className="text-emerald-100/70 leading-relaxed mb-6">
              {t("auth.heroDescription")}
            </p>
            <div className="space-y-3">
              {[
                t("auth.heroBullet1"),
                t("auth.heroBullet2"),
                t("auth.heroBullet3"),
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-emerald-100/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
