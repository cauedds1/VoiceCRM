import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Mic, Clock, Search, Plus, PenLine, FolderOpen, FolderClosed, ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2, FolderMinus, FolderPlus, List, LayoutGrid, Briefcase, UtensilsCrossed, Coffee, PhoneCall, MapPin, CalendarDays, MessageCircle, MessageSquare, CalendarClock } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import type { Meeting, MeetingFolder } from "@shared/schema";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MeetingsList() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({ queryKey: ["/api/meetings"] });
  const { data: folders = [] } = useQuery<MeetingFolder[]>({ queryKey: ["/api/meeting-folders"] });
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "folders">("folders");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["ungrouped"]));
  const [editingFolder, setEditingFolder] = useState<MeetingFolder | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [deletingFolder, setDeletingFolder] = useState<MeetingFolder | null>(null);
  const [movingMeeting, setMovingMeeting] = useState<Meeting | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [futureSectionExpanded, setFutureSectionExpanded] = useState(true);

  const dateLocale = i18n.language === "en" ? "en-US" : "pt-BR";

  const categoryIcons: Record<string, any> = {
    meeting: Briefcase,
    lunch: UtensilsCrossed,
    coffee: Coffee,
    call: PhoneCall,
    visit: MapPin,
    event: CalendarDays,
    casual: MessageCircle,
    whatsapp: SiWhatsapp,
  };

  const categoryKeys = ["meeting", "lunch", "coffee", "call", "visit", "event", "casual", "whatsapp"];

  const uniqueTopics = Array.from(new Set(
    meetings.map(m => m.topic).filter(Boolean) as string[]
  )).sort();

  const allFiltered = meetings.filter((m) => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.summary || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.topic || "").toLowerCase().includes(search.toLowerCase());
    const matchTopic = topicFilter === "all" || m.topic === topicFilter;
    const matchCategory = categoryFilter === "all" || m.category === categoryFilter;
    return matchSearch && matchTopic && matchCategory;
  });

  const futureMeetings = allFiltered
    .filter((m) => m.meetingType === "schedule")
    .sort((a, b) => new Date(a.scheduledDate || a.createdAt || 0).getTime() - new Date(b.scheduledDate || b.createdAt || 0).getTime());

  const filtered = allFiltered
    .filter((m) => m.meetingType !== "schedule")
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const folderMap = new Map<string, Meeting[]>();
  const ungrouped: Meeting[] = [];
  for (const m of filtered) {
    if (m.folderId) {
      if (!folderMap.has(m.folderId)) folderMap.set(m.folderId, []);
      folderMap.get(m.folderId)!.push(m);
    } else {
      ungrouped.push(m);
    }
  }

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renameFolderMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await apiRequest("PATCH", `/api/meeting-folders/${id}`, { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meeting-folders"] });
      setEditingFolder(null);
      toast({ title: t("folders.renamed") });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/meeting-folders/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meeting-folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      setDeletingFolder(null);
      toast({ title: t("folders.deleted") });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/meeting-folders", { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meeting-folders"] });
      setShowCreateFolder(false);
      setNewFolderName("");
      toast({ title: t("folders.created") });
    },
  });

  const moveMeetingMutation = useMutation({
    mutationFn: async ({ meetingId, folderId }: { meetingId: string; folderId: string | null }) => {
      const res = await apiRequest("PATCH", `/api/meetings/${meetingId}/folder`, { folderId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      setMovingMeeting(null);
      toast({ title: t("folders.meetingMoved") });
    },
  });

  const renderMeetingCard = (meeting: Meeting, showFolder = false) => (
    <div key={meeting.id} className="flex items-center gap-2">
      <Link href={`/meetings/${meeting.id}`} className="flex-1 min-w-0">
        <Card className="hover-elevate cursor-pointer" data-testid={`meeting-item-${meeting.id}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-medium">{meeting.title}</h3>
                  {(() => {
                    const cat = meeting.category || "meeting";
                    const CatIcon = categoryIcons[cat] || Briefcase;
                    return (
                      <Badge variant="outline" className="text-[10px] gap-1" data-testid={`badge-category-${meeting.id}`}>
                        <CatIcon className="h-3 w-3" />
                        {t(`categories.${cat}`)}
                      </Badge>
                    );
                  })()}
                  {showFolder && meeting.topic && (
                    <Badge variant="secondary" className="text-[10px]">{meeting.topic}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {meeting.date
                    ? new Date(meeting.date).toLocaleDateString(dateLocale, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </p>
                {meeting.summary && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                    {meeting.summary}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0" data-testid={`button-meeting-actions-${meeting.id}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {meeting.folderId ? (
            <DropdownMenuItem onSelect={() => moveMeetingMutation.mutate({ meetingId: meeting.id, folderId: null })} data-testid={`button-remove-from-folder-${meeting.id}`}>
              <FolderMinus className="h-4 w-4 mr-2" />
              {t("folders.removeFromFolder")}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={() => setMovingMeeting(meeting)} data-testid={`button-move-to-folder-${meeting.id}`}>
            <FolderPlus className="h-4 w-4 mr-2" />
            {t("folders.moveToFolder")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const renderFolderSection = (folder: MeetingFolder, folderMeetings: Meeting[]) => {
    const isExpanded = expandedFolders.has(folder.id);
    return (
      <div key={folder.id} className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleFolder(folder.id)}
            className="flex items-center gap-2 flex-1 min-w-0 py-1.5 px-2 rounded-md hover-elevate"
            data-testid={`button-toggle-folder-${folder.id}`}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            {isExpanded ? <FolderOpen className="h-4 w-4 text-emerald-500 shrink-0" /> : <FolderClosed className="h-4 w-4 text-emerald-500 shrink-0" />}
            <span className="text-sm font-medium truncate">{folder.name}</span>
            <Badge variant="secondary" className="text-[10px] ml-1 shrink-0">{folderMeetings.length}</Badge>
          </button>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid={`button-folder-actions-${folder.id}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => { setEditingFolder(folder); setEditFolderName(folder.name); }} data-testid={`button-rename-folder-${folder.id}`}>
                <Pencil className="h-4 w-4 mr-2" />
                {t("folders.rename")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setDeletingFolder(folder)} className="text-destructive" data-testid={`button-delete-folder-${folder.id}`}>
                <Trash2 className="h-4 w-4 mr-2" />
                {t("folders.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isExpanded && (
          <div className="space-y-2 pl-6 border-l-2 border-emerald-500/20 ml-3">
            {folderMeetings.map(m => renderMeetingCard(m))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto space-y-6">
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("meetingsList.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-meetings"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-category-filter">
            <SelectValue placeholder={t("categoryFilter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("categories.all")}</SelectItem>
            {categoryKeys.map(cat => {
              const Icon = categoryIcons[cat];
              return (
                <SelectItem key={cat} value={cat}>
                  <span className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    {t(`categories.${cat}`)}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {uniqueTopics.length > 0 && (
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="w-[200px]" data-testid="select-topic-filter">
              <SelectValue placeholder={t("folders.allTopics")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("folders.allTopics")}</SelectItem>
              {uniqueTopics.map(topic => (
                <SelectItem key={topic} value={topic}>{topic}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowCreateFolder(true)}
          data-testid="button-create-folder"
        >
          <FolderPlus className="h-4 w-4" />
          {t("folders.newFolder")}
        </Button>
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            data-testid="button-view-list"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "folders" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("folders")}
            data-testid="button-view-folders"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-64 mb-3" />
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-4 w-96" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {futureMeetings.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setFutureSectionExpanded(prev => !prev)}
                className="flex items-center gap-2 w-full py-1.5 px-2 rounded-md hover-elevate"
                data-testid="button-toggle-future-meetings"
              >
                {futureSectionExpanded ? <ChevronDown className="h-4 w-4 text-amber-500 shrink-0" /> : <ChevronRight className="h-4 w-4 text-amber-500 shrink-0" />}
                <CalendarClock className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Reuniões Futuras</span>
                <Badge className="text-[10px] ml-1 shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700" variant="outline">
                  {futureMeetings.length}
                </Badge>
              </button>
              {futureSectionExpanded && (
                <div className="space-y-2 pl-6 border-l-2 border-amber-400/40 ml-3">
                  {futureMeetings.map((meeting) => {
                    const cat = meeting.category || "meeting";
                    const CatIcon = categoryIcons[cat] || Briefcase;
                    const displayDate = meeting.scheduledDate
                      ? new Date(meeting.scheduledDate).toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" })
                      : "—";
                    return (
                      <div key={meeting.id} className="flex items-center gap-2">
                        <Link href={`/meetings/${meeting.id}`} className="flex-1 min-w-0">
                          <Card className="hover-elevate cursor-pointer border-amber-200/60 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-950/20" data-testid={`meeting-future-item-${meeting.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-sm font-medium">{meeting.title}</h3>
                                    <Badge className="text-[10px] gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700" variant="outline">
                                      <CalendarClock className="h-3 w-3" />
                                      Agendada
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] gap-1" data-testid={`badge-category-future-${meeting.id}`}>
                                      <CatIcon className="h-3 w-3" />
                                      {t(`categories.${cat}`)}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
                                    <CalendarDays className="h-3 w-3" />
                                    {displayDate}
                                  </p>
                                  {meeting.summary && (
                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                                      {meeting.summary}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0" data-testid={`button-meeting-actions-future-${meeting.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {meeting.folderId ? (
                              <DropdownMenuItem onSelect={() => moveMeetingMutation.mutate({ meetingId: meeting.id, folderId: null })} data-testid={`button-remove-from-folder-future-${meeting.id}`}>
                                <FolderMinus className="h-4 w-4 mr-2" />
                                {t("folders.removeFromFolder")}
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem onSelect={() => setMovingMeeting(meeting)} data-testid={`button-move-to-folder-future-${meeting.id}`}>
                              <FolderPlus className="h-4 w-4 mr-2" />
                              {t("folders.moveToFolder")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            {filtered.length === 0 && futureMeetings.length === 0 ? (
              <div className="text-center py-16">
                <Mic className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {search || topicFilter !== "all" || categoryFilter !== "all" ? t("meetingsList.noMeetingsFound") : t("meetingsList.noMeetingsYet")}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {search || topicFilter !== "all" || categoryFilter !== "all" ? t("meetingsList.tryOtherSearch") : t("meetingsList.recordFirstMeeting")}
                </p>
                {!search && topicFilter === "all" && categoryFilter === "all" && (
                  <Link href="/meetings/new">
                    <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 border-0 text-white">
                      <Plus className="h-4 w-4" />
                      {t("meetingsList.recordMeeting")}
                    </Button>
                  </Link>
                )}
              </div>
            ) : filtered.length === 0 ? null : viewMode === "list" ? (
              filtered.map((meeting) => renderMeetingCard(meeting, true))
            ) : (
              <div className="space-y-4">
                {folders.map(folder => renderFolderSection(folder, folderMap.get(folder.id) || []))}
                {ungrouped.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFolder("ungrouped")}
                        className="flex items-center gap-2 flex-1 min-w-0 py-1.5 px-2 rounded-md hover-elevate"
                        data-testid="button-toggle-ungrouped"
                      >
                        {expandedFolders.has("ungrouped") ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                        <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium text-muted-foreground">{t("folders.ungrouped")}</span>
                        <Badge variant="secondary" className="text-[10px] ml-1 shrink-0">{ungrouped.length}</Badge>
                      </button>
                    </div>
                    {expandedFolders.has("ungrouped") && (
                      <div className="space-y-2 pl-6 border-l-2 border-muted ml-3">
                        {ungrouped.map(m => renderMeetingCard(m, true))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={!!editingFolder} onOpenChange={() => setEditingFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("folders.renameFolder")}</DialogTitle>
          </DialogHeader>
          <Input
            value={editFolderName}
            onChange={(e) => setEditFolderName(e.target.value)}
            placeholder={t("folders.folderName")}
            data-testid="input-rename-folder"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFolder(null)}>{t("common.cancel")}</Button>
            <Button
              onClick={() => editingFolder && renameFolderMutation.mutate({ id: editingFolder.id, name: editFolderName })}
              disabled={!editFolderName.trim() || renameFolderMutation.isPending}
              data-testid="button-confirm-rename"
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingFolder} onOpenChange={() => setDeletingFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("folders.deleteFolder")}</AlertDialogTitle>
            <AlertDialogDescription>{t("folders.deleteFolderDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingFolder && deleteFolderMutation.mutate(deletingFolder.id)}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete-folder"
            >
              {t("folders.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!movingMeeting} onOpenChange={() => setMovingMeeting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("folders.moveToFolder")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {folders.map(folder => (
              <Button
                key={folder.id}
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => movingMeeting && moveMeetingMutation.mutate({ meetingId: movingMeeting.id, folderId: folder.id })}
                disabled={moveMeetingMutation.isPending}
                data-testid={`button-select-folder-${folder.id}`}
              >
                <FolderClosed className="h-4 w-4 text-emerald-500" />
                {folder.name}
              </Button>
            ))}
            {folders.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{t("folders.noFolders")}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("folders.newFolder")}</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder={t("folders.folderName")}
            data-testid="input-new-folder-name"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newFolderName.trim()) {
                createFolderMutation.mutate(newFolderName.trim());
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)}>{t("common.cancel")}</Button>
            <Button
              onClick={() => createFolderMutation.mutate(newFolderName.trim())}
              disabled={!newFolderName.trim() || createFolderMutation.isPending}
              data-testid="button-confirm-create-folder"
            >
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
