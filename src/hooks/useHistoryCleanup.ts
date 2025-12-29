import { useEffect, useRef } from 'react';
import { useUIStore } from '../store/uiStore';
import { db } from '../lib/db';

export function useHistoryCleanup() {
  const historyRetentionDays = useUIStore((state) => state.historyRetentionDays);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const cleanupHistory = async () => {
      if (historyRetentionDays === null) {
        console.log('[History Cleanup] Retention disabled - keeping all history');
        return;
      }

      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - historyRetentionDays);

        const deletedCount = await db.history
          .where('timestamp')
          .below(cutoffDate)
          .delete();

        console.log(`[History Cleanup] Deleted ${deletedCount} events older than ${historyRetentionDays} days`);
      } catch (error) {
        console.error('[History Cleanup] Error:', error);
      }
    };

    cleanupHistory();
  }, [historyRetentionDays]);
}
