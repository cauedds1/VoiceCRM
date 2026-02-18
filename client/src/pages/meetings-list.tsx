import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Mic, Clock, Search, Plus, PenLine } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import type { Meeting } from "@shared/schema";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

export default function MeetingsList() {
  const { t } = useTranslation();
  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({ queryKey: ["/api/meetings"] });
  const [search, setSearch] = useState("");

  const dateLocale = i18n.language === "en" ? "en-US" : "pt-BR";

  const filtered = meetings
    .filter((m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.summary || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("meetingsList.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("meetingsList.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/meetings/new-manual">
            <Button variant="outline" className="gap-2" data-testid="button-new-meeting-manual">
              <PenLine className="h-4 w-4" />
              {t("common.manual")}
            </Button>
          </Link>
          <Link href="/meetings/new">
            <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 border-0 text-white" data-testid="button-new-meeting">
              <Mic className="h-4 w-4" />
              {t("meetingsList.newMeeting")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("meetingsList.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-meetings"
        />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-64 mb-3" />
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-4 w-96" />
              </CardContent>
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Mic className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {search ? t("meetingsList.noMeetingsFound") : t("meetingsList.noMeetingsYet")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {search ? t("meetingsList.tryOtherSearch") : t("meetingsList.recordFirstMeeting")}
            </p>
            {!search && (
              <Link href="/meetings/new">
                <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 border-0 text-white">
                  <Plus className="h-4 w-4" />
                  {t("meetingsList.recordMeeting")}
                </Button>
              </Link>
            )}
          </div>
        ) : (
          filtered.map((meeting) => (
            <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
              <Card className="hover-elevate cursor-pointer" data-testid={`meeting-item-${meeting.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
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
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                          {meeting.summary}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
