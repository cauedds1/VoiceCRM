import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Mic, ArrowRight, Loader2 } from "lucide-react";
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
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const isPending = isLoggingIn || isRegistering;

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
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
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
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                      data-testid="checkbox-accept-terms"
                      className="mt-0.5"
                    />
                    <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      {t("auth.acceptTermsPrefix")}{" "}
                      <Link href="/privacy" className="text-primary underline" data-testid="link-privacy-policy">
                        {t("auth.privacyPolicyLink")}
                      </Link>
                    </label>
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
    </div>
  );
}
