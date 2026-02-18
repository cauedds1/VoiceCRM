import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, User, Mail, Lock, Globe, Brain, Trash2, Loader2, AlertTriangle, Info } from "lucide-react";
import type { UserSettings } from "@shared/schema";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

const transcriptionLanguages = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
  { value: "ko", label: "한국어" },
];

const interfaceLanguages = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en", label: "English" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const extractionLevels = [
    { value: "aggressive", label: t("settings.aggressive"), desc: t("settings.aggressiveDesc") },
    { value: "moderate", label: t("settings.moderate"), desc: t("settings.moderateDesc") },
    { value: "conservative", label: t("settings.conservative"), desc: t("settings.conservativeDesc") },
  ];

  const { data: settings, isLoading: settingsLoading } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileInit, setProfileInit] = useState(false);

  if (user && !profileInit) {
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setProfileInit(true);
  }

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const profileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      const res = await apiRequest("PATCH", "/api/account/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: t("settings.profileUpdated") });
    },
    onError: (err: Error) => {
      toast({ title: t("settings.profileError"), description: err.message, variant: "destructive" });
    },
  });

  const emailMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("PATCH", "/api/account/email", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setNewEmail("");
      setEmailPassword("");
      toast({ title: t("settings.emailUpdated") });
    },
    onError: (err: Error) => {
      toast({ title: t("settings.emailError"), description: err.message, variant: "destructive" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("PATCH", "/api/account/password", data);
      return res.json();
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: t("settings.passwordUpdated") });
    },
    onError: (err: Error) => {
      toast({ title: t("settings.passwordError"), description: err.message, variant: "destructive" });
    },
  });

  const settingsMutation = useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      const res = await apiRequest("PATCH", "/api/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: t("settings.settingsSaved") });
    },
    onError: (err: Error) => {
      toast({ title: t("settings.settingsError"), description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (data: { password: string }) => {
      const res = await apiRequest("DELETE", "/api/account", data);
      return res.json();
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (err: Error) => {
      toast({ title: t("settings.deleteError"), description: err.message, variant: "destructive" });
    },
  });

  const handleProfileSave = () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({ title: t("settings.fillNameRequired"), variant: "destructive" });
      return;
    }
    profileMutation.mutate({ firstName: firstName.trim(), lastName: lastName.trim() });
  };

  const handleEmailChange = () => {
    if (!newEmail.trim() || !emailPassword) {
      toast({ title: t("settings.fillEmailAndPassword"), variant: "destructive" });
      return;
    }
    emailMutation.mutate({ email: newEmail.trim(), password: emailPassword });
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({ title: t("settings.passwordMismatch"), variant: "destructive" });
      return;
    }
    if (!currentPassword || !newPassword) {
      toast({ title: t("settings.fillAllFields"), variant: "destructive" });
      return;
    }
    passwordMutation.mutate({ currentPassword, newPassword });
  };

  const handleDeleteAccount = () => {
    if (deleteConfirm !== t("settings.deleteConfirmWord")) {
      toast({ title: t("settings.typeDeleteRequired"), variant: "destructive" });
      return;
    }
    if (!deletePassword) {
      toast({ title: t("settings.passwordRequired"), variant: "destructive" });
      return;
    }
    deleteMutation.mutate({ password: deletePassword });
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-settings-title">
          <div className="p-1.5 rounded-md bg-gradient-to-br from-emerald-500 to-cyan-500">
            <Settings className="h-4 w-4 text-white" />
          </div>
          {t("settings.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("settings.subtitle")}</p>
      </div>

      <Tabs defaultValue="conta" className="w-full">
        <TabsList className="w-full grid grid-cols-4" data-testid="settings-tabs">
          <TabsTrigger value="conta" className="gap-1.5" data-testid="tab-conta">
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("settings.tabAccount")}</span>
          </TabsTrigger>
          <TabsTrigger value="idioma" className="gap-1.5" data-testid="tab-idioma">
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("settings.tabLanguage")}</span>
          </TabsTrigger>
          <TabsTrigger value="ia" className="gap-1.5" data-testid="tab-ia">
            <Brain className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("settings.tabAI")}</span>
          </TabsTrigger>
          <TabsTrigger value="perigo" className="gap-1.5" data-testid="tab-perigo">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("settings.tabDanger")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conta" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-500" />
                <h2 className="text-base font-semibold">{t("settings.profile")}</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t("settings.firstName")}</label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t("settings.lastName")}</label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              <Button
                onClick={handleProfileSave}
                disabled={profileMutation.isPending}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 border-0 text-white"
                data-testid="button-save-profile"
              >
                {profileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("settings.saveProfile")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-cyan-500" />
                <h2 className="text-base font-semibold">{t("settings.changeEmail")}</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("settings.currentEmail")}</label>
                <Input value={user?.email || ""} disabled className="opacity-60" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("settings.newEmail")}</label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={t("settings.newEmailPlaceholder")}
                  data-testid="input-new-email"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("settings.passwordToConfirm")}</label>
                <Input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder={t("settings.currentPasswordPlaceholder")}
                  data-testid="input-email-password"
                />
              </div>
              <Button
                onClick={handleEmailChange}
                disabled={emailMutation.isPending}
                variant="outline"
                data-testid="button-change-email"
              >
                {emailMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("settings.changeEmailButton")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-violet-500" />
                <h2 className="text-base font-semibold">{t("settings.changePassword")}</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("settings.currentPassword")}</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  data-testid="input-current-password"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("settings.newPassword")}</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  data-testid="input-new-password"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("settings.confirmNewPassword")}</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  data-testid="input-confirm-password"
                />
              </div>
              <Button
                onClick={handlePasswordChange}
                disabled={passwordMutation.isPending}
                variant="outline"
                data-testid="button-change-password"
              >
                {passwordMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("settings.changePasswordButton")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="idioma" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-500" />
                <h2 className="text-base font-semibold">{t("settings.interfaceLanguage")}</h2>
              </div>
            </CardHeader>
            <CardContent>
              <label className="text-xs text-muted-foreground mb-1 block">{t("settings.selectInterfaceLanguage")}</label>
              <Select
                value={settings?.interfaceLanguage || "pt-BR"}
                onValueChange={(val) => {
                  settingsMutation.mutate({ interfaceLanguage: val });
                  i18n.changeLanguage(val);
                }}
              >
                <SelectTrigger data-testid="select-interface-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {interfaceLanguages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-cyan-500" />
                <h2 className="text-base font-semibold">{t("settings.transcriptionLanguage")}</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground/70 flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                {t("settings.transcriptionLanguageHint")}
              </p>
              <Select
                value={settings?.transcriptionLanguage || "pt-BR"}
                onValueChange={(val) => settingsMutation.mutate({ transcriptionLanguage: val })}
              >
                <SelectTrigger data-testid="select-transcription-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transcriptionLanguages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ia" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-amber-500" />
                <h2 className="text-base font-semibold">{t("settings.aiTitle")}</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("settings.taskExtractionLevel")}</label>
                <p className="text-xs text-muted-foreground/70 mb-3 flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  {t("settings.taskExtractionHint")}
                </p>
                <div className="space-y-2">
                  {extractionLevels.map((level) => {
                    const isActive = (settings?.taskExtractionLevel || "aggressive") === level.value;
                    return (
                      <button
                        key={level.value}
                        onClick={() => settingsMutation.mutate({ taskExtractionLevel: level.value })}
                        className={`w-full text-left p-3 rounded-md border transition-colors ${
                          isActive
                            ? "border-emerald-500/50 bg-emerald-500/10"
                            : "border-border hover-elevate"
                        }`}
                        data-testid={`button-extraction-${level.value}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{level.label}</span>
                          {isActive && <Badge variant="secondary" className="text-xs">{t("status.active")}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{level.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="perigo" className="space-y-4 mt-4">
          <Card className="border-destructive/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" />
                <h2 className="text-base font-semibold text-destructive">{t("settings.deleteAccount")}</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-destructive">
                  {t("settings.deleteWarning")}
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("settings.yourPassword")}</label>
                <Input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder={t("settings.confirmWithPassword")}
                  data-testid="input-delete-password"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Digite <span className="font-bold text-destructive">{t("settings.deleteConfirmWord")}</span> para confirmar
                </label>
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={t("settings.deleteConfirmWord")}
                  data-testid="input-delete-confirm"
                />
              </div>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteMutation.isPending || deleteConfirm !== t("settings.deleteConfirmWord") || !deletePassword}
                data-testid="button-delete-account"
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("settings.deleteButton")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
