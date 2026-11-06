# CareNest AI — REST API Documentation

The CareNest AI REST API provides comprehensive endpoints for elderly medication tracking, reminder calculation, OCR prescription extraction, pill analysis, and caregiver monitoring.

Interactive Swagger UI documentation is available at `/docs` when running the backend.

---

## 1. Authentication Endpoints

### 1.1 Register User
- **POST** `/api/auth/register`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "full_name": "Ramakrishna Varma",
    "role": "elderly",
    "emergency_contact": "Dr. Priya Varma",
    "emergency_phone": "+91 98480 12345",
    "preferred_language": "en"
  }
  ```
- **Response** `201 Created`:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "Ramakrishna Varma",
      "role": "elderly",
      "caregiver_code": "RAMA-7890"
    }
  }
  ```

### 1.2 Login
- **POST** `/api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "ramakrishna.demo@carenest.ai",
    "password": "DemoPassword123!"
  }
  ```
- **Response** `200 OK`:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": { ... }
  }
  ```

---

## 2. Medicine & Schedule Endpoints

### 2.1 List Medicines
- **GET** `/api/medicines?active_only=true&search=metformin`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response** `200 OK`:
  ```json
  [
    {
      "id": 1,
      "name": "Metformin Hydrochloride",
      "strength": "500 mg",
      "dosage": "1 tablet",
      "frequency": "Twice daily",
      "scheduled_times": "08:00,20:00",
      "meal_timing": "after_food",
      "is_active": true
    }
  ]
  ```

### 2.2 Get Today's Computed Schedule
- **GET** `/api/schedules/today`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response** `200 OK`:
  ```json
  [
    {
      "medicine_id": 1,
      "medicine_name": "Metformin Hydrochloride",
      "strength": "500 mg",
      "dosage": "1 tablet",
      "scheduled_time": "08:00",
      "meal_timing": "after_food",
      "pill_shape": "oval",
      "pill_color": "white",
      "status": "due"
    }
  ]
  ```

---

## 3. Medication Events (TAKEN / SNOOZE)

### 3.1 Record Medication Taken
- **POST** `/api/events/taken`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Request Body**:
  ```json
  {
    "medicine_id": 1,
    "scheduled_time": "08:00",
    "notes": "Taken with warm water",
    "device_source": "web"
  }
  ```
- **Response** `201 Created`:
  ```json
  {
    "id": 4,
    "medicine_id": 1,
    "scheduled_time": "08:00",
    "status": "taken",
    "action_time": "2026-10-31T08:05:00Z"
  }
  ```

### 3.2 Snooze Reminder
- **POST** `/api/events/snooze`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Request Body**:
  ```json
  {
    "medicine_id": 1,
    "scheduled_time": "08:00"
  }
  ```

---

## 4. Prescription OCR & Pill Identification

### 4.1 Upload Prescription Image for OCR
- **POST** `/api/prescriptions/upload`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Form Data**: `file: <prescription_photo.jpg>`
- **Response** `200 OK`:
  ```json
  {
    "prescription_id": 3,
    "image_url": "/api/uploads/rx_890aef.jpg",
    "raw_text": "Tab Metformin 500mg 1 BD after meals...",
    "doctor_name": "Dr. A. K. Sharma",
    "medicines": [
      {
        "name": "Metformin",
        "strength": "500 mg",
        "dosage": "1 tablet",
        "frequency": "Twice daily",
        "meal_timing": "after_food",
        "confidence": 0.92
      }
    ],
    "disclaimer": "Prescription information may contain OCR errors..."
  }
  ```

### 4.2 Analyze Pill Photo
- **POST** `/api/identify`
- **Form Data**: `file: <pill_photo.jpg>`
- **Response** `200 OK`:
  ```json
  {
    "detected_features": {
      "shape": "oval",
      "color": "white"
    },
    "matches": [
      {
        "name": "Metformin Hydrochloride",
        "strength": "500 mg",
        "confidence": 0.78,
        "disclaimer": "Possible medicine match — verify using the original packaging..."
      }
    ]
  }
  ```

---

## 5. Conversational Assistant

### 5.1 Ask CareNest
- **POST** `/api/assistant/ask`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Request Body**:
  ```json
  {
    "question": "What medicines do I have today?",
    "language": "en"
  }
  ```
- **Response** `200 OK`:
  ```json
  {
    "answer": "Here is your medication schedule for today: • Metformin (500 mg) at 08:00 (After food) [Taken]...",
    "language": "en",
    "source": "local_database_engine",
    "related_medicines": ["Metformin", "Amlodipine"]
  }
  ```

---

## 6. Emergency SOS

### 6.1 Trigger Emergency SOS
- **POST** `/api/sos/trigger`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Request Body**:
  ```json
  {
    "notes": "Elderly user pressed SOS button",
    "latitude": 17.3850,
    "longitude": 78.4867
  }
  ```
- **Response** `201 Created`:
  ```json
  {
    "id": 2,
    "status": "triggered",
    "timestamp": "2026-10-31T08:15:20Z",
    "external_notified": false,
    "notice": "SOS recorded in application. Local emergency services must be contacted directly..."
  }
  ```

