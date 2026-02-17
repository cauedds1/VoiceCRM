import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Mic, Users, Building2, CheckSquare, Clock, ArrowRight, Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import type { Meeting, Task, Contact, Company } from "@shared/schema";

function StatCard({ title, value, icon: Icon, gradient, loading }: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  gradient: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</p>
            )}
          </div>
          <div className={`p-2.5 rounded-md bg-gradient-to-br ${gradient}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function priorityColor(priority: string) {
  switch (priority) {
    case "high": return "destructive";
    case "medium": return "secondary";
    case "low": return "outline";
    default: return "secondary";
  }
}

function priorityLabel(priority: string) {
  switch (priority) {
    case "high": return "Alta";
    case "medium": return "Média";
    case "low": return "Baixa";
    default: return priority;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "pending": return "Pendente";
    case "in_progress": return "Em progresso";
    case "completed": return "Concluída";
    default: return status;
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: meetings = [], isLoading: loadingMeetings } = useQuery<Meeting[]>({ queryKey: ["/api/meetings"] });
  const { data: tasks = [], isLoading: loadingTasks } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: contacts = [], isLoading: loadingContacts } = useQuery<Contact[]>({ queryKey: ["/api/contacts"] });
  const { data: companies = [], isLoading: loadingCompanies } = useQuery<Company[]>({ queryKey: ["/api/companies"] });

  const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "in_progress");
  const recentMeetings = [...meetings].sort((a, b) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  ).slice(0, 5);

  const isLoading = loadingMeetings || loadingTasks || loadingContacts || loadingCompanies;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" data-testid="text-welcome">
            Olá, <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">{user?.firstName || "Usuário"}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Aqui está o resumo das suas atividades
          </p>
        </div>
        <Link href="/meetings/new">
          <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 border-0 text-white" data-testid="button-new-meeting">
            <Mic className="h-4 w-4" />
            Nova Reunião
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Reuniões" value={meetings.length} icon={Mic} gradient="from-emerald-500 to-teal-500" loading={isLoading} />
        <StatCard title="Tarefas Pendentes" value={pendingTasks.length} icon={CheckSquare} gradient="from-amber-500 to-orange-500" loading={isLoading} />
        <StatCard title="Contatos" value={contacts.length} icon={Users} gradient="from-cyan-500 to-blue-500" loading={isLoading} />
        <StatCard title="Empresas" value={companies.length} icon={Building2} gradient="from-violet-500 to-purple-500" loading={isLoading} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <div>
              <h2 className="text-base font-semibold">Reuniões Recentes</h2>
              <p className="text-sm text-muted-foreground">Últimas reuniões registradas</p>
            </div>
            <Link href="/meetings">
              <Button variant="ghost" size="sm" className="gap-1" data-testid="link-all-meetings">
                Ver todas
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingMeetings ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 rounded-md">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))
            ) : recentMeetings.length === 0 ? (
              <div className="text-center py-8">
                <Mic className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma reunião registrada ainda</p>
                <Link href="/meetings/new">
                  <Button variant="ghost" size="sm" className="mt-2 gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Gravar primeira reunião
                  </Button>
                </Link>
              </div>
            ) : (
              recentMeetings.map((meeting) => (
                <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                  <div className="p-3 rounded-md hover-elevate cursor-pointer" data-testid={`meeting-card-${meeting.id}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{meeting.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {meeting.date ? new Date(meeting.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </p>
                      </div>
                    </div>
                    {meeting.summary && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{meeting.summary}</p>
                    )}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <div>
              <h2 className="text-base font-semibold">Tarefas Pendentes</h2>
              <p className="text-sm text-muted-foreground">Ações que precisam de atenção</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingTasks ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 rounded-md">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))
            ) : pendingTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente</p>
              </div>
            ) : (
              pendingTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="p-3 rounded-md hover-elevate" data-testid={`task-card-${task.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                      )}
                    </div>
                    <Badge variant={priorityColor(task.priority)} className="shrink-0">
                      {priorityLabel(task.priority)}
                    </Badge>
                  </div>
                  {task.dueDate && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(task.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
