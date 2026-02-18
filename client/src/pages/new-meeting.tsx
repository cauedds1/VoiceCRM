import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Mic, Square, Loader2, CheckCircle, AlertCircle, Pause, Play, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/auth-utils";

type RecordingState = "idle" | "recording" | "paused" | "processing" | "done" | "error";

export default function NewMeeting() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [bars, setBars] = useState<number[]>(Array.from({ length: 32 }, () => 4));
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const wasRecordingBeforeDiscard = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const stateRef = useRef<RecordingState>("idle");

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const processMeeting = useMutation({
    mutationFn: async (audio: Blob) => {
      const formData = new FormData();
      formData.append("audio", audio, "recording.webm");
      const res = await fetch("/api/meetings/process-audio", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || res.statusText);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setState("done");
      toast({ title: t("newMeeting.success") });
      setTimeout(() => setLocation(`/meetings/${data.id}`), 1500);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: t("newMeeting.sessionExpired"), description: t("newMeeting.sessionExpiredDesc"), variant: "destructive" });
        setTimeout(() => { window.location.href = "/auth"; }, 500);
        return;
      }
      setState("error");
      toast({ title: t("newMeeting.errorProcessing"), description: error.message, variant: "destructive" });
    },
  });

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const updateBars = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const newBars = Array.from({ length: 32 }, (_, i) => {
      const idx = Math.floor((i / 32) * dataArray.length);
      return Math.max(4, (dataArray[idx] / 255) * 40);
    });
    setBars(newBars);
    animFrameRef.current = requestAnimationFrame(updateBars);
  }, []);

  const startVisualization = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    updateBars();
  }, [updateBars]);

  const stopVisualization = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setBars(Array.from({ length: 32 }, () => 4));
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        audioContext.close();
      };

      mediaRecorder.start(100);
      setState("recording");
      setDuration(0);
      startTimer();
      startVisualization();
    } catch {
      toast({ title: t("newMeeting.micError"), description: t("newMeeting.micErrorDesc"), variant: "destructive" });
    }
  };

  const pauseRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === "recording") {
      mr.pause();
      stopTimer();
      stopVisualization();
      setState("paused");
    }
  }, [stopTimer, stopVisualization]);

  const resumeRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === "paused") {
      mr.resume();
      startTimer();
      startVisualization();
      setState("recording");
    }
  }, [startTimer, startVisualization]);

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
    }
    stopTimer();
    stopVisualization();
    setState("processing");
  }, [stopTimer, stopVisualization]);

  const askDiscard = useCallback(() => {
    wasRecordingBeforeDiscard.current = state === "recording";
    if (state === "recording") {
      pauseRecording();
    }
    setShowDiscardConfirm(true);
  }, [state, pauseRecording]);

  const cancelDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
    if (wasRecordingBeforeDiscard.current) {
      resumeRecording();
    }
  }, [resumeRecording]);

  const discardRecording = useCallback(() => {
    setShowDiscardConfirm(false);
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.ondataavailable = null;
      mr.onstop = null;
      mr.stop();
    }
    stopTimer();
    stopVisualization();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    analyserRef.current = null;
    setAudioBlob(null);
    setDuration(0);
    setState("idle");
    toast({ title: t("newMeeting.discardDismissed") });
  }, [stopTimer, stopVisualization, toast, t]);

  useEffect(() => {
    if (audioBlob && state === "processing") {
      processMeeting.mutate(audioBlob);
    }
  }, [audioBlob, state]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (stateRef.current === "recording") {
          pauseRecording();
        }
      }
    };

    const handleBlur = () => {
      if (stateRef.current === "recording") {
        pauseRecording();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const s = stateRef.current;
      if (s === "recording" || s === "paused") {
        e.preventDefault();
        e.returnValue = t("newMeeting.beforeUnload");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pauseRecording, t]);

  useEffect(() => {
    return () => {
      stopTimer();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [stopTimer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isActive = state === "recording" || state === "paused";

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-full space-y-6">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" data-testid="text-new-meeting-title">{t("newMeeting.title")}</h1>
          <p className="text-muted-foreground mt-2">
            {state === "idle"
              ? t("newMeeting.idleDescription")
              : state === "paused"
                ? t("newMeeting.pausedDescription")
                : state === "recording"
                  ? t("newMeeting.recordingDescription")
                  : ""}
          </p>
        </div>

        <Card className="overflow-visible">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col items-center space-y-8">
              {(state === "recording" || state === "paused") && (
                <div className="flex items-end justify-center gap-0.5 h-12">
                  {bars.map((h, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-75 ${
                        state === "paused" ? "bg-muted-foreground/30" : "bg-emerald-500"
                      }`}
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
              )}

              {state === "processing" && (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 text-emerald-500 animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-medium">{t("newMeeting.processing")}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("newMeeting.processingDescription")}
                    </p>
                  </div>
                </div>
              )}

              {state === "done" && (
                <div className="flex flex-col items-center gap-4">
                  <CheckCircle className="h-12 w-12 text-emerald-500" />
                  <p className="text-sm font-medium">{t("newMeeting.success")}</p>
                  <p className="text-xs text-muted-foreground">{t("newMeeting.redirecting")}</p>
                </div>
              )}

              {state === "error" && (
                <div className="flex flex-col items-center gap-4">
                  <AlertCircle className="h-12 w-12 text-destructive" />
                  <p className="text-sm font-medium">{t("newMeeting.error")}</p>
                  <Button variant="ghost" onClick={() => setState("idle")} data-testid="button-retry">
                    {t("newMeeting.retry")}
                  </Button>
                </div>
              )}

              {(state === "idle" || isActive) && (
                <>
                  {isActive && (
                    <div className="text-center">
                      <p className="text-3xl font-mono font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent" data-testid="text-duration">
                        {formatTime(duration)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {state === "paused" ? t("newMeeting.paused") : t("newMeeting.recording")}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-6">
                    {isActive && (
                      <button
                        onClick={state === "paused" ? resumeRecording : pauseRecording}
                        className="w-14 h-14 rounded-full flex items-center justify-center bg-accent text-accent-foreground transition-all"
                        data-testid="button-pause-resume"
                        aria-label={state === "paused" ? t("newMeeting.resumeRecording") : t("newMeeting.pauseRecording")}
                      >
                        {state === "paused" ? (
                          <Play className="h-6 w-6" />
                        ) : (
                          <Pause className="h-6 w-6" />
                        )}
                      </button>
                    )}

                    <div className="relative">
                      {state === "recording" && (
                        <>
                          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse-ring" />
                          <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
                        </>
                      )}
                      <button
                        onClick={isActive ? stopRecording : startRecording}
                        className={`relative z-10 w-24 h-24 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-gradient-to-br from-emerald-500 to-cyan-500 text-white"
                        }`}
                        data-testid="button-record"
                        aria-label={isActive ? t("newMeeting.stopRecording") : t("newMeeting.startRecording")}
                      >
                        {isActive ? (
                          <Square className="h-8 w-8 sm:h-7 sm:w-7" />
                        ) : (
                          <Mic className="h-9 w-9 sm:h-8 sm:w-8" />
                        )}
                      </button>
                    </div>

                    {isActive && (
                      <button
                        onClick={askDiscard}
                        className="w-14 h-14 rounded-full flex items-center justify-center bg-accent text-muted-foreground transition-all"
                        data-testid="button-discard-recording"
                        aria-label={t("newMeeting.discardRecording")}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {showDiscardConfirm && (
                    <div className="flex flex-col items-center gap-3 p-4 rounded-md border border-destructive/30 bg-destructive/5 max-w-xs w-full">
                      <p className="text-sm font-medium text-center">
                        {t("newMeeting.discardTitle")}
                      </p>
                      <p className="text-xs text-muted-foreground text-center">
                        {t("newMeeting.discardDescription")}
                      </p>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={discardRecording}
                          data-testid="button-confirm-discard"
                        >
                          {t("newMeeting.discardConfirm")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelDiscard}
                          data-testid="button-cancel-discard"
                        >
                          {t("common.cancel")}
                        </Button>
                      </div>
                    </div>
                  )}

                  {!showDiscardConfirm && state === "idle" && !audioBlob && (
                    <p className="text-sm text-muted-foreground text-center max-w-xs">
                      {t("newMeeting.tapToRecord")}
                    </p>
                  )}

                  {!showDiscardConfirm && isActive && (
                    <p className="text-xs text-muted-foreground text-center max-w-xs">
                      {state === "paused"
                        ? t("newMeeting.pausedHelp")
                        : t("newMeeting.recordingHelp")}
                    </p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
