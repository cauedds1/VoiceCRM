import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Building2, Phone, Mail, Clock, Edit2, Save, X, Mic, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import type { Contact, Meeting } from "@shared/schema";

export default function ContactDetail() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Contact>>({});

  const { data: contact, isLoading } = useQuery<Contact>({
    queryKey: ["/api/contacts", params.id],
  });
  const { data: contactMeetings = [] } = useQuery<Meeting[]>({
    queryKey: ["/api/contacts", params.id, "meetings"],
  });

  const updateContact = useMutation({
    mutationFn: async (data: Partial<Contact>) =>
      apiRequest("PATCH", `/api/contacts/${params.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setEditing(false);
      toast({ title: "Contato atualizado" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <div className="md:col-span-2"><Skeleton className="h-64" /></div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center py-20">
        <p className="text-muted-foreground">Contato não encontrado</p>
        <Link href="/contacts">
          <Button variant="ghost" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/contacts">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-contact-name">{contact.name}</h1>
          {contact.companyName && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Building2 className="h-3.5 w-3.5" />
              {contact.companyName}
            </p>
          )}
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => updateContact.mutate(editData)} disabled={updateContact.isPending} className="gap-1" data-testid="button-save-contact">
              <Save className="h-3.5 w-3.5" />
              Salvar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => { setEditData(contact); setEditing(true); }} className="gap-1" data-testid="button-edit-contact">
            <Edit2 className="h-3.5 w-3.5" />
            Editar
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-base font-semibold">Informações</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div>
                  <label className="text-xs text-muted-foreground">Nome</label>
                  <Input value={editData.name || ""} onChange={(e) => setEditData({ ...editData, name: e.target.value })} data-testid="input-edit-name" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Empresa</label>
                  <Input value={editData.companyName || ""} onChange={(e) => setEditData({ ...editData, companyName: e.target.value })} data-testid="input-edit-company" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Cargo</label>
                  <Input value={editData.role || ""} onChange={(e) => setEditData({ ...editData, role: e.target.value })} data-testid="input-edit-role" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Telefone</label>
                  <Input value={editData.phone || ""} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} data-testid="input-edit-phone" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <Input value={editData.email || ""} onChange={(e) => setEditData({ ...editData, email: e.target.value })} data-testid="input-edit-email" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Cidade</label>
                  <Input value={editData.city || ""} onChange={(e) => setEditData({ ...editData, city: e.target.value })} data-testid="input-edit-city" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Estado</label>
                  <Input value={editData.state || ""} onChange={(e) => setEditData({ ...editData, state: e.target.value })} data-testid="input-edit-state" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Notas</label>
                  <Textarea value={editData.notes || ""} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} rows={3} data-testid="textarea-edit-notes" />
                </div>
              </>
            ) : (
              <>
                {contact.role && (
                  <div>
                    <p className="text-xs text-muted-foreground">Cargo</p>
                    <p className="text-sm">{contact.role}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="text-sm flex items-center gap-1">
                    {contact.phone ? (
                      <><Phone className="h-3 w-3 text-muted-foreground" />{contact.phone}</>
                    ) : (
                      <span className="text-muted-foreground">Não informado</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm flex items-center gap-1">
                    {contact.email ? (
                      <><Mail className="h-3 w-3 text-muted-foreground" />{contact.email}</>
                    ) : (
                      <span className="text-muted-foreground">Não informado</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Localização</p>
                  <p className="text-sm flex items-center gap-1">
                    {(contact.city || contact.state) ? (
                      <><MapPin className="h-3 w-3 text-muted-foreground" />{[contact.city, contact.state].filter(Boolean).join(" - ")}</>
                    ) : (
                      <span className="text-muted-foreground">Não informado</span>
                    )}
                  </p>
                </div>
                {contact.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">Notas</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{contact.notes}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <h2 className="text-base font-semibold">Histórico de Reuniões</h2>
            </CardHeader>
            <CardContent className="space-y-2">
              {contactMeetings.length === 0 ? (
                <div className="text-center py-8">
                  <Mic className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma reunião com este contato</p>
                </div>
              ) : (
                contactMeetings.map((meeting) => (
                  <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                    <div className="p-3 rounded-md hover-elevate cursor-pointer" data-testid={`meeting-link-${meeting.id}`}>
                      <p className="text-sm font-medium">{meeting.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {meeting.date ? new Date(meeting.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
                      </p>
                      {meeting.summary && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{meeting.summary}</p>
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
