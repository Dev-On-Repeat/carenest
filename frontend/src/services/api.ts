import type {
  User, Medicine, DoseSlot, MedicationEvent,
  OCRResult, PillAnalysisResult, AssistantResponse,
  CaregiverPatientSummary, SOSEvent, OfflineQueueItem
} from '../types';
import { DEMO_TOKEN, visitSession } from './visitSession';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = visitSession.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Isolated sample records for this document only. Demo requests never reach the server.
const records = new Map<string, string>();
let nextMedicineId = 4;
const demoStorage = {
  getItem: (key: string) => records.get(key) ?? null,
  setItem: (key: string, value: string) => { records.set(key, value); },
  removeItem: (key: string) => { records.delete(key); },
};
export const resetDemoData = () => { records.clear(); nextMedicineId = 4; };
const MOCK_STORAGE_KEYS = {
  MEDS: 'carenest_mock_meds',
  EVENTS: 'carenest_mock_events',
  SOS: 'carenest_mock_sos',
  CAREGIVER_LINKS: 'carenest_mock_links',
};

const DEFAULT_MEDS: Medicine[] = [
  {
    id: 1,
    user_id: 1,
    name: 'Metformin Hydrochloride',
    strength: '500 mg',
    dosage: '1 tablet',
    frequency: 'Twice daily',
    scheduled_times: '08:00, 20:00',
    meal_timing: 'after_food',
    start_date: '2026-01-01',
    instructions: 'Take immediately after breakfast and dinner with warm water.',
    prescribing_doctor: 'Dr. K. Srinivas Rao, MD',
    pill_shape: 'oval',
    pill_color: 'white',
    is_active: true,
  },
  {
    id: 2,
    user_id: 1,
    name: 'Amlodipine Besylate',
    strength: '5 mg',
    dosage: '1 tablet',
    frequency: 'Once daily',
    scheduled_times: '08:00',
    meal_timing: 'after_food',
    start_date: '2026-01-01',
    instructions: 'Take in the morning for blood pressure control.',
    prescribing_doctor: 'Dr. K. Srinivas Rao, MD',
    pill_shape: 'round',
    pill_color: 'teal',
    is_active: true,
  },
  {
    id: 3,
    user_id: 1,
    name: 'Atorvastatin',
    strength: '20 mg',
    dosage: '1 tablet',
    frequency: 'Once daily',
    scheduled_times: '21:00',
    meal_timing: 'after_food',
    start_date: '2026-01-01',
    instructions: 'Take at night after dinner for cholesterol management.',
    prescribing_doctor: 'Dr. K. Srinivas Rao, MD',
    pill_shape: 'oval',
    pill_color: 'yellow',
    is_active: true,
  },
];

function getStoredMeds(): Medicine[] {
  const data = demoStorage.getItem(MOCK_STORAGE_KEYS.MEDS);
  if (!data) {
    demoStorage.setItem(MOCK_STORAGE_KEYS.MEDS, JSON.stringify(DEFAULT_MEDS));
    return structuredClone(DEFAULT_MEDS);
  }
  try {
    return JSON.parse(data);
  } catch (_) {
    return structuredClone(DEFAULT_MEDS);
  }
}

function getStoredEvents(): MedicationEvent[] {
  const data = demoStorage.getItem(MOCK_STORAGE_KEYS.EVENTS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (_) {
    return [];
  }
}

function getStoredSOS(): SOSEvent[] {
  const data = demoStorage.getItem(MOCK_STORAGE_KEYS.SOS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (_) {
    return [];
  }
}

const DEMO_EMAILS = ['ramakrishna.demo@carenest.ai', 'dr.priya.demo@carenest.ai'];

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isLogin = endpoint === '/auth/login';
  const isRegistration = endpoint === '/auth/register';
  if (isLogin) {
    const credentials = JSON.parse(String(options.body || '{}'));
    const email = String(credentials.email || '').trim().toLowerCase();
    if (DEMO_EMAILS.includes(email)) {
      if (credentials.password !== 'DemoPassword123!') throw new Error('The sample account password is incorrect.');
      return handleMockRequest<T>(endpoint, { ...options, body: JSON.stringify({ ...credentials, email }) });
    }
  }
  if (!isLogin && !isRegistration && !visitSession.token) throw new Error('Please sign in to continue.');
  if (!isLogin && !isRegistration && visitSession.isDemo) return handleMockRequest<T>(endpoint, options);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, { ...options, credentials: 'omit', headers: { ...(isLogin || isRegistration ? {} : getAuthHeader()), ...options.headers } });
  } catch {
    throw new Error('The service is unavailable. You can use a sample profile to try the application.');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(typeof error?.detail === 'string' ? error.detail : 'The request could not be completed. Please try again.');
  }
  if (response.status === 204) return {} as T;
  return response.json();
}

