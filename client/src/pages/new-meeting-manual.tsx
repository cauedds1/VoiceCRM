import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { CalendarDays, Users, Loader2, FileText, ImagePlus, XCircle, Plus } from "lucide-react";
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
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const createMeeting = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/meetings", {
        title,
        summary: summary || undefined,
        contactIds: selectedContacts.length > 0 ? selectedContacts : undefined,
        date,
      });
      const meeting = await res.json();

      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((f) => formData.append("images", f));
        await fetch(`/api/meetings/${meeting.id}/attachments`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
      }
      return meeting;
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
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
                {t("meetingDetail.attachments")}
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 gap-1.5 text-xs"
                data-testid="button-add-manual-images"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("meetingDetail.uploadImages")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </CardHeader>
          <CardContent>
            {images.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">
                {t("meetingDetail.noAttachments")}
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((file, index) => (
                  <div key={index} className="relative group rounded-md overflow-hidden border border-border/50 aspect-square">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                      data-testid={`button-remove-manual-image-${index}`}
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
