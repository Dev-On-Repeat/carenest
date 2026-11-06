export type UserRole = 'elderly' | 'caregiver' | 'admin';
export type TextSize = 'normal' | 'large' | 'xlarge';
export type Language = 'en' | 'te';
export type MealTiming = 'before_food' | 'after_food' | 'with_food' | 'not_specified';
export type PillShape = 'round' | 'oval' | 'capsule' | 'square';
export type PillColor = 'teal' | 'white' | 'yellow' | 'blue' | 'red';
export type DoseStatus = 'upcoming' | 'due' | 'taken' | 'snoozed' | 'missed';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  emergency_contact?: string;
  emergency_phone?: string;
  phone?: string;
  preferred_language: Language;
  text_size: TextSize;
  caregiver_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Medicine {
  id: number;
  user_id: number;
  name: string;
  strength?: string;
  dosage: string;
  frequency: string;
  scheduled_times: string;
  meal_timing: MealTiming;
  start_date: string;
  end_date?: string;
  instructions?: string;
  prescribing_doctor?: string;
  pill_shape?: PillShape;
  pill_color?: PillColor;
  image_url?: string;
  is_active: boolean;
  created_at?: string;
}

export interface DoseSlot {
  medicine_id: number;
  medicine_name: string;
  strength?: string;
  dosage: string;
  scheduled_time: string;
  meal_timing: MealTiming;
  pill_shape: PillShape;
  pill_color: PillColor;
  instructions?: string;
  status: DoseStatus;
  event_id?: number;
  action_time?: string;
}

export interface MedicationEvent {
  id: number;
  medicine_id: number;
  user_id: number;
  scheduled_time: string;
  action_time: string;
  status: DoseStatus;
  notes?: string;
  device_source: string;
  medicine?: Medicine;
}

export interface ExtractedMedicine {
  name: string;
  strength?: string;
  dosage: string;
  frequency: string;
  meal_timing: MealTiming;
  instructions?: string;
  confidence: number;
}

export interface OCRResult {
  prescription_id?: number;
  image_url: string;
  raw_text: string;
  doctor_name?: string;
  clinic_name?: string;
  date?: string;
  medicines: ExtractedMedicine[];
  disclaimer: string;
}

export interface PillMatch {
  name: string;
  strength: string;
  shape: string;
  color: string;
  possible_uses: string;
  confidence: number;
  disclaimer: string;
}

export interface PillAnalysisResult {
  image_url: string;
  detected_features: {
    shape: string;
    color: string;
    aspect_ratio: number;
  };
  matches: PillMatch[];
  disclaimer: string;
  allow_manual_entry: boolean;
}

export interface AssistantResponse {
  answer: string;
  language: Language;
  source: string;
  related_medicines: string[];
  disclaimer: string;
}

export interface CaregiverPatientSummary {
  elderly_id: number;
  full_name: string;
  email: string;
  emergency_contact?: string;
  emergency_phone?: string;
  active_medicines_count: number;
  today_adherence_percent: number;
  missed_doses_today: number;
  last_action?: string;
  last_action_time?: string;
  sos_active: boolean;
}

export interface SOSEvent {
  id: number;
  user_id: number;
  user_name?: string;
  timestamp: string;
  status: 'triggered' | 'acknowledged' | 'resolved';
  latitude?: number;
  longitude?: number;
  notes?: string;
  external_notified: boolean;
  notice: string;
}

export interface OfflineQueueItem {
  id?: number;
  client_id: string;
  entity_type: 'event' | 'medicine';
  entity_id: string;
  action: 'create' | 'update' | 'delete';
  payload: any;
  client_timestamp: string;
}

