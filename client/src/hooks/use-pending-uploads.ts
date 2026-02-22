import { useState, useEffect, useCallback, useRef } from "react";
import {
  getPendingAudios,
  uploadPendingAudio,
  removeAudio,
  updateAudioStatus,
  isOnline,
  onOnline,
  type PendingAudio,
} from "@/lib/offline-audio";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 30000;

export function usePendingUploads() {
  const [pending, setPending] = useState<PendingAudio[]>([]);
  const [uploading, setUploading] = useState(false);
  const [online, setOnline] = useState(isOnline());
  const { toast } = useToast();
  const { t } = useTranslation();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const audios = await getPendingAudios();
      setPending(audios);
    } catch {}
  }, []);

  const processQueue = useCallback(async () => {
    if (!isOnline() || uploading) return;
    const audios = await getPendingAudios();
    const toUpload = audios.filter(
      (a) => (a.status === "pending" || a.status === "failed") && a.retryCount < MAX_RETRIES
    );
    if (toUpload.length === 0) return;

    setUploading(true);
    for (const audio of toUpload) {
      try {
        await updateAudioStatus(audio.id, "uploading");
        await uploadPendingAudio(audio);
        await removeAudio(audio.id);
        toast({ title: t("pendingUploads.uploadSuccess") });
        queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
        queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      } catch {
        await updateAudioStatus(audio.id, "failed", audio.retryCount + 1);
      }
    }
    setUploading(false);
    await refresh();
  }, [uploading, toast, t, refresh]);

  useEffect(() => {
    refresh();
    const cleanupOnline = onOnline(() => {
      setOnline(true);
      processQueue();
    });
    const handleOffline = () => setOnline(false);
    window.addEventListener("offline", handleOffline);
    return () => {
      cleanupOnline();
      window.removeEventListener("offline", handleOffline);
    };
  }, [refresh, processQueue]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (isOnline()) processQueue();
    }, RETRY_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [processQueue]);

  const retryAll = useCallback(async () => {
    await processQueue();
  }, [processQueue]);

  const discardAudio = useCallback(async (id: string) => {
    await removeAudio(id);
    await refresh();
  }, [refresh]);

  return { pending, uploading, online, retryAll, discardAudio, refresh };
}
