import { useState, useEffect } from "react";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Clock,
  Timer,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Play,
  RotateCcw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useMutationQueue,
  retryFailedMutations,
  retryMutation,
  dismissMutation,
  formatTimeDifference,
  type MutationTask,
} from "@/lib/mutation-queue";
import { useSyncStatus, syncNow } from "@/lib/account";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface SyncQueueModalProps {
  className?: string;
  variant?: "badge" | "button";
}

export function SyncQueueModal({ className, variant = "badge" }: SyncQueueModalProps) {
  const { t, lang } = useT();
  const sync = useSyncStatus();
  const queue = useMutationQueue();

  const [open, setOpen] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [isSyncingDirect, setIsSyncingDirect] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Update countdown timer every second while modal is open
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  const handleRetrySingle = async (taskId: string) => {
    setRetryingId(taskId);
    toast.info(t("syncQueueRetryToast"));
    try {
      await retryMutation(taskId);
    } finally {
      setRetryingId(null);
    }
  };

  const handleDismiss = (taskId: string) => {
    const ok = dismissMutation(taskId);
    if (ok) {
      toast.success(t("syncQueueDismissConfirm"));
    }
  };

  const handleRetryAll = async () => {
    toast.info(t("syncQueueRetryToast"));
    await retryFailedMutations();
  };

  const handleSyncNowDirect = async () => {
    setIsSyncingDirect(true);
    try {
      if (queue.failed > 0) {
        await retryFailedMutations();
      }
      const ok = await syncNow();
      if (ok) {
        toast.success(t("syncSuccessToast"));
      }
    } finally {
      setIsSyncingDirect(false);
    }
  };

  const getCategoryBadge = (task: MutationTask) => {
    const cat = task.errorCategory;
    if (cat === "auth") {
      return {
        label: t("syncQueueErrorAuth"),
        color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      };
    }
    if (cat === "validation") {
      return {
        label: t("syncQueueErrorValidation"),
        color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      };
    }
    if (cat === "conflict") {
      return {
        label: t("syncQueueErrorConflict"),
        color: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
      };
    }
    if (cat === "network") {
      return {
        label: t("syncQueueErrorNetwork"),
        color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      };
    }
    if (task.isPermanent) {
      return {
        label: t("syncQueueErrorPermanent"),
        color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      };
    }
    return {
      label: t("syncQueueErrorTransient"),
      color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    };
  };

  const lastAttemptStr = formatTimeDifference(
    queue.lastAttemptAt,
    currentTime,
    false,
    lang
  );

  const nextAttemptStr = queue.nextScheduledAttemptAt
    ? formatTimeDifference(
        queue.nextScheduledAttemptAt,
        currentTime,
        true,
        lang
      )
    : t("syncQueueNoScheduled");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold transition-all cursor-pointer shadow-xs",
            sync.status === "syncing" || queue.isProcessing || isSyncingDirect
              ? "bg-primary/10 text-primary border border-primary/20 animate-pulse"
              : !sync.isOnline
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/15"
              : queue.failed > 0
              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/25"
              : sync.hasPendingSync || queue.pending > 0
              ? "bg-ember/15 text-ember border border-ember/30 hover:bg-ember/25"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15",
            className
          )}
          title={t("syncQueueDetailsBtn")}
        >
          {sync.status === "syncing" || queue.isProcessing || isSyncingDirect ? (
            <>
              <RefreshCw className="size-3.5 animate-spin" />
              <span>{queue.pending > 0 ? t("syncQueueRetrying") : t("syncStatusSyncing")}</span>
            </>
          ) : !sync.isOnline ? (
            <>
              <CloudOff className="size-3.5" />
              <span>
                {t("syncStatusOffline")}
                {queue.pending > 0 ? ` (${queue.pending})` : ""}
              </span>
            </>
          ) : queue.failed > 0 ? (
            <>
              <AlertTriangle className="size-3.5" />
              <span>{t("syncQueueFailed", { count: queue.failed })}</span>
            </>
          ) : (
            <>
              <Cloud className="size-3.5" />
              <span>
                {sync.hasPendingSync || queue.pending > 0
                  ? `${t("syncNow")}${queue.pending > 0 ? ` (${queue.pending})` : ""}`
                  : t("syncStatusOnline")}
              </span>
            </>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-3xl p-5 shadow-2xl sm:max-w-lg">
        <DialogHeader className="text-start">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Cloud className="size-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-base font-bold text-foreground">
                {t("syncQueueModalTitle")}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {sync.isOnline ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Wifi className="size-3" />
                    {t("syncStatusOnline")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    <WifiOff className="size-3" />
                    {t("syncStatusOffline")}
                  </span>
                )}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Telemetry Timestamps & Counts */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-border/80 bg-muted/40 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Clock className="size-3.5 text-primary" />
              <span>{t("syncQueueLastAttempt")}</span>
            </div>
            <p className="mt-1 font-display text-sm font-bold text-foreground">
              {queue.lastAttemptAt ? lastAttemptStr : t("syncQueueNeverAttempted")}
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-muted/40 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Timer className="size-3.5 text-ember" />
              <span>{t("syncQueueNextAttempt")}</span>
            </div>
            <p className="mt-1 font-display text-sm font-bold text-foreground truncate">
              {nextAttemptStr}
            </p>
          </div>
        </div>

        {/* Queue Metrics Pills */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-card border border-border/70 p-2.5 text-xs font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>{t("syncQueuePendingBadge", { count: queue.pending })}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" />
            <span>{queue.isProcessing ? t("syncStatusSyncing") : "خامل"}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-rose-500" />
            <span>{t("syncQueueFailed", { count: queue.failed })}</span>
          </span>
        </div>

        {/* Dead-Letter / Stalled Operations Section */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-xs font-bold text-foreground uppercase tracking-wider">
              {t("syncQueueDeadLetterTitle")}
            </h3>
            {queue.failed > 0 && (
              <button
                type="button"
                onClick={handleRetryAll}
                className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20 cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span>{t("syncQueueRetryAll")}</span>
              </button>
            )}
          </div>

          {queue.failedTasks.length === 0 ? (
            <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
              <span>{t("syncQueueNoDeadLetter")}</span>
            </div>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {queue.failedTasks.map((task) => {
                const badge = getCategoryBadge(task);
                const isTaskRetrying = retryingId === task.id;

                return (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-border bg-card p-3 shadow-xs transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-display text-xs font-bold text-foreground">
                            {task.type === "sync_progress"
                              ? t("syncQueueTaskTypeProgress")
                              : task.type}
                          </span>
                          <span
                            className={cn(
                              "rounded-md border px-1.5 py-0.5 text-[10px] font-bold",
                              badge.color
                            )}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {/* Error Reason */}
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 leading-snug">
                          <span className="font-semibold text-muted-foreground">
                            {t("syncQueueReason")}:{" "}
                          </span>
                          {task.lastError || "فشلت المحاولات المتكررة"}
                        </p>

                        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span>
                            {t("syncQueueAttemptsCount", {
                              current: task.attempts,
                              max: task.maxRetries,
                            })}
                          </span>
                          {task.lastAttemptAt && (
                            <span>
                              {formatTimeDifference(
                                task.lastAttemptAt,
                                currentTime,
                                false,
                                lang
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRetrySingle(task.id)}
                          disabled={isTaskRetrying}
                          className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary transition-colors hover:bg-primary/20 disabled:opacity-50 cursor-pointer"
                          title={t("syncQueueRetryTask")}
                        >
                          <Play className={cn("size-3.5 fill-current", isTaskRetrying && "animate-spin")} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismiss(task.id)}
                          className="grid size-8 place-items-center rounded-xl bg-muted text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600 cursor-pointer"
                          title={t("syncQueueDismissTask")}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={handleSyncNowDirect}
            disabled={isSyncingDirect || sync.status === "syncing"}
            className="btn-3d flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 font-display text-xs font-bold text-primary-foreground shadow-[0_2px_0_var(--primary-shade)] hover:brightness-105 active:translate-y-0.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cn("size-3.5", (isSyncingDirect || sync.status === "syncing") && "animate-spin")} />
            <span>{t("syncNow")}</span>
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-border bg-muted/60 px-3.5 py-2 font-display text-xs font-bold text-foreground transition-colors hover:bg-muted cursor-pointer"
          >
            {t("syncQueueClose")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
