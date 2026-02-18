import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { CalendarDays, Users, Loader2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Contact } from "@shared/schema";

export default function NewMeetingManual() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactSearch, setContactSearch] = useState("");

  const { data: contacts = [] } = useQuery<Contact[]>({ queryKey: ["/api/contacts"] });

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      (c.companyName || "").toLowerCase().includes(contactSearch.toLowerCase())
  );

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const createMeeting = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/meetings", {
        title,
        summary: summary || undefined,
        contactIds: selectedContacts.length > 0 ? selectedContacts : undefined,
        date,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({ title: t("newMeetingManual.meetingCreated") });
      navigate(`/meetings/${data.id}`);
    },
    onError: (error: Error) => {
      toast({ title: t("newMeetingManual.errorCreating"), description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: t("newMeetingManual.titleRequired"), variant: "destructive" });
      return;
    }
    createMeeting.mutate();
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("newMeetingManual.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("newMeetingManual.subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {t("newMeetingManual.meetingInfo")}
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("newMeetingManual.titleLabel")}</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("newMeetingManual.titlePlaceholder")}
                required
                data-testid="input-meeting-title"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("newMeetingManual.dateLabel")}</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-testid="input-meeting-date"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("newMeetingManual.summaryLabel")}</label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder={t("newMeetingManual.summaryPlaceholder")}
                rows={4}
                data-testid="input-meeting-summary"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              {t("newMeetingManual.participants")}
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {contacts.length > 0 ? (
              <>
                {contacts.length > 5 && (
                  <Input
                    placeholder={t("newMeetingManual.searchContact")}
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    data-testid="input-search-contacts"
                  />
                )}
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {filteredContacts.map((contact) => (
                    <label
                      key={contact.id}
                      className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => toggleContact(contact.id)}
                        className="rounded border-muted-foreground/40 text-primary focus:ring-primary"
                        data-testid={`checkbox-contact-${contact.id}`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{contact.name}</p>
                        {contact.companyName && (
                          <p className="text-xs text-muted-foreground truncate">{contact.companyName}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                {t("newMeetingManual.noContactsYet")}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" className="gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 border-0 text-white" disabled={createMeeting.isPending} data-testid="button-create-meeting">
            {createMeeting.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CalendarDays className="h-4 w-4" />
            )}
            {t("newMeetingManual.createMeeting")}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate("/meetings")} data-testid="button-cancel">
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}
