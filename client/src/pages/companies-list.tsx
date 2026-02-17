import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Building2, Search, Plus, Users, Phone, Mail, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import type { Company, Contact } from "@shared/schema";

export default function CompaniesList() {
  const { data: companies = [], isLoading } = useQuery<Company[]>({ queryKey: ["/api/companies"] });
  const { data: contacts = [] } = useQuery<Contact[]>({ queryKey: ["/api/contacts"] });
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: { name: "", industry: "", phone: "", email: "", address: "", city: "", state: "" },
  });

  const createCompany = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/companies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Empresa criada" });
    },
  });

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.industry || "").toLowerCase().includes(search.toLowerCase())
  );

  const getContactCount = (companyId: string) =>
    contacts.filter((c) => c.companyId === companyId).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground mt-1">Todas as empresas cadastradas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-company">
              <Plus className="h-4 w-4" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Empresa</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createCompany.mutate(data))} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl><Input {...field} placeholder="Nome da empresa" data-testid="input-company-name" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="industry" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Segmento</FormLabel>
                    <FormControl><Input {...field} placeholder="Ex: Construção Civil" data-testid="input-company-industry" /></FormControl>
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl><Input {...field} placeholder="(00) 00000-0000" data-testid="input-company-phone" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input {...field} placeholder="contato@empresa.com" data-testid="input-company-email" /></FormControl>
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl><Input {...field} placeholder="Endereço (opcional)" data-testid="input-company-address" /></FormControl>
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl><Input {...field} placeholder="Cidade (opcional)" data-testid="input-company-city" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl><Input {...field} placeholder="Estado (opcional)" data-testid="input-company-state" /></FormControl>
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full" disabled={createCompany.isPending} data-testid="button-save-company">
                  {createCompany.isPending ? "Salvando..." : "Salvar Empresa"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar empresas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-companies"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {search ? "Nenhuma empresa encontrada" : "Nenhuma empresa ainda"}
            </h3>
            <p className="text-muted-foreground">
              {search ? "Tente buscar com outros termos" : "Empresas são criadas automaticamente ao processar reuniões"}
            </p>
          </div>
        ) : (
          filtered.map((company) => (
            <Link key={company.id} href={`/companies/${company.id}`}>
              <Card className="hover-elevate cursor-pointer" data-testid={`company-item-${company.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-medium truncate">{company.name}</h3>
                      {company.industry && (
                        <p className="text-xs text-muted-foreground mt-1">{company.industry}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Users className="h-3 w-3" />
                      {getContactCount(company.id)}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {company.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {company.phone}
                      </p>
                    )}
                    {company.email && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {company.email}
                      </p>
                    )}
                    {(company.city || company.state) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[company.city, company.state].filter(Boolean).join(" - ")}
                      </p>
                    )}
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
