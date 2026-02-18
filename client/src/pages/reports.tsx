import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CalendarDays, Users, Building2, CheckCircle2, Clock, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

interface MeetingsByMonth {
  months: { month: string; label: string; count: number }[];
  totalMeetings: number;
  thisMonth: number;
  lastMonth: number;
}

interface ReportSummary {
  totalMeetings: number;
  totalContacts: number;
  totalCompanies: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
}

interface DetailedReport {
  overdueTasks: Array<{
    id: string;
    title: string;
    description: string | null;
    priority: string;
    dueDate: string;
    meetingId: string | null;
    contactId: string | null;
    contactName: string | null;
    meetingTitle: string | null;
  }>;
  categoryBreakdown: Array<{ category: string; count: number }>;
  topContacts: Array<{ id: string; name: string; companyName: string | null; meetingCount: number }>;
  topCompanies: Array<{ id: string | null; name: string; logoUrl: string | null; meetingCount: number }>;
  taskCompletionRate: number;
  totalTasksCount: number;
  completedTasksCount: number;
  pendingTasksCount: number;
  overdueTasksCount: number;
}

const PIE_COLORS = [
  "hsl(172, 66%, 50%)",
  "hsl(190, 74%, 50%)",
  "hsl(160, 60%, 45%)",
  "hsl(263, 60%, 58%)",
  "hsl(38, 92%, 50%)",
  "hsl(350, 65%, 55%)",
  "hsl(215, 20%, 55%)",
];

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  const { t } = useTranslation();
  if (current > previous) {
    const pct = previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);
    return (
      <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-0.5">
        <TrendingUp className="h-3 w-3" />
        +{pct}%
      </span>
    );
  }
  if (current < previous) {
    const pct = Math.round(((previous - current) / previous) * 100);
    return (
      <span className="text-xs text-red-500 flex items-center gap-0.5">
        <TrendingDown className="h-3 w-3" />
        -{pct}%
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
      <Minus className="h-3 w-3" />
      {t("common.equal")}
    </span>
  );
}

function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

function PriorityBadge({ priority }: { priority: string }) {
  const { t } = useTranslation();
  const variant = priority === "high" ? "destructive" : priority === "medium" ? "secondary" : "outline";
  return <Badge variant={variant} className="text-[10px]">{t(`priority.${priority}`)}</Badge>;
}

