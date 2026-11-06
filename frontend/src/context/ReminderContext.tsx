import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DoseSlot } from '../types';
import { api } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import { audioChime } from '../utils/audioChime';
import { useAuth } from './AuthContext';
import { visitSession } from '../services/visitSession';

interface ReminderContextType {
  todaySchedule: DoseSlot[];
  nextDueDose: DoseSlot | null;
  activeReminder: DoseSlot | null;
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  refreshSchedule: () => Promise<void>;
  markAsTaken: (medicineId: number, scheduledTime: string) => Promise<void>;
  markAsSnoozed: (medicineId: number, scheduledTime: string) => Promise<void>;
  dismissActiveReminder: () => void;
  requestNotificationPermission: () => Promise<boolean>;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export const ReminderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, soundEnabled } = useAuth();
  const [todaySchedule, setTodaySchedule] = useState<DoseSlot[]>([]);
  const [nextDueDose, setNextDueDose] = useState<DoseSlot | null>(null);
  const [activeReminder, setActiveReminder] = useState<DoseSlot | null>(null);
  const announcedDose = useRef<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial pending count check
    checkPendingQueueCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPendingQueueCount = async () => {
    try {
      const q = await offlineStorage.getPendingQueue();
      setPendingSyncCount(q.length);
    } catch (_) {}
  };

  const flushOfflineQueue = async () => {
    if (!visitSession.token) return;
    try {
      const pending = await offlineStorage.getPendingQueue();
      if (pending.length === 0) return;

      setIsSyncing(true);
      await api.sync.batch(pending);
      await offlineStorage.clearPendingQueue();
      setPendingSyncCount(0);
      await refreshSchedule();
    } catch (e) {
      console.warn('Sync attempt postponed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const res = await Notification.requestPermission();
    return res === 'granted';
  };

  const refreshSchedule = useCallback(async () => {
    if (!user) return;
    try {
      if (navigator.onLine || visitSession.isDemo) {
        const slots = await api.schedules.getToday();
        if (visitSession.user?.id !== user.id) return;
        setTodaySchedule(slots);
        await offlineStorage.cacheTodaySchedule(slots);
      } else {
        const cached = await offlineStorage.getCachedTodaySchedule();
        setTodaySchedule(cached);
      }
    } catch (err) {
      // Fallback to cache on network failure
      const cached = await offlineStorage.getCachedTodaySchedule();
      setTodaySchedule(cached);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTodaySchedule([]);
      setNextDueDose(null);
      setActiveReminder(null);
      announcedDose.current = null;
    }
  }, [user]);

  // Periodic refresh & dose check (every 25 seconds)
  useEffect(() => {
    refreshSchedule();
    const interval = setInterval(refreshSchedule, 25000);
    return () => clearInterval(interval);
  }, [refreshSchedule]);

  // Compute next due dose & trigger reminder alert
  useEffect(() => {
    if (!todaySchedule || todaySchedule.length === 0) {
      setNextDueDose(null);
      announcedDose.current = null;
      return;
    }

    const nowHm = new Date().toTimeString().slice(0, 5);

    // Find any dose currently due or the immediate next upcoming
    const dueNow = todaySchedule.find(s => s.status === 'due');
    const upcoming = todaySchedule.find(s => s.status === 'upcoming');

    const prioritized = dueNow || upcoming || null;
    setNextDueDose(prioritized);

    // Announce a due slot once. Dismissing the banner must not immediately
    // reopen it on the next render or the 25-second schedule refresh.
    const dueKey = dueNow
      ? `${user?.id}:${new Date().toDateString()}:${dueNow.medicine_id}:${dueNow.scheduled_time}`
      : null;
    if (!dueNow) announcedDose.current = null;
    if (dueNow && announcedDose.current !== dueKey) {
      announcedDose.current = dueKey;
      setActiveReminder(dueNow);

      if (soundEnabled) {
        audioChime.playReminderMelody();
      }

      // Browser Notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`CareNest Reminder: ${dueNow.medicine_name}`, {
          body: `Time for your ${dueNow.dosage} (${dueNow.meal_timing.replace('_', ' ')}).`,
          icon: '/favicon.ico',
        });
      }
    }
  }, [todaySchedule, soundEnabled, user?.id]);

  const markAsTaken = async (medicineId: number, scheduledTime: string) => {
    try {
      if (soundEnabled) {
        audioChime.playSuccessChime();
      }

      if (isOnline || visitSession.isDemo) {
        await api.events.recordTaken(medicineId, scheduledTime);
      } else {
        // Enqueue offline
        await offlineStorage.enqueueAction('event', `${medicineId}_${scheduledTime}`, 'create', {
          medicine_id: medicineId,
          scheduled_time: scheduledTime,
          status: 'taken',
        });
        await offlineStorage.updateLocalSlotStatus(medicineId, scheduledTime, 'taken');
        checkPendingQueueCount();
      }

      // Optimistic update
      setTodaySchedule(prev =>
        prev.map(slot =>
          slot.medicine_id === medicineId && slot.scheduled_time === scheduledTime
            ? { ...slot, status: 'taken' }
            : slot
        )
      );

      if (activeReminder?.medicine_id === medicineId) {
        setActiveReminder(null);
      }

      refreshSchedule();
    } catch (err) {
      console.error('Failed to mark taken:', err);
    }
  };

  const markAsSnoozed = async (medicineId: number, scheduledTime: string) => {
    try {
      if (isOnline || visitSession.isDemo) {
        await api.events.recordSnooze(medicineId, scheduledTime);
      } else {
        await offlineStorage.enqueueAction('event', `${medicineId}_${scheduledTime}`, 'create', {
          medicine_id: medicineId,
          scheduled_time: scheduledTime,
          status: 'snoozed',
        });
        await offlineStorage.updateLocalSlotStatus(medicineId, scheduledTime, 'snoozed');
        checkPendingQueueCount();
      }

      setTodaySchedule(prev =>
        prev.map(slot =>
          slot.medicine_id === medicineId && slot.scheduled_time === scheduledTime
            ? { ...slot, status: 'snoozed' }
            : slot
        )
      );

      if (activeReminder?.medicine_id === medicineId) {
        setActiveReminder(null);
      }

      refreshSchedule();
    } catch (err) {
      console.error('Failed to snooze:', err);
    }
  };

  const dismissActiveReminder = () => {
    setActiveReminder(null);
  };

  return (
    <ReminderContext.Provider
      value={{
        todaySchedule,
        nextDueDose,
        activeReminder,
        isOnline,
        isSyncing,
        pendingSyncCount,
        refreshSchedule,
        markAsTaken,
        markAsSnoozed,
        dismissActiveReminder,
        requestNotificationPermission,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
};

export const useReminders = () => {
  const ctx = useContext(ReminderContext);
  if (!ctx) throw new Error('useReminders must be used within ReminderProvider');
  return ctx;
};
