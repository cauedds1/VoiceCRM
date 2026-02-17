import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  CheckSquare, Clock, Calendar, Filter, AlertCircle, Mic, Plus,
  User, UserPlus, X, Search
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import type { Task, Meeting, Contact } from "@shared/schema";

function priorityLabel(p: string) {
  switch (p) {
    case "high": return "Alta";
    case "medium": return "Média";
    case "low": return "Baixa";
    default: return p;
  }
}

function priorityBadgeVariant(p: string): "destructive" | "secondary" | "outline" {
  switch (p) {
    case "high": return "destructive";
    case "medium": return "secondary";
    default: return "outline";
  }
}

function statusColor(s: string) {
  switch (s) {
    case "pending": return "text-amber-500";
    case "in_progress": return "text-blue-500";
    case "completed": return "text-emerald-500";
    default: return "text-muted-foreground";
  }
}

type StatusFilter = "all" | "pending" | "in_progress" | "completed";
type PriorityFilter = "all" | "high" | "medium" | "low";

export default function TasksList() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactCompany, setNewContactCompany] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/tasks/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Tarefa atualizada" });
    },
  });

  const createTask = useMutation({
    mutationFn: async (data: { title: string; description?: string; priority: string; dueDate?: string; contactId?: string }) =>
      apiRequest("POST", "/api/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Tarefa criada com sucesso!" });
      resetDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar tarefa", description: error.message, variant: "destructive" });
    },
  });

  const createContact = useMutation({
    mutationFn: async (data: { name: string; companyName?: string; phone?: string; email?: string }) =>
      apiRequest("POST", "/api/contacts", data),
    onSuccess: async (res) => {
      const contact = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setSelectedContactId(contact.id);
      setShowNewContactForm(false);
      setShowContactPicker(false);
      setContactSearch("");
      setNewContactName("");
      setNewContactCompany("");
      setNewContactPhone("");
      setNewContactEmail("");
      toast({ title: "Contato criado e anexado!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar contato", description: error.message, variant: "destructive" });
    },
  });

  const resetDialog = () => {
    setDialogOpen(false);
    setNewTitle("");
    setNewDescription("");
    setNewPriority("medium");
    setNewDueDate("");
    setSelectedContactId(null);
    setShowContactPicker(false);
    setContactSearch("");
    setShowNewContactForm(false);
    setNewContactName("");
    setNewContactCompany("");
    setNewContactPhone("");
    setNewContactEmail("");
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast({ title: "Informe o título da tarefa", variant: "destructive" });
      return;
    }
    createTask.mutate({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      priority: newPriority,
      dueDate: newDueDate || undefined,
      contactId: selectedContactId || undefined,
    });
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) {
      toast({ title: "Informe o nome do contato", variant: "destructive" });
      return;
    }
    createContact.mutate({
      name: newContactName.trim(),
      companyName: newContactCompany.trim() || undefined,
      phone: newContactPhone.trim() || undefined,
      email: newContactEmail.trim() || undefined,
    });
  };

  const meetingsMap = new Map(meetings.map((m) => [m.id, m]));
  const contactsMap = new Map(contacts.map((c) => [c.id, c]));

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      (c.companyName || "").toLowerCase().includes(contactSearch.toLowerCase())
  );

  const selectedContact = selectedContactId ? contactsMap.get(selectedContactId) : null;

  const filtered = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" data-testid="text-tasks-title">
            Tarefas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Geradas pela IA ou adicionadas manualmente
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 border-0 text-white" data-testid="button-add-task">
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4 mt-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Título</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Enviar proposta para o cliente"
                  required
                  data-testid="input-task-title"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Descrição (opcional)</label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detalhes sobre a tarefa..."
                  rows={3}
                  data-testid="input-task-description"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Prioridade</label>
                  <Select value={newPriority} onValueChange={setNewPriority}>
                    <SelectTrigger data-testid="select-task-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Prazo (opcional)</label>
                  <Input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    data-testid="input-task-due-date"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Contato (opcional)</label>
                {selectedContact ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-accent/50">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedContact.name}</p>
                      {selectedContact.companyName && (
                        <p className="text-xs text-muted-foreground truncate">{selectedContact.companyName}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedContactId(null)}
                      data-testid="button-remove-contact"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : showContactPicker ? (
                  <div className="space-y-2">
                    {!showNewContactForm ? (
                      <>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Buscar contato..."
                            value={contactSearch}
                            onChange={(e) => setContactSearch(e.target.value)}
                            className="pl-8"
                            data-testid="input-search-task-contact"
                          />
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1 rounded-md border p-1">
                          {filteredContacts.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-3">
                              Nenhum contato encontrado
                            </p>
                          ) : (
                            filteredContacts.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setSelectedContactId(c.id);
                                  setShowContactPicker(false);
                                  setContactSearch("");
                                }}
                                className="w-full text-left p-2 rounded-md hover-elevate flex items-center gap-2"
                                data-testid={`select-contact-${c.id}`}
                              >
                                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{c.name}</p>
                                  {c.companyName && (
                                    <p className="text-xs text-muted-foreground truncate">{c.companyName}</p>
                                  )}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1 flex-1"
                            onClick={() => setShowNewContactForm(true)}
                            data-testid="button-new-contact-from-task"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            Novo Contato
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowContactPicker(false);
                              setContactSearch("");
                            }}
                            data-testid="button-cancel-contact-picker"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3 rounded-md border p-3">
                        <p className="text-xs font-medium text-muted-foreground">Novo Contato</p>
                        <Input
                          placeholder="Nome do contato"
                          value={newContactName}
                          onChange={(e) => setNewContactName(e.target.value)}
                          data-testid="input-new-contact-name"
                        />
                        <Input
                          placeholder="Empresa (opcional)"
                          value={newContactCompany}
                          onChange={(e) => setNewContactCompany(e.target.value)}
                          data-testid="input-new-contact-company"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Telefone"
                            value={newContactPhone}
                            onChange={(e) => setNewContactPhone(e.target.value)}
                            data-testid="input-new-contact-phone"
                          />
                          <Input
                            placeholder="Email"
                            value={newContactEmail}
                            onChange={(e) => setNewContactEmail(e.target.value)}
                            data-testid="input-new-contact-email"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="flex-1 gap-1 bg-gradient-to-r from-emerald-500 to-cyan-500 border-0 text-white"
                            onClick={handleCreateContact}
                            disabled={createContact.isPending}
                            data-testid="button-save-new-contact"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            {createContact.isPending ? "Salvando..." : "Salvar Contato"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowNewContactForm(false);
                              setNewContactName("");
                              setNewContactCompany("");
                              setNewContactPhone("");
                              setNewContactEmail("");
                            }}
                            data-testid="button-cancel-new-contact"
                          >
                            Voltar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 justify-start text-muted-foreground"
                    onClick={() => setShowContactPicker(true)}
                    data-testid="button-attach-contact"
                  >
                    <User className="h-4 w-4" />
                    Anexar Contato
                  </Button>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 border-0 text-white"
                disabled={createTask.isPending}
                data-testid="button-save-task"
              >
                {createTask.isPending ? "Criando..." : "Criar Tarefa"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-gradient-to-br from-amber-500 to-orange-500 shrink-0">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
              {isLoading ? (
                <Skeleton className="h-6 w-8 mt-0.5" />
              ) : (
                <p className="text-lg font-bold" data-testid="stat-pending-tasks">{pendingCount}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-gradient-to-br from-blue-500 to-indigo-500 shrink-0">
              <AlertCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Em progresso</p>
              {isLoading ? (
                <Skeleton className="h-6 w-8 mt-0.5" />
              ) : (
                <p className="text-lg font-bold" data-testid="stat-progress-tasks">{inProgressCount}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-gradient-to-br from-emerald-500 to-teal-500 shrink-0">
              <CheckSquare className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Concluídas</p>
              {isLoading ? (
                <Skeleton className="h-6 w-8 mt-0.5" />
              ) : (
                <p className="text-lg font-bold" data-testid="stat-completed-tasks">{completedCount}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filtros:
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em progresso</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}>
          <SelectTrigger className="w-40" data-testid="select-priority-filter">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas prioridades</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
        {(statusFilter !== "all" || priorityFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setPriorityFilter("all");
            }}
            data-testid="button-clear-filters"
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="p-3 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 w-fit mx-auto mb-4">
            <CheckSquare className="h-10 w-10 text-amber-500/50" />
          </div>
          <h3 className="text-lg font-medium mb-2">
            {tasks.length === 0 ? "Nenhuma tarefa ainda" : "Nenhuma tarefa encontrada"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {tasks.length === 0
              ? "Adicione tarefas manualmente ou grave uma reunião para a IA identificar automaticamente"
              : "Tente alterar os filtros para encontrar suas tarefas"}
          </p>
          {tasks.length === 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <Button
                className="gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 border-0 text-white"
                onClick={() => setDialogOpen(true)}
                data-testid="button-add-task-empty"
              >
                <Plus className="h-4 w-4" />
                Nova Tarefa
              </Button>
              <Link href="/meetings/new">
                <Button variant="outline" className="gap-2" data-testid="button-new-meeting-from-tasks">
                  <Mic className="h-4 w-4" />
                  Gravar Reunião
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const meeting = task.meetingId ? meetingsMap.get(task.meetingId) : null;
            const contact = task.contactId ? contactsMap.get(task.contactId) : null;
            const isOverdue = task.dueDate && task.status !== "completed" && new Date(task.dueDate) < new Date();

            return (
              <Card key={task.id} data-testid={`task-item-${task.id}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${statusColor(task.status).replace("text-", "bg-")}`} />
                        <h3 className={`text-sm font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </h3>
                        <Badge variant={priorityBadgeVariant(task.priority)} className="text-xs">
                          {priorityLabel(task.priority)}
                        </Badge>
                      </div>

                      {task.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pl-4">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pl-4">
                        {contact && (
                          <Link href={`/contacts/${contact.id}`}>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer" data-testid={`task-contact-link-${task.id}`}>
                              <User className="h-3 w-3" />
                              {contact.name}
                            </span>
                          </Link>
                        )}
                        {task.dueDate && (
                          <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                            <Calendar className="h-3 w-3" />
                            {isOverdue && "Atrasada: "}
                            {new Date(task.dueDate).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                        {meeting && (
                          <Link href={`/meetings/${meeting.id}`}>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer" data-testid={`task-meeting-link-${task.id}`}>
                              <Mic className="h-3 w-3" />
                              {meeting.title}
                            </span>
                          </Link>
                        )}
                        {!task.meetingId && !task.contactId && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`task-manual-label-${task.id}`}>
                            <Plus className="h-3 w-3" />
                            Manual
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 self-end sm:self-start">
                      <Select
                        value={task.status}
                        onValueChange={(value) => updateTask.mutate({ id: task.id, status: value })}
                      >
                        <SelectTrigger className="w-36" data-testid={`select-task-status-${task.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="in_progress">Em progresso</SelectItem>
                          <SelectItem value="completed">Concluída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
