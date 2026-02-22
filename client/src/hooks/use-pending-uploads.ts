import { useState, useEffect, useCallback } from "react";
import {
  getPendingAudios,
  clearAllPendingAudios,
  isOnline,
  type PendingAudio,
} from "@/lib/offline-audio";

export function usePendingUploads() {
  const [pending, setPending] = useState<PendingAudio[]>([]);
  const [online, setOnline] = useState(isOnline());

  const refresh = useCallback(async () => {
    try {
      const audios = await getPendingAudios();
      setPending(audios);
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refresh]);

  const clearAll = useCallback(async () => {
    await clearAllPendingAudios();
    setPending([]);
  }, []);

  return { pending, online, clearAll, refresh };
}
