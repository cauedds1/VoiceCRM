import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import {
  ArrowLeft, Building2, Phone, Mail, MapPin, Clock, Edit2, Save, X, Search,
  Users, CalendarDays, Globe, FileText, Image as ImageIcon, Merge, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useRef } from "react";
import type { Company, Contact, Meeting } from "@shared/schema";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

type Tab = "info" | "meetings" | "contacts";

export default function CompanyDetail() {
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Company>>({});
  const [mergeTarget, setMergeTarget] = useState<Company | null>(null);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [meetingSearch, setMeetingSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [, navigate] = useLocation();

  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ["/api/companies", params.id],
  });
  const { data: companyContacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/companies", params.id, "contacts"],
  });
  const { data: companyMeetings = [] } = useQuery<Meeting[]>({
    queryKey: ["/api/companies", params.id, "meetings"],
  });

  const logoInputRef = useRef<HTMLInputElement>(null);

  const updateCompany = useMutation({
    mutationFn: async (data: Partial<Company>) =>
      apiRequest("PATCH", `/api/companies/${params.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setEditing(false);
      toast({ title: t("companyDetail.updated") });
    },
  });

  const mergeCompany = useMutation({
    mutationFn: async (targetId: string) =>
      apiRequest("POST", `/api/companies/${params.id}/merge`, { targetId }),
    onSuccess: async (res: any) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", data.targetCompany.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setShowMergeDialog(false);
      toast({ title: t("companyDetail.mergeSuccess") });
      navigate(`/companies/${data.targetCompany.id}`);
    },
    onError: () => {
      toast({ title: t("companyDetail.mergeError"), variant: "destructive" });
    },
  });

  const handleSave = async () => {
    if (editData.name && editData.name.trim() !== company?.name) {
      try {
        const res = await fetch(`/api/companies/check-name?name=${encodeURIComponent(editData.name.trim())}&excludeId=${params.id}`, { credentials: "include" });
        if (!res.ok) throw new Error("Check failed");
        const data = await res.json();
        if (data.exists && data.company) {
          setMergeTarget(data.company);
          setShowMergeDialog(true);
          return;
        }
      } catch {
        toast({ title: t("companyDetail.mergeError"), variant: "destructive" });
        return;
      }
    }
    updateCompany.mutate(editData);
  };

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch(`/api/companies/${params.id}/logo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: (data: Company) => {
      setEditData(prev => ({ ...prev, logoUrl: data.logoUrl }));
      queryClient.invalidateQueries({ queryKey: ["/api/companies", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: t("companyDetail.logoUploaded") });
    },
    onError: () => {
      toast({ title: t("companyDetail.logoUploadError"), variant: "destructive" });
    },
  });

  const dateLocale = i18n.language === "en" ? "en-US" : "pt-BR";

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto text-center py-20">
        <p className="text-muted-foreground">{t("companyDetail.notFound")}</p>
        <Link href="/companies">
          <Button variant="ghost" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Button>
        </Link>
      </div>
    );
  }

  const initials = company.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "info", label: t("companyDetail.info") },
    { key: "meetings", label: t("companyDetail.meetings"), count: companyMeetings.length },
    { key: "contacts", label: t("companyDetail.contacts"), count: companyContacts.length },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/companies">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Avatar className="h-12 w-12">
          <AvatarImage src={company.logoUrl || undefined} alt={company.name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" data-testid="text-company-name">{company.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            {company.industry && (
              <span className="text-sm text-muted-foreground">{company.industry}</span>
            )}
            {(company.city || company.state) && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {[company.city, company.state].filter(Boolean).join(" - ")}
              </span>
            )}
          </div>
        </div>
        {activeTab === "info" && !editing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setEditData(company); setEditing(true); }}
            className="gap-1"
            data-testid="button-edit-company"
          >
            <Edit2 className="h-3.5 w-3.5" />
            {t("common.edit")}
          </Button>
        )}
        {editing && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateCompany.isPending || mergeCompany.isPending}
              className="gap-1"
              data-testid="button-save-company"
            >
              <Save className="h-3.5 w-3.5" />
              {t("common.save")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setEditing(false); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
            data-testid={`tab-${tab.key}`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "info" && (
        <Card>
          <CardContent className="p-6 space-y-5">
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{t("companyDetail.name")}</label>
                  <Input value={editData.name || ""} onChange={(e) => setEditData({ ...editData, name: e.target.value })} data-testid="input-edit-name" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{t("companyDetail.industryEditLabel")}</label>
                  <Input value={editData.industry || ""} onChange={(e) => setEditData({ ...editData, industry: e.target.value })} placeholder={t("companyDetail.industryEditPlaceholder")} data-testid="input-edit-industry" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{t("companyDetail.logo")}</label>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={editData.logoUrl || company.logoUrl || undefined} alt={company.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadLogo.mutate(file);
                      }}
                      data-testid="input-upload-logo"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadLogo.isPending}
                      data-testid="button-upload-logo"
                    >
                      <ImageIcon className="h-4 w-4" />
                      {uploadLogo.isPending ? t("common.loading") : t("companyDetail.uploadLogo")}
                    </Button>
                    {company.logoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditData({ ...editData, logoUrl: null });
                          updateCompany.mutate({ logoUrl: null });
                        }}
                        data-testid="button-remove-logo"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">{t("companyDetail.phone")}</label>
                    <Input value={editData.phone || ""} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} data-testid="input-edit-phone" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">{t("companyDetail.email")}</label>
                    <Input value={editData.email || ""} onChange={(e) => setEditData({ ...editData, email: e.target.value })} data-testid="input-edit-email" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{t("companyDetail.address")}</label>
                  <Input value={editData.address || ""} onChange={(e) => setEditData({ ...editData, address: e.target.value })} data-testid="input-edit-address" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">{t("companyDetail.city")}</label>
                    <Input value={editData.city || ""} onChange={(e) => setEditData({ ...editData, city: e.target.value })} data-testid="input-edit-city" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">{t("companyDetail.state")}</label>
                    <Input value={editData.state || ""} onChange={(e) => setEditData({ ...editData, state: e.target.value })} data-testid="input-edit-state" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{t("companyDetail.notes")}</label>
                  <Textarea value={editData.notes || ""} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} rows={3} data-testid="textarea-edit-notes" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <InfoRow icon={Globe} label={t("companyDetail.industry")} value={company.industry} />
                  <InfoRow icon={Phone} label={t("companyDetail.phone")} value={company.phone} />
                  <InfoRow icon={Mail} label={t("companyDetail.email")} value={company.email} />
                  <InfoRow icon={MapPin} label={t("companyDetail.location")} value={[company.city, company.state].filter(Boolean).join(" - ") || null} />
                </div>
                {company.address && (
                  <InfoRow icon={MapPin} label={t("companyDetail.address")} value={company.address} />
                )}
                {company.logoUrl && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {t("companyDetail.logo")}
                    </p>
                    <img
                      src={company.logoUrl}
                      alt={`Logo ${company.name}`}
                      className="h-16 w-auto rounded-md object-contain"
                      data-testid="img-company-logo"
                    />
                  </div>
                )}
                {company.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {t("companyDetail.notes")}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{company.notes}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "meetings" && (() => {
        const filtered = companyMeetings.filter(m => {
          if (!meetingSearch.trim()) return true;
          const q = meetingSearch.toLowerCase();
          return (m.title?.toLowerCase().includes(q)) || (m.summary?.toLowerCase().includes(q));
        });
        return (
          <div className="flex flex-col gap-4">
            {companyMeetings.length > 0 && (
              <div className="relative mb-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("companyDetail.searchMeetings")}
                  value={meetingSearch}
                  onChange={(e) => setMeetingSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-meetings"
                />
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("companyDetail.noMeetings")}</h3>
                <p className="text-sm text-muted-foreground">{t("companyDetail.noMeetingsDesc")}</p>
              </div>
            ) : (
              filtered.map((meeting) => (
                <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                  <Card className="hover-elevate cursor-pointer" data-testid={`meeting-link-${meeting.id}`}>
                    <CardContent className="p-5">
                      <h3 className="text-base font-medium">{meeting.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {meeting.date
                          ? new Date(meeting.date).toLocaleDateString(dateLocale, {
                              weekday: "long",
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                      {meeting.summary && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">{meeting.summary}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        );
      })()}

      {activeTab === "contacts" && (() => {
        const filtered = companyContacts.filter(c => {
          if (!contactSearch.trim()) return true;
          const q = contactSearch.toLowerCase();
          return c.name.toLowerCase().includes(q) || (c.role?.toLowerCase().includes(q)) || (c.email?.toLowerCase().includes(q));
        });
        return (
          <div className="flex flex-col gap-4">
            {companyContacts.length > 0 && (
              <div className="relative mb-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("companyDetail.searchContacts")}
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-contacts"
                />
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("companyDetail.noContacts")}</h3>
                <p className="text-sm text-muted-foreground">{t("companyDetail.noContactsDesc")}</p>
              </div>
            ) : (
              filtered.map((contact) => (
                <Link key={contact.id} href={`/contacts/${contact.id}`}>
                  <Card className="hover-elevate cursor-pointer" data-testid={`contact-link-${contact.id}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-muted text-sm font-medium">
                          {contact.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{contact.name}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-0.5">
                          {contact.role && (
                            <span className="text-xs text-muted-foreground">{contact.role}</span>
                          )}
                          {contact.email && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </span>
                          )}
                          {contact.phone && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </span>
                          )}
                          {(contact.city || contact.state) && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {[contact.city, contact.state].filter(Boolean).join(" - ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        );
      })()}

      <AlertDialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Merge className="h-5 w-5 text-primary" />
              {t("companyDetail.mergeTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>{t("companyDetail.mergeDescription", { source: company?.name, target: mergeTarget?.name })}</p>
                <div className="rounded-md bg-muted p-3 space-y-1.5 text-sm">
                  <p className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    {t("companyDetail.mergeContactsInfo")}
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    {t("companyDetail.mergeMeetingsInfo")}
                  </p>
                  <p className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                    {t("companyDetail.mergeDeleteInfo", { source: company?.name })}
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-merge">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => mergeTarget && mergeCompany.mutate(mergeTarget.id)}
              disabled={mergeCompany.isPending}
              data-testid="button-confirm-merge"
            >
              <Merge className="h-4 w-4 mr-2" />
              {mergeCompany.isPending ? t("common.loading") : t("companyDetail.mergeConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) {
  const { t } = useTranslation();
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="text-sm">{value || <span className="text-muted-foreground">{t("common.notProvided")}</span>}</p>
    </div>
  );
}
