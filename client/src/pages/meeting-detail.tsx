import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import {
  ArrowLeft, Clock, Users, Building2, CheckSquare, FileText,
  Lightbulb, Edit2, Save, X, Trash2, Briefcase, UtensilsCrossed,
  Coffee, PhoneCall, MapPin, CalendarDays, MessageCircle
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import type { Meeting, Task, Decision, Contact } from "@shared/schema";

export default function MeetingDetail() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");

  const priorityLabel = (p: string) => {
    switch (p) { case "high": return t("priority.high"); case "medium": return t("priority.medium"); case "low": return t("priority.low"); default: return p; }
  };
  const priorityColor = (p: string): "destructive" | "secondary" | "outline" => {
    switch (p) { case "high": return "destructive"; case "medium": return "secondary"; default: return "outline"; }
  };
  const statusLabel = (s: string) => {
    switch (s) { case "pending": return t("status.pending"); case "in_progress": return t("status.in_progress"); case "completed": return t("status.completed"); default: return s; }
  };

  const dateLocale = i18n.language === "en" ? "en-US" : "pt-BR";

  const categoryIcons: Record<string, any> = {
    meeting: Briefcase,
    lunch: UtensilsCrossed,
    coffee: Coffee,
    call: PhoneCall,
    visit: MapPin,
    event: CalendarDays,
    casual: MessageCircle,
  };
  const categoryKeys = ["meeting", "lunch", "coffee", "call", "visit", "event", "casual"];

  const { data: meeting, isLoading } = useQuery<Meeting>({
    queryKey: ["/api/meetings", params.id],
  });
  const { data: meetingTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/meetings", params.id, "tasks"],
  });
  const { data: meetingDecisions = [] } = useQuery<Decision[]>({
    queryKey: ["/api/meetings", params.id, "decisions"],
  });
  const { data: meetingContacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/meetings", params.id, "contacts"],
  });

  const updateMeeting = useMutation({
    mutationFn: async (data: { title: string; summary: string }) =>
      apiRequest("PATCH", `/api/meetings/${params.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      setEditing(false);
      toast({ title: t("meetingDetail.updated") });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async (category: string) =>
      apiRequest("PATCH", `/api/meetings/${params.id}`, { category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({ title: t("meetingDetail.updated") });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/tasks/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", params.id, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const deleteMeeting = useMutation({
    mutationFn: async () => apiRequest("DELETE", `/api/meetings/${params.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({ title: t("meetingDetail.deleted") });
      navigate("/meetings");
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-64" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto text-center py-20">
        <p className="text-muted-foreground">{t("meetingDetail.notFound")}</p>
        <Link href="/meetings">
          <Button variant="ghost" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/meetings">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          {editing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-xl font-bold"
              data-testid="input-edit-title"
            />
          ) : (
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate" data-testid="text-meeting-title">
              {meeting.title}
            </h1>
          )}
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {meeting.date
              ? new Date(meeting.date).toLocaleDateString(dateLocale, {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{t("categoryLabel")}:</span>
            <Select
              value={meeting.category || "meeting"}
              onValueChange={(value) => updateCategory.mutate(value)}
            >
              <SelectTrigger className="h-7 w-[160px] text-xs" data-testid="select-meeting-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
          </div>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => updateMeeting.mutate({ title: editTitle, summary: editSummary })}
              disabled={updateMeeting.isPending}
              className="gap-1"
              data-testid="button-save-meeting"
            >
              <Save className="h-3.5 w-3.5" />
              {t("common.save")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} data-testid="button-cancel-edit">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditTitle(meeting.title);
                setEditSummary(meeting.summary || "");
                setEditing(true);
              }}
              className="gap-1"
              data-testid="button-edit-meeting"
            >
              <Edit2 className="h-3.5 w-3.5" />
              {t("common.edit")}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-destructive"
                  data-testid="button-delete-meeting"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("meetingDetail.delete")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("meetingDetail.deleteTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("meetingDetail.deleteDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-delete">
                    {t("meetingDetail.deleteCancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMeeting.mutate()}
                    disabled={deleteMeeting.isPending}
                    className="bg-destructive text-destructive-foreground"
                    data-testid="button-confirm-delete"
                  >
                    {t("meetingDetail.deleteConfirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-emerald-500 to-teal-500">
                  <FileText className="h-3.5 w-3.5 text-white" />
                </div>
                <h2 className="text-base font-semibold">{t("meetingDetail.summary")}</h2>
              </div>
            </CardHeader>
            <CardContent>
              {editing ? (
                <Textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  rows={5}
                  className="text-sm leading-relaxed"
                  data-testid="textarea-edit-summary"
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-meeting-summary">
                  {meeting.summary || t("meetingDetail.noSummary")}
                </p>
              )}
            </CardContent>
          </Card>

          {meeting.transcription && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-gradient-to-br from-cyan-500 to-blue-500">
                    <FileText className="h-3.5 w-3.5 text-white" />
                  </div>
                  <h2 className="text-base font-semibold">{t("meetingDetail.transcription")}</h2>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-transcription">
                  {meeting.transcription}
                </p>
              </CardContent>
            </Card>
          )}

          {meetingTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-gradient-to-br from-amber-500 to-orange-500">
                    <CheckSquare className="h-3.5 w-3.5 text-white" />
                  </div>
                  <h2 className="text-base font-semibold">{t("meetingDetail.tasks")} ({meetingTasks.length})</h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {meetingTasks.map((task) => (
                  <div key={task.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-3 rounded-md bg-accent/30" data-testid={`task-detail-${task.id}`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                      )}
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString(dateLocale, { day: "2-digit", month: "short" })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <Badge variant={priorityColor(task.priority)} className="text-xs">
                        {priorityLabel(task.priority)}
                      </Badge>
                      <Select
                        value={task.status}
                        onValueChange={(value) => updateTask.mutate({ id: task.id, status: value })}
                      >
                        <SelectTrigger className="w-32" data-testid={`select-task-status-${task.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{t("status.pending")}</SelectItem>
                          <SelectItem value="in_progress">{t("status.in_progress")}</SelectItem>
                          <SelectItem value="completed">{t("status.completed")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {meetingDecisions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-gradient-to-br from-violet-500 to-purple-500">
                    <Lightbulb className="h-3.5 w-3.5 text-white" />
                  </div>
                  <h2 className="text-base font-semibold">{t("meetingDetail.decisions")} ({meetingDecisions.length})</h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {meetingDecisions.map((decision) => (
                  <div key={decision.id} className="p-3 rounded-md bg-accent/30" data-testid={`decision-${decision.id}`}>
                    <p className="text-sm">{decision.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-cyan-500 to-blue-500">
                  <Users className="h-3.5 w-3.5 text-white" />
                </div>
                <h2 className="text-base font-semibold">{t("meetingDetail.participants")}</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {meetingContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("meetingDetail.noParticipants")}</p>
              ) : (
                meetingContacts.map((contact) => (
                  <Link key={contact.id} href={`/contacts/${contact.id}`}>
                    <div className="p-3 rounded-md hover-elevate cursor-pointer" data-testid={`contact-link-${contact.id}`}>
                      <p className="text-sm font-medium">{contact.name}</p>
                      {contact.companyName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3" />
                          {contact.companyName}
                        </p>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