export default function Reports() {
  const { t } = useTranslation();
  const { data: meetingsData, isLoading: loadingMeetings } = useQuery<MeetingsByMonth>({
    queryKey: ["/api/reports/meetings-by-month"],
  });
  const { data: summary, isLoading: loadingSummary } = useQuery<ReportSummary>({
    queryKey: ["/api/reports/summary"],
  });
  const { data: detailed, isLoading: loadingDetailed } = useQuery<DetailedReport>({
    queryKey: ["/api/reports/detailed"],
  });

  const isLoading = loadingMeetings || loadingSummary || loadingDetailed;

  const totalForPie = detailed?.categoryBreakdown.reduce((sum, c) => sum + c.count, 0) || 0;

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight" data-testid="text-reports-title">{t("reports.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("reports.subtitle")}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card data-testid="stat-total-meetings">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("reports.totalMeetings")}</p>
                    <p className="text-2xl font-bold mt-1">{summary?.totalMeetings || 0}</p>
                  </div>
                  <div className="p-2 rounded-md bg-gradient-to-br from-emerald-500 to-teal-500 shrink-0">
                    <CalendarDays className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="stat-total-contacts">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("reports.contacts")}</p>
                    <p className="text-2xl font-bold mt-1">{summary?.totalContacts || 0}</p>
                  </div>
                  <div className="p-2 rounded-md bg-gradient-to-br from-cyan-500 to-blue-500 shrink-0">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="stat-total-companies">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("reports.companies")}</p>
                    <p className="text-2xl font-bold mt-1">{summary?.totalCompanies || 0}</p>
                  </div>
                  <div className="p-2 rounded-md bg-gradient-to-br from-violet-500 to-purple-500 shrink-0">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="stat-tasks-overview">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{t("reports.tasks")}</p>
                    <p className="text-2xl font-bold mt-1">{summary?.completedTasks || 0}<span className="text-base font-normal text-muted-foreground">/{summary?.totalTasks || 0}</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {summary?.pendingTasks || 0} {t("reports.pendingCount")}
                      {detailed && detailed.overdueTasksCount > 0 && (
                        <span className="text-amber-500 ml-1">({detailed.overdueTasksCount} {t("reports.overdue")})</span>
                      )}
                    </p>
                    {detailed && detailed.totalTasksCount > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] text-muted-foreground">{t("reports.taskCompletion")}</span>
                          <span className="text-[10px] font-medium">{detailed.taskCompletionRate}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${detailed.taskCompletionRate}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-2 rounded-md bg-gradient-to-br from-amber-500 to-orange-500 shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {detailed && detailed.overdueTasks.length > 0 && (
        <Card data-testid="section-overdue-tasks">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold">{t("reports.overdueTasks")}</h2>
                <p className="text-xs text-muted-foreground">{t("reports.overdueTasksDesc")}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {detailed.overdueTasks.map((task) => {
                const days = getDaysOverdue(task.dueDate);
                const content = (
                  <div
                    key={task.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-md hover-elevate cursor-pointer"
                    data-testid={`row-overdue-task-${task.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        {task.meetingTitle && (
                          <p className="text-xs text-muted-foreground truncate">{task.meetingTitle}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <PriorityBadge priority={task.priority} />
                      <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">
                        {t("reports.daysOverdue", { count: days })}
                      </Badge>
                    </div>
                  </div>
                );
                if (task.meetingId) {
                  return <Link key={task.id} href={`/meetings/${task.meetingId}`}>{content}</Link>;
                }
                return content;
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3" data-testid="chart-meetings-by-month">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">{t("reports.meetingsByMonth")}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{t("reports.last12Months")}</p>
              </div>
              {meetingsData && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t("reports.thisMonth")}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold" data-testid="text-this-month">{meetingsData.thisMonth}</p>
                      <TrendIndicator current={meetingsData.thisMonth} previous={meetingsData.lastMonth} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : meetingsData && meetingsData.months.some((m) => m.count > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={meetingsData.months} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="fill-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [value, t("reports.chartLabel")]}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-16">
                <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t("reports.noMeetingsYet")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("reports.recordFirstAudio")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2" data-testid="chart-meetings-by-category">
          <CardHeader className="pb-2">
            <div>
              <h2 className="text-base font-semibold">{t("reports.meetingsByCategory")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("reports.meetingsByCategoryDesc")}</p>
            </div>
          </CardHeader>
          <CardContent>
            {loadingDetailed ? (
              <Skeleton className="h-64 w-full" />
            ) : detailed && detailed.categoryBreakdown.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={detailed.categoryBreakdown}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={2}
                    >
                      {detailed.categoryBreakdown.map((entry, index) => (
                        <Cell key={entry.category} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number, name: string) => {
                        const pct = totalForPie > 0 ? Math.round((value / totalForPie) * 100) : 0;
                        return [`${value} (${pct}%)`, t(`categories.${name}`)];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {detailed.categoryBreakdown.map((entry, index) => (
                    <div key={entry.category} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-xs text-muted-foreground">{t(`categories.${entry.category}`)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t("reports.noDataYet")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card data-testid="section-top-contacts">
          <CardHeader className="pb-2">
            <div>
              <h2 className="text-base font-semibold">{t("reports.topContacts")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("reports.topContactsDesc")}</p>
            </div>
          </CardHeader>
          <CardContent>
            {loadingDetailed ? (
              <Skeleton className="h-48 w-full" />
            ) : detailed && detailed.topContacts.length > 0 ? (
              <div className="space-y-1">
                {detailed.topContacts.map((contact) => (
                  <Link key={contact.id} href={`/contacts/${contact.id}`}>
                    <div
                      className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-md hover-elevate cursor-pointer"
                      data-testid={`row-top-contact-${contact.id}`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{contact.name}</p>
                        {contact.companyName && (
                          <p className="text-xs text-muted-foreground truncate">{contact.companyName}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {t("reports.meetingsCount", { count: contact.meetingCount })}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("reports.noDataYet")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="section-top-companies">
          <CardHeader className="pb-2">
            <div>
              <h2 className="text-base font-semibold">{t("reports.topCompanies")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("reports.topCompaniesDesc")}</p>
            </div>
          </CardHeader>
          <CardContent>
            {loadingDetailed ? (
              <Skeleton className="h-48 w-full" />
            ) : detailed && detailed.topCompanies.length > 0 ? (
              <div className="space-y-1">
                {detailed.topCompanies.map((company) => (
                  <Link key={company.id} href={`/companies/${company.id}`}>
                    <div
                      className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-md hover-elevate cursor-pointer"
                      data-testid={`row-top-company-${company.id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {company.logoUrl ? (
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={company.logoUrl} alt={company.name} />
                            <AvatarFallback><Building2 className="h-3.5 w-3.5" /></AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        )}
                        <p className="text-sm font-medium truncate">{company.name}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {t("reports.meetingsCount", { count: company.meetingCount })}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("reports.noDataYet")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