function handleMockRequest<T>(endpoint: string, options: RequestInit): T {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Auth: Login
  if (endpoint === '/auth/login' && method === 'POST') {
    const isCaregiver = body.email?.includes('caregiver') || body.email?.includes('priya');
    const mockUser: User = {
      id: isCaregiver ? 2 : 1,
      email: body.email || (isCaregiver ? 'dr.priya.demo@carenest.ai' : 'ramakrishna.demo@carenest.ai'),
      full_name: isCaregiver ? 'Dr. Priya Varma (Demo)' : 'Ramakrishna Varma (Demo)',
      role: isCaregiver ? 'caregiver' : 'elderly',
      emergency_contact: 'Dr. Priya Varma (Daughter & Physician)',
      emergency_phone: '+91 98480 12345',
      phone: '+91 94401 56789',
      preferred_language: 'en',
      text_size: 'large',
      caregiver_code: 'RAMA-7890',
    };
    return { access_token: DEMO_TOKEN, user: mockUser } as T;
  }

  // Auth: Register
  if (endpoint === '/auth/register' && method === 'POST') {
    const mockUser: User = {
      id: Math.floor(Math.random() * 1000) + 10,
      email: body.email,
      full_name: body.full_name,
      role: body.role || 'elderly',
      emergency_contact: body.emergency_contact,
      emergency_phone: body.emergency_phone,
      phone: body.phone,
      preferred_language: body.preferred_language || 'en',
      text_size: body.text_size || 'large',
      caregiver_code: 'CARE-' + Math.floor(1000 + Math.random() * 9000),
    };
    return { access_token: DEMO_TOKEN, user: mockUser } as T;
  }

  // This profile exists only after the explicit sample sign-in.
  if (endpoint === '/auth/me') {
    const user = visitSession.user;
    if (!user) throw new Error('Please sign in to continue.');
    if (method === 'PUT') {
      const updated = { ...user, ...body, id: user.id, role: user.role };
      visitSession.updateUser(updated);
      return updated as T;
    }
    return user as T;
  }

  // Medicines List
  if (endpoint.startsWith('/medicines') && method === 'GET') {
    const params = new URL(endpoint, 'https://demo.invalid').searchParams;
    const search = (params.get('search') || '').toLowerCase();
    return getStoredMeds().filter(med => (params.get('active_only') !== 'true' || med.is_active) && med.name.toLowerCase().includes(search)) as T;
  }

  // Medicines Create
  if (endpoint === '/medicines' && method === 'POST') {
    const meds = getStoredMeds();
    const newMed: Medicine = {
      id: nextMedicineId++,
      user_id: 1,
      name: body.name,
      strength: body.strength,
      dosage: body.dosage || '1 tablet',
      frequency: body.frequency || 'Once daily',
      scheduled_times: body.scheduled_times || '08:00',
      meal_timing: body.meal_timing || 'after_food',
      start_date: body.start_date || '2026-01-01',
      instructions: body.instructions,
      prescribing_doctor: body.prescribing_doctor,
      pill_shape: body.pill_shape || 'round',
      pill_color: body.pill_color || 'teal',
      is_active: true,
    };
    meds.push(newMed);
    demoStorage.setItem(MOCK_STORAGE_KEYS.MEDS, JSON.stringify(meds));
    return newMed as T;
  }

  if (endpoint.startsWith('/medicines/') && method === 'PUT') {
    const id = Number(endpoint.split('/')[2]);
    let updated: Medicine | undefined;
    const meds = getStoredMeds().map(med => {
      if (med.id !== id) return med;
      updated = { ...med, ...body, id: med.id, user_id: med.user_id };
      return updated!;
    });
    if (!updated) throw new Error('That sample medicine was not found.');
    demoStorage.setItem(MOCK_STORAGE_KEYS.MEDS, JSON.stringify(meds));
    return updated as T;
  }

  // Medicines Delete
  if (endpoint.startsWith('/medicines/') && method === 'DELETE') {
    const id = parseInt(endpoint.split('/')[2]);
    const meds = getStoredMeds().filter(m => m.id !== id);
    demoStorage.setItem(MOCK_STORAGE_KEYS.MEDS, JSON.stringify(meds));
    return {} as T;
  }

  // Schedule Today
  if (endpoint === '/schedules/today') {
    const meds = getStoredMeds().filter(m => m.is_active);
    const events = getStoredEvents();
    const nowHm = new Date().toTimeString().slice(0, 5);

    const slots: DoseSlot[] = [];
    for (const med of meds) {
      const times = med.scheduled_times.split(',').map(t => t.trim());
      for (const t of times) {
        const ev = [...events].reverse().find(e => e.medicine_id === med.id && e.scheduled_time === t);
        let status: any = 'upcoming';
        if (ev) {
          status = ev.status;
        } else if (t < nowHm) {
          status = 'due';
        }
        slots.push({
          medicine_id: med.id,
          medicine_name: med.name,
          strength: med.strength,
          dosage: med.dosage,
          scheduled_time: t,
          meal_timing: med.meal_timing,
          pill_shape: med.pill_shape || 'round',
          pill_color: med.pill_color || 'teal',
          instructions: med.instructions,
          status,
          event_id: ev?.id,
          action_time: ev?.action_time,
        });
      }
    }
    slots.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
    return slots as T;
  }

  // Events: Taken
  if (endpoint === '/events/taken' && method === 'POST') {
    const events = getStoredEvents();
    const newEvent: MedicationEvent = {
      id: Math.max(0, ...events.map(event => event.id)) + 1,
      medicine_id: body.medicine_id,
      user_id: 1,
      scheduled_time: body.scheduled_time,
      action_time: new Date().toISOString(),
      status: 'taken',
      notes: body.notes || 'Recorded on time',
      device_source: body.device_source || 'web',
    };
    const previous = [...events].reverse().find(event => event.medicine_id === newEvent.medicine_id && event.scheduled_time === newEvent.scheduled_time);
    if (newEvent.status === 'taken' && previous?.status === 'taken') return previous as T;
    events.push(newEvent);
    demoStorage.setItem(MOCK_STORAGE_KEYS.EVENTS, JSON.stringify(events));
    return newEvent as T;
  }

  // Events: Snooze
  if (endpoint === '/events/snooze' && method === 'POST') {
    const events = getStoredEvents();
    const newEvent: MedicationEvent = {
      id: Math.max(0, ...events.map(event => event.id)) + 1,
      medicine_id: body.medicine_id,
      user_id: 1,
      scheduled_time: body.scheduled_time,
      action_time: new Date().toISOString(),
      status: 'snoozed',
      notes: 'Snoozed for 15 minutes',
      device_source: 'web',
    };
    const previous = [...events].reverse().find(event => event.medicine_id === newEvent.medicine_id && event.scheduled_time === newEvent.scheduled_time);
    if (newEvent.status === 'taken' && previous?.status === 'taken') return previous as T;
    events.push(newEvent);
    demoStorage.setItem(MOCK_STORAGE_KEYS.EVENTS, JSON.stringify(events));
    return newEvent as T;
  }

  // Events History
  if (endpoint.startsWith('/events/history')) {
    const params = new URL(endpoint, 'https://demo.invalid').searchParams;
    return getStoredEvents().filter(event => (!params.get('status') || event.status === params.get('status')) && (!params.get('medicine_id') || event.medicine_id === Number(params.get('medicine_id')))) as T;
  }

  // Assistant: Ask
  if (endpoint === '/assistant/ask' && method === 'POST') {
    const q = (body.question || '').toLowerCase();
    const isTe = body.language === 'te' || /[\u0C00-\u0C7F]/.test(body.question || '');
    const meds = getStoredMeds();

    let ans = '';
    if (q.includes('what') || q.includes('schedule') || q.includes('మందులు')) {
      if (isTe) {
        ans = `ఈరోజు మీరు తీసుకోవాల్సిన మందులు (${meds.length}): ` + meds.map(m => `${m.name} (${m.scheduled_times})`).join(', ');
      } else {
        ans = `Here is your schedule for today (${meds.length} active prescriptions): ` + meds.map(m => `• ${m.name} (${m.dosage} at ${m.scheduled_times})`).join('\n');
      }
    } else if (q.includes('next') || q.includes('తరువాత')) {
      ans = isTe
        ? 'మీ తదుపరి మందు: Metformin 500mg, సమయం 08:00 AM (భోజనం తర్వాత).'
        : 'Your next scheduled dose is Metformin 500mg at 08:00 AM (take after breakfast).';
    } else if (q.includes('caregiver') || q.includes('doctor') || q.includes('సహాయం')) {
      ans = isTe
        ? 'మీ సంరక్షకుడు: Dr. Priya Varma (+91 98480 12345). అత్యవసర సమయంలో ఎరుపు రంగు SOS బటన్ నొక్కండి.'
        : 'Your linked caregiver is Dr. Priya Varma (+91 98480 12345). In an emergency, press the red SOS button.';
    } else {
      ans = isTe
        ? 'నమస్కారం! మీ మందుల సమయాలు లేదా రిమైండర్‌ల గురించి నన్ను అడగండి.'
        : 'Hello! I am CareNest AI. You can ask me about your medication schedule, next doses, or caregiver contact.';
    }

    return {
      answer: ans,
      language: isTe ? 'te' : 'en',
      source: 'local_database_engine',
      related_medicines: meds.map(m => m.name),
      disclaimer: 'CareNest AI is an academic prototype and does not replace medical advice from licensed doctors.',
    } as T;
  }

  // Caregiver Patients
  if (endpoint === '/caregiver/patients') {
    const meds = getStoredMeds();
    const events = getStoredEvents();
    const slots = handleMockRequest<DoseSlot[]>('/schedules/today', {});
    const taken = slots.filter(slot => slot.status === 'taken').length;
    const adherence = slots.length > 0 ? Math.round(taken / slots.length * 100) : 0;
    const latest = events[events.length - 1];
    const sosList = getStoredSOS();
    const hasSos = sosList.some(s => s.status === 'triggered');

    const summaries: CaregiverPatientSummary[] = [
      {
        elderly_id: 1,
        full_name: 'Ramakrishna Varma (Demo)',
        email: 'ramakrishna.demo@carenest.ai',
        emergency_contact: 'Dr. Priya Varma',
        emergency_phone: '+91 98480 12345',
        active_medicines_count: meds.length,
        today_adherence_percent: adherence,
        missed_doses_today: 0,
        last_action: latest?.status,
        last_action_time: latest?.action_time,
        sos_active: hasSos,
      },
    ];
    return summaries as T;
  }

  // Caregiver Link
  if (endpoint === '/caregiver/link' && method === 'POST') {
    return { success: true, message: 'Successfully linked to Ramakrishna Varma (RAMA-7890).' } as T;
  }

  // Caregiver Patient Schedule
  if (endpoint.includes('/caregiver/patient/')) {
    return handleMockRequest<T>('/schedules/today', { method: 'GET' });
  }

  // SOS Trigger
  if (endpoint === '/sos/trigger' && method === 'POST') {
    const sosList = getStoredSOS();
    const newSos: SOSEvent = {
      id: Date.now(),
      user_id: 1,
      user_name: 'Ramakrishna Varma',
      timestamp: new Date().toISOString(),
      status: 'triggered',
      latitude: body.latitude || 17.3850,
      longitude: body.longitude || 78.4867,
      notes: body.notes || 'Elderly user pressed SOS emergency button',
      external_notified: false,
      notice: 'SOS recorded in application. External notification is not configured.',
    };
    sosList.push(newSos);
    demoStorage.setItem(MOCK_STORAGE_KEYS.SOS, JSON.stringify(sosList));
    return newSos as T;
  }

  // SOS Events
  if (endpoint === '/sos/events') {
    return getStoredSOS() as T;
  }

  // SOS Resolve
  if (endpoint.includes('/sos/') && endpoint.endsWith('/resolve')) {
    const sosList = getStoredSOS().map(s => ({ ...s, status: 'resolved' as const }));
    demoStorage.setItem(MOCK_STORAGE_KEYS.SOS, JSON.stringify(sosList));
    return { success: true, message: 'SOS alert resolved.' } as T;
  }

  // Hardware Status
  if (endpoint === '/hardware/status') {
    return {
      mode: 'Simulation / Laptop Demo Mode',
      is_raspberry_pi: false,
      led_indicator: 'GREEN_IDLE',
      buzzer: false,
      gpio_pins_mapping: {
        GPIO_17: 'Physical TAKEN Green Pushbutton',
        GPIO_27: 'Physical REMIND LATER Yellow Pushbutton',
        GPIO_22: 'Physical SOS Red Pushbutton',
      },
    } as T;
  }

  // Hardware Button
  if (endpoint === '/hardware/button') {
    return {
      success: true,
      button_pressed: body.button,
      led_state: body.button === 'TAKEN' ? 'GREEN_IDLE' : body.button === 'REMIND_LATER' ? 'PULSE_YELLOW_DUE' : 'FLASH_RED_SOS',
    } as T;
  }

  // Demo Seed
  if (endpoint === '/demo/seed') {
    resetDemoData();
    return { success: true, message: 'Demo data successfully reset!' } as T;
  }

  // Demo Info
  if (endpoint === '/demo/info') {
    return {
      is_demo_mode_available: true,
      sample_accounts: [
        { role: 'Elderly Patient', name: 'Ramakrishna Varma', email: 'ramakrishna.demo@carenest.ai' },
        { role: 'Family Caregiver', name: 'Dr. Priya Varma', email: 'dr.priya.demo@carenest.ai' },
      ],
    } as T;
  }

  throw new Error('This action is not available in the sample visit.');
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ access_token: string; user: User }>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      }),

    register: (userData: any) =>
      request<{ access_token: string; user: User }>('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      }),

    getMe: () => request<User>('/auth/me'),

    updateMe: (updateData: Partial<User>) =>
      request<User>('/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      }),
  },

  medicines: {
    list: (search?: string, activeOnly: boolean = true) => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('active_only', activeOnly ? 'true' : 'false');
      return request<Medicine[]>(`/medicines?${params.toString()}`);
    },

    create: (medicine: Partial<Medicine>) =>
      request<Medicine>('/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicine),
      }),

    update: (id: number, data: Partial<Medicine>) =>
      request<Medicine>(`/medicines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),

    delete: (id: number) =>
      request<void>(`/medicines/${id}`, { method: 'DELETE' }),
  },

  schedules: {
    getToday: () => request<DoseSlot[]>('/schedules/today'),
  },

  events: {
    recordTaken: (medicineId: number, scheduledTime: string, notes?: string, deviceSource: string = 'web') =>
      request<MedicationEvent>('/events/taken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicine_id: medicineId,
          scheduled_time: scheduledTime,
          status: 'taken',
          notes,
          device_source: deviceSource,
        }),
      }),

    recordSnooze: (medicineId: number, scheduledTime: string) =>
      request<MedicationEvent>('/events/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicine_id: medicineId,
          scheduled_time: scheduledTime,
          status: 'snoozed',
          notes: 'Snoozed for 15 minutes',
          device_source: 'web',
        }),
      }),

    getHistory: (statusFilter?: string, medicineId?: number) => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (medicineId) params.set('medicine_id', medicineId.toString());
      return request<MedicationEvent[]>(`/events/history?${params.toString()}`);
    },
  },

  prescriptions: {
    upload: async (file: File): Promise<OCRResult> => {
      if (!visitSession.token) throw new Error('Please sign in to continue.');
      if (!visitSession.isDemo) {
        const formData = new FormData();
        formData.append('file', file);
        return request<OCRResult>('/prescriptions/upload', { method: 'POST', body: formData });
      }
      // Explicit sample output, not an analysis of the uploaded image.
      return {
        image_url: URL.createObjectURL(file),
        raw_text: "DEMONSTRATION SAMPLE - not extracted from this image.\nDr. A. K. Sharma, MD\nCity Health Clinic\nRx:\n1. Tab Metformin 500mg - 1 BD after meals\n2. Tab Telmisartan 40mg - 1 OD morning",
        doctor_name: "Dr. A. K. Sharma, MD",
        clinic_name: "City Health Clinic",
        date: "Today",
        medicines: [
          {
            name: "Metformin Hydrochloride",
            strength: "500 mg",
            dosage: "1 tablet",
            frequency: "Twice daily",
            meal_timing: "after_food",
            instructions: "Take with breakfast and dinner",
            confidence: 0.94,
          },
          {
            name: "Telmisartan",
            strength: "40 mg",
            dosage: "1 tablet",
            frequency: "Once daily",
            meal_timing: "before_food",
            instructions: "Take in morning for blood pressure",
            confidence: 0.91,
          },
        ],
        disclaimer: "Demonstration sample only. These medicine details were not read from your image. Never use this sample as a prescription.",
      };
    },

    confirm: (medicines: any[], doctorName?: string, clinicName?: string) => {
      if (!visitSession.token) return Promise.reject(new Error('Please sign in to continue.'));
      if (!visitSession.isDemo) return request<{ success: boolean; message: string; medicine_ids: number[] }>('/prescriptions/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ medicines, doctor_name: doctorName, clinic_name: clinicName }) });
      const current = getStoredMeds();
      const addedIds: number[] = [];
      for (const m of medicines) {
        const id = nextMedicineId++;
        addedIds.push(id);
        current.push({
          id,
          user_id: 1,
          name: m.name,
          strength: m.strength,
          dosage: m.dosage,
          frequency: m.frequency,
          scheduled_times: m.frequency.toLowerCase().includes('twice') ? '08:00, 20:00' : '08:00',
          meal_timing: m.meal_timing || 'after_food',
          start_date: new Date().toISOString().slice(0, 10),
          instructions: m.instructions || 'Added from verified prescription scan',
          prescribing_doctor: doctorName,
          pill_shape: 'round',
          pill_color: 'teal',
          is_active: true,
        });
      }
      demoStorage.setItem(MOCK_STORAGE_KEYS.MEDS, JSON.stringify(current));
      return Promise.resolve({ success: true, message: `Added ${medicines.length} medicines for this visit.`, medicine_ids: addedIds });
    },
  },

  identify: {
    uploadPill: async (file: File): Promise<PillAnalysisResult> => {
      if (!visitSession.token) throw new Error('Please sign in to continue.');
      if (!visitSession.isDemo) {
        const formData = new FormData();
        formData.append('file', file);
        return request<PillAnalysisResult>('/identify', { method: 'POST', body: formData });
      }
      // Explicit sample output, not an analysis of the uploaded image.
      return {
        image_url: URL.createObjectURL(file),
        detected_features: { shape: 'oval', color: 'white', aspect_ratio: 1.45 },
        matches: [
          {
            name: 'Metformin Hydrochloride',
            strength: '500 mg',
            shape: 'oval',
            color: 'white',
            possible_uses: 'Blood sugar regulation in Type 2 Diabetes',
            confidence: 0.82,
            disclaimer: 'Possible medicine match — verify using original packaging or with a pharmacist. Never consume unverified pills.',
          },
          {
            name: 'Atorvastatin Calcium',
            strength: '20 mg',
            shape: 'oval',
            color: 'white',
            possible_uses: 'Cholesterol reduction & cardiac protection',
            confidence: 0.74,
            disclaimer: 'Possible medicine match — verify with packaging or pharmacist.',
          },
        ],
        disclaimer: 'Demonstration sample only. These reference matches were not inferred from your image. Appearance alone cannot reliably identify medication.',
        allow_manual_entry: true,
      };
    },
  },

  assistant: {
    ask: (question: string, language: string = 'en') =>
      request<AssistantResponse>('/assistant/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, language }),
      }),
  },

  caregiver: {
    link: (caregiverCode: string) =>
      request<{ success: boolean; message: string }>('/caregiver/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caregiver_code: caregiverCode }),
      }),

    listPatients: () => request<CaregiverPatientSummary[]>('/caregiver/patients'),

    getPatientSchedule: (elderlyId: number) =>
      request<DoseSlot[]>(`/caregiver/patient/${elderlyId}/schedule`),
  },

  sos: {
    trigger: (notes?: string, lat?: number, lng?: number) =>
      request<SOSEvent>('/sos/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, latitude: lat, longitude: lng }),
      }),

    getEvents: () => request<SOSEvent[]>('/sos/events'),

    resolve: (sosId: number) =>
      request<{ success: boolean; message: string }>(`/sos/${sosId}/resolve`, {
        method: 'POST',
      }),
  },

  sync: {
    batch: (items: OfflineQueueItem[]) =>
      request<{ processed_count: number; success: boolean }>('/sync/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      }),
  },

  demo: {
    seed: () =>
      request<{ success: boolean; message: string; credentials: any }>('/demo/seed', {
        method: 'POST',
      }),

    getInfo: () => request<any>('/demo/info'),
  },

  hardware: {
    getStatus: () => request<any>('/hardware/status'),
    triggerButton: (button: 'TAKEN' | 'REMIND_LATER' | 'SOS') =>
      request<any>('/hardware/button', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ button }),
      }),
  },
};
