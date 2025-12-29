import { useEffect, useState, useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { useUIStore } from '../store/uiStore';
import { dataOperationLogger } from '../lib/dataOperationLogger';
import type { DataOperation } from '../types/task';

interface UseExportReminderResult {
  shouldShowBanner: boolean;
  daysSinceLastExport: number | null;
  isLoading: boolean;
}

export function useExportReminder(): UseExportReminderResult {
  const exportReminderEnabled = useUIStore((state) => state.exportReminderEnabled);
  const exportReminderFrequencyDays = useUIStore((state) => state.exportReminderFrequencyDays);
  const exportReminderSnoozedUntil = useUIStore((state) => state.exportReminderSnoozedUntil);
  const lastExportReminderDismissed = useUIStore((state) => state.lastExportReminderDismissed);

  const [lastExport, setLastExport] = useState<DataOperation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Query last successful export from dataOperationLogger
  useEffect(() => {
    const loadLastExport = async () => {
      try {
        const operations = await dataOperationLogger.getRecentOperations(50);
        const lastSuccessfulExport = operations.find(
          (op) => op.operationType === 'export' && op.success
        );
        setLastExport(lastSuccessfulExport || null);
      } catch (error) {
        console.error('Failed to load export history:', error);
        setLastExport(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadLastExport();
  }, []);

  // Calculate if reminder should show
  const shouldShowBanner = useMemo(() => {
    // Don't show while loading
    if (isLoading) return false;

    // Feature disabled
    if (!exportReminderEnabled) return false;

    // Check snooze status
    if (exportReminderSnoozedUntil && exportReminderSnoozedUntil > new Date()) {
      return false;
    }

    // Check last dismissal
    if (lastExportReminderDismissed && lastExport) {
      // If dismissed after the last export, don't show until next interval
      if (lastExportReminderDismissed > lastExport.timestamp) {
        const daysSinceDismissal = differenceInDays(new Date(), lastExportReminderDismissed);
        if (daysSinceDismissal < exportReminderFrequencyDays) {
          return false;
        }
      }
    }

    // Never exported - show reminder
    if (!lastExport) {
      return true;
    }

    // Check last export date
    const daysSinceExport = differenceInDays(new Date(), lastExport.timestamp);
    return daysSinceExport >= exportReminderFrequencyDays;
  }, [
    isLoading,
    exportReminderEnabled,
    exportReminderFrequencyDays,
    exportReminderSnoozedUntil,
    lastExportReminderDismissed,
    lastExport,
  ]);

  // Calculate days since last export
  const daysSinceLastExport = useMemo(() => {
    if (!lastExport) return null;
    return differenceInDays(new Date(), lastExport.timestamp);
  }, [lastExport]);

  return {
    shouldShowBanner,
    daysSinceLastExport,
    isLoading,
  };
}
