import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { ArrowLeft, Database, Brain, HardDrive, UserCheck, Shield, Mail, FileText, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  const { t } = useTranslation();

  const sections = [
    {
      icon: Database,
      gradient: "from-emerald-500 to-teal-500",
      titleKey: "privacy.dataCollectionTitle",
      textKey: "privacy.dataCollectionText",
    },
    {
      icon: Brain,
      gradient: "from-cyan-500 to-blue-500",
      titleKey: "privacy.dataProcessingTitle",
      textKey: "privacy.dataProcessingText",
    },
    {
      icon: HardDrive,
      gradient: "from-teal-500 to-emerald-500",
      titleKey: "privacy.dataStorageTitle",
      textKey: "privacy.dataStorageText",
    },
    {
      icon: UserCheck,
      gradient: "from-emerald-500 to-cyan-500",
      titleKey: "privacy.userRightsTitle",
      textKey: "privacy.userRightsText",
    },
    {
      icon: Shield,
      gradient: "from-cyan-500 to-teal-500",
      titleKey: "privacy.dataSecurityTitle",
      textKey: "privacy.dataSecurityText",
    },
    {
      icon: Mail,
      gradient: "from-teal-500 to-cyan-500",
      titleKey: "privacy.contactTitle",
      textKey: "privacy.contactText",
    },
    {
      icon: FileText,
      gradient: "from-emerald-500 to-teal-500",
      titleKey: "privacy.termsTitle",
      textKey: "privacy.termsText",
    },
    {
      icon: CheckCircle,
      gradient: "from-cyan-500 to-emerald-500",
      titleKey: "privacy.consentTitle",
      textKey: "privacy.consentText",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back-privacy">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent" data-testid="text-privacy-title">
              {t("privacy.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1" data-testid="text-privacy-updated">
              {t("privacy.lastUpdated")}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.titleKey}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md bg-gradient-to-br ${section.gradient}`}>
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <h2 className="text-base font-semibold" data-testid={`text-${section.titleKey.replace("privacy.", "")}`}>
                      {t(section.titleKey)}
                    </h2>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line" data-testid={`text-${section.textKey.replace("privacy.", "")}`}>
                    {t(section.textKey)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center pt-4 pb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2" data-testid="button-back-bottom">
              <ArrowLeft className="h-4 w-4" />
              {t("privacy.backButton")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
