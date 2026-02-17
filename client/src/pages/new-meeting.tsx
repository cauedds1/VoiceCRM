import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Mic, Square, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/auth-utils";

type RecordingState = "idle" | "recording" | "processing" | "done" | "error";

export default function NewMeeting() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [bars, setBars] = useState<number[]>(Array.from({ length: 32 }, () => 4));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      toast({ title: "Reunião registrada com sucesso!" });
      setTimeout(() => setLocation(`/meetings/${data.id}`), 1500);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Sessão expirada", description: "Fazendo login novamente...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/auth"; }, 500);
        return;
      }
      setState("error");
      toast({ title: "Erro ao processar", description: error.message, variant: "destructive" });
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
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

      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);

      const updateBars = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const newBars = Array.from({ length: 32 }, (_, i) => {
          const idx = Math.floor((i / 32) * dataArray.length);
          return Math.max(4, (dataArray[idx] / 255) * 40);
        });
        setBars(newBars);
        animFrameRef.current = requestAnimationFrame(updateBars);
      };
      updateBars();
    } catch {
      toast({ title: "Erro ao acessar microfone", description: "Verifique as permissões do navegador", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setState("processing");
  };

  useEffect(() => {
    if (audioBlob && state === "processing") {
      processMeeting.mutate(audioBlob);
    }
  }, [audioBlob, state]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Nova Reunião</h1>
          <p className="text-muted-foreground mt-2">
            Grave um áudio descrevendo sua reunião e a IA organiza tudo automaticamente
          </p>
        </div>

        <Card className="overflow-visible">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-8">
              {state === "recording" && (
                <div className="flex items-end justify-center gap-0.5 h-12">
                  {bars.map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 rounded-full bg-primary transition-all duration-75"
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
              )}

              {state === "processing" && (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Processando reunião...</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Transcrevendo áudio e organizando informações
                    </p>
                  </div>
                </div>
              )}

              {state === "done" && (
                <div className="flex flex-col items-center gap-4">
                  <CheckCircle className="h-12 w-12 text-primary" />
                  <p className="text-sm font-medium">Reunião registrada com sucesso!</p>
                  <p className="text-xs text-muted-foreground">Redirecionando...</p>
                </div>
              )}

              {state === "error" && (
                <div className="flex flex-col items-center gap-4">
                  <AlertCircle className="h-12 w-12 text-destructive" />
                  <p className="text-sm font-medium">Erro ao processar</p>
                  <Button variant="ghost" onClick={() => setState("idle")}>
                    Tentar novamente
                  </Button>
                </div>
              )}

              {(state === "idle" || state === "recording") && (
                <>
                  {state === "recording" && (
                    <div className="text-center">
                      <p className="text-3xl font-mono font-bold text-primary" data-testid="text-duration">
                        {formatTime(duration)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">Gravando...</p>
                    </div>
                  )}

                  <div className="relative">
                    {state === "recording" && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
                        <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
                      </>
                    )}
                    <button
                      onClick={state === "recording" ? stopRecording : startRecording}
                      className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                        state === "recording"
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                      data-testid="button-record"
                    >
                      {state === "recording" ? (
                        <Square className="h-7 w-7" />
                      ) : (
                        <Mic className="h-8 w-8" />
                      )}
                    </button>
                  </div>

                  {state === "idle" && !audioBlob && (
                    <p className="text-sm text-muted-foreground text-center max-w-xs">
                      Toque no botão para gravar. Conte o que aconteceu na reunião com suas próprias palavras.
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
