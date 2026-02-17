import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Mic, Clock, Search, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import type { Meeting } from "@shared/schema";

export default function MeetingsList() {
  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({ queryKey: ["/api/meetings"] });
  const [search, setSearch] = useState("");

  const filtered = meetings
    .filter((m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.summary || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reuniões</h1>
          <p className="text-muted-foreground mt-1">Histórico de todas as suas reuniões</p>
        </div>
        <Link href="/meetings/new">
          <Button className="gap-2" data-testid="button-new-meeting">
            <Mic className="h-4 w-4" />
            Nova Reunião
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar reuniões..."
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
              {search ? "Nenhuma reunião encontrada" : "Nenhuma reunião ainda"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {search ? "Tente buscar com outros termos" : "Grave sua primeira reunião por áudio"}
            </p>
            {!search && (
              <Link href="/meetings/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Gravar reunião
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
                          ? new Date(meeting.date).toLocaleDateString("pt-BR", {
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
