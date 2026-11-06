import type { Medicine, DoseSlot, DoseStatus, OfflineQueueItem } from '../types';

/** Offline actions survive navigation within this visit, never a reload. */
let medicines: Medicine[] = [];
let slots: DoseSlot[] = [];
let queue: OfflineQueueItem[] = [];
let nextQueueId = 1;
const copy = <T,>(value: T): T => structuredClone(value);

export const offlineStorage = {
  async cacheMedicines(value: Medicine[]) { medicines = copy(value); },
  async getCachedMedicines(): Promise<Medicine[]> { return copy(medicines); },
  async cacheTodaySchedule(value: DoseSlot[]) { slots = copy(value); },
  async getCachedTodaySchedule(): Promise<DoseSlot[]> { return copy(slots); },
  async updateLocalSlotStatus(medicineId: number, scheduledTime: string, status: DoseStatus) {
    slots = slots.map(slot => slot.medicine_id === medicineId && slot.scheduled_time === scheduledTime ? { ...slot, status } : slot);
  },
  async enqueueAction(entityType: 'event' | 'medicine', entityId: string, action: 'create' | 'update' | 'delete', payload: unknown) {
    queue.push({ id: nextQueueId++, client_id: crypto.randomUUID(), entity_type: entityType, entity_id: entityId, action, payload: copy(payload), client_timestamp: new Date().toISOString() });
  },
  async getPendingQueue(): Promise<OfflineQueueItem[]> { return copy(queue); },
  async clearPendingQueue() { queue = []; },
  async clearAll() { medicines = []; slots = []; queue = []; nextQueueId = 1; },
};
