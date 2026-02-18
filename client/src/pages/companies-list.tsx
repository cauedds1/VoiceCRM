import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Building2, Search, Plus, Users, Phone, Mail, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useTranslation } from "react-i18next";

export default function CompaniesList() {
  const { t } = useTranslation();
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
      toast({ title: t("companiesList.companyCreated") });
    },
  });

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.industry || "").toLowerCase().includes(search.toLowerCase())
  );

  const getContactCount = (companyId: string) =>
    contacts.filter((c) => c.companyId === companyId).length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("companiesList.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("companiesList.subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 border-0 text-white" data-testid="button-add-company">
              <Plus className="h-4 w-4" />
              {t("companiesList.newCompany")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("companiesList.newCompanyTitle")}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createCompany.mutate(data))} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("companiesList.nameLabel")}</FormLabel>
                    <FormControl><Input {...field} placeholder={t("companiesList.namePlaceholder")} data-testid="input-company-name" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="industry" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("companiesList.industryLabel")}</FormLabel>
                    <FormControl><Input {...field} placeholder={t("companiesList.industryPlaceholder")} data-testid="input-company-industry" /></FormControl>
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("companiesList.phoneLabel")}</FormLabel>
                      <FormControl><Input {...field} placeholder="(00) 00000-0000" data-testid="input-company-phone" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("companiesList.emailLabel")}</FormLabel>
                      <FormControl><Input {...field} placeholder={t("companiesList.emailPlaceholder")} data-testid="input-company-email" /></FormControl>
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("companiesList.addressLabel")}</FormLabel>
                    <FormControl><Input {...field} placeholder={t("companiesList.addressPlaceholder")} data-testid="input-company-address" /></FormControl>
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("companiesList.cityLabel")}</FormLabel>
                      <FormControl><Input {...field} placeholder={t("companiesList.cityPlaceholder")} data-testid="input-company-city" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("companiesList.stateLabel")}</FormLabel>
                      <FormControl><Input {...field} placeholder={t("companiesList.statePlaceholder")} data-testid="input-company-state" /></FormControl>
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 border-0 text-white" disabled={createCompany.isPending} data-testid="button-save-company">
                  {createCompany.isPending ? t("common.saving") : t("companiesList.saveCompany")}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("companiesList.searchPlaceholder")}
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
              {search ? t("companiesList.noCompanyFound") : t("companiesList.noCompanyYet")}
            </h3>
            <p className="text-muted-foreground">
              {search ? t("common.tryOtherTerms") : t("companiesList.companiesAutoCreated")}
            </p>
          </div>
        ) : (
          filtered.map((company) => (
            <Link key={company.id} href={`/companies/${company.id}`}>
              <Card className="hover-elevate cursor-pointer" data-testid={`company-item-${company.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={company.logoUrl || undefined} alt={company.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {company.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
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
