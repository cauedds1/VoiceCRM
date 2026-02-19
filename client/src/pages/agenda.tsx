import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Mic, Users, CalendarPlus } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import type { Meeting } from "@shared/schema";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function getMeetingDate(meeting: Meeting): Date | null {
  if (meeting.meetingType === "schedule" && meeting.scheduledDate) {
    return new Date(meeting.scheduledDate);
  }
  if (meeting.date) return new Date(meeting.date);
  if (meeting.createdAt) return new Date(meeting.createdAt);
  return null;
}

const CATEGORY_COLORS: Record<string, string> = {
  meeting: "bg-blue-500",
  lunch: "bg-amber-500",
  coffee: "bg-orange-400",
  call: "bg-emerald-500",
  visit: "bg-violet-500",
  event: "bg-rose-500",
  casual: "bg-cyan-500",
};

export default function AgendaPage() {
  const { t, i18n } = useTranslation();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const startDate = new Date(currentYear, currentMonth, 1).toISOString();
  const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: [`/api/calendar/meetings?start=${startDate}&end=${endDate}`],
  });

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const meetingsByDay = useMemo(() => {
    const map = new Map<number, Meeting[]>();
    for (const m of meetings) {
      const d = getMeetingDate(m);
      if (!d) continue;
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(m);
      }
    }
    return map;
  }, [meetings, currentMonth, currentYear]);

  const selectedMeetings = selectedDay ? (meetingsByDay.get(selectedDay) || []) : [];

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  }

  function goToToday() {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(today.getDate());
  }

  const locale = i18n.language === "pt-BR" ? "pt-BR" : "en-US";
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString(locale, { month: "long" });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, i);
    return d.toLocaleDateString(locale, { weekday: "short" }).slice(0, 3);
  });

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-agenda-title">
            {t("agenda.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("agenda.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={prevMonth} data-testid="button-prev-month">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-semibold capitalize min-w-[160px] text-center" data-testid="text-current-month">
                    {monthName} {currentYear}
                  </h2>
                  <Button size="icon" variant="ghost" onClick={nextMonth} data-testid="button-next-month">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={goToToday} data-testid="button-today">
                  {t("agenda.today")}
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-px">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2 uppercase">
                    {day}
                  </div>
                ))}

                {calendarCells.map((day, i) => {
                  if (day === null) {
                    return <div key={`empty-${i}`} className="aspect-square" />;
                  }

                  const dayMeetings = meetingsByDay.get(day) || [];
                  const hasScheduled = dayMeetings.some(m => m.meetingType === "schedule");
                  const hasRecorded = dayMeetings.some(m => m.meetingType !== "schedule");
                  const isSelected = selectedDay === day;
                  const todayClass = isToday(day);

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`aspect-square flex flex-col items-center justify-center rounded-md transition-colors relative
                        ${isSelected ? "bg-primary text-primary-foreground" : "hover-elevate"}
                        ${todayClass && !isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}
                      `}
                      data-testid={`calendar-day-${day}`}
                    >
                      <span className={`text-sm font-medium ${isSelected ? "text-primary-foreground" : ""}`}>
                        {day}
                      </span>
                      {dayMeetings.length > 0 && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {hasRecorded && (
                            <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-indigo-500"}`} />
                          )}
                          {hasScheduled && (
                            <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground/70" : "bg-amber-500"}`} />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>{t("agenda.recorded")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>{t("agenda.scheduled")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-4 md:p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2" data-testid="text-day-detail-title">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {selectedDay
                  ? `${selectedDay} ${monthName}`
                  : t("agenda.selectDay")}
              </h3>

              {isLoading ? (
                <div className="text-sm text-muted-foreground">{t("common.loading")}</div>
              ) : selectedDay && selectedMeetings.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{t("agenda.noMeetings")}</p>
                  <Link href="/meetings/new">
                    <Button variant="outline" size="sm" className="mt-3 gap-1.5" data-testid="button-record-from-agenda">
                      <Mic className="h-3.5 w-3.5" />
                      {t("agenda.recordNow")}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedMeetings.map((meeting) => {
                    const meetingDate = getMeetingDate(meeting);
                    const timeStr = meetingDate
                      ? meetingDate.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
                      : "";
                    const catColor = CATEGORY_COLORS[meeting.category] || CATEGORY_COLORS.meeting;

                    return (
                      <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                        <div
                          className="p-3 rounded-md border hover-elevate cursor-pointer transition-colors"
                          data-testid={`meeting-card-${meeting.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-1 h-full min-h-[40px] rounded-full ${catColor} shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="text-sm font-medium truncate">{meeting.title}</p>
                                {meeting.meetingType === "schedule" && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    <CalendarPlus className="h-2.5 w-2.5 mr-0.5" />
                                    {t("agenda.scheduledBadge")}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {timeStr && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {timeStr}
                                  </span>
                                )}
                                <span className="capitalize">{meeting.category}</span>
                              </div>
                              {meeting.summary && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {meeting.summary}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
