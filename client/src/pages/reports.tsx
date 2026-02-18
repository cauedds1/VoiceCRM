import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Users, Building2, CheckCircle2, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";

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

export default function Reports() {
  const { t } = useTranslation();
  const { data: meetingsData, isLoading: loadingMeetings } = useQuery<MeetingsByMonth>({
    queryKey: ["/api/reports/meetings-by-month"],
  });
  const { data: summary, isLoading: loadingSummary } = useQuery<ReportSummary>({
    queryKey: ["/api/reports/summary"],
  });

  const isLoading = loadingMeetings || loadingSummary;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
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
                  <div>
                    <p className="text-xs text-muted-foreground">{t("reports.tasks")}</p>
                    <p className="text-2xl font-bold mt-1">{summary?.completedTasks || 0}<span className="text-base font-normal text-muted-foreground">/{summary?.totalTasks || 0}</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5">{summary?.pendingTasks || 0} {t("reports.pendingCount")}</p>
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

      <Card data-testid="chart-meetings-by-month">
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
    </div>
  );
}
