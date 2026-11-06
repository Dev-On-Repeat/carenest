# CareNest AI — Raspberry Pi Hardware Integration Guide

This guide describes how to interface **CareNest AI** with a physical smart medicine box using a **Raspberry Pi 4 Model B**, physical tactile pushbuttons, an RGB LED indicator, a piezo buzzer, and a camera.

---

## 1. Hardware Components & Bill of Materials (BOM)

| Component | Purpose | Raspberry Pi Pin |
| :--- | :--- | :--- |
| **Raspberry Pi 4 Model B** | Local edge controller & touch kiosk | USB-C Power (5V 3A) |
| **7" Touchscreen Display** | Elderly visual display kiosk | DSI Ribbon Cable / HDMI |
| **Green Pushbutton** | Physical "TAKEN" confirmation | GPIO 17 (Pin 11) + GND |
| **Yellow Pushbutton** | Physical "REMIND LATER" snooze | GPIO 27 (Pin 13) + GND |
| **Red Pushbutton** | Physical "EMERGENCY SOS" alert | GPIO 22 (Pin 15) + GND |
| **Common Cathode RGB LED** | Ambient medication state indicator | Red: GPIO 23, Green: GPIO 24, Blue: GPIO 18, Cathode: GND |
| **Active Piezo Buzzer** | Audio reminder chime & alarm | GPIO 25 (Pin 22) + GND |
| **Pi Camera Module v2** | Prescription & pill capture | CSI Camera Ribbon Cable |

---

## 2. GPIO Wiring Schematic

```
Raspberry Pi 4 Pin Header:
       3.3V [ 1] [ 2] 5V
      GPIO2 [ 3] [ 4] 5V
      GPIO3 [ 5] [ 6] GND ---------------------------- (Common GND)
      GPIO4 [ 7] [ 8] GPIO14
        GND [ 9] [10] GPIO15
(TAKEN)   GPIO17 [11] [12] GPIO18 (Blue LED)
(SNOOZE)  GPIO27 [13] [14] GND
(SOS)     GPIO22 [15] [16] GPIO23 (Red LED)
       3.3V [17] [18] GPIO24 (Green LED)
     GPIO10 [19] [20] GND
      GPIO9 [21] [22] GPIO25 (Piezo Buzzer)
```

Each tactile pushbutton connects between its respective GPIO pin and GND. The Raspberry Pi internal pull-up resistor (`pull_up=True`) is enabled via software, pulling the pin `HIGH` (3.3V) when idle, and pulling it `LOW` (0V) when pressed.

---

## 3. Ready-to-Run Raspberry Pi Edge Controller Script

Save this Python script on the Raspberry Pi as `rpi_carenest_edge.py`:

```python
#!/usr/bin/env python3
"""
CareNest AI — Raspberry Pi Edge Controller
Monitors physical pushbuttons and dispatches events to CareNest REST API.
"""

import time
import requests
from gpiozero import Button, RGBLED, Buzzer

# API Endpoint
CARENEST_API_BASE = "http://127.0.0.1:8000/api"

# Pin Definitions
BTN_TAKEN = Button(17, pull_up=True, bounce_time=0.1)
BTN_SNOOZE = Button(27, pull_up=True, bounce_time=0.1)
BTN_SOS = Button(22, pull_up=True, bounce_time=0.1)

LED = RGBLED(red=23, green=24, blue=18)
BUZZER = Buzzer(25)

def on_taken_pressed():
    print("[HARDWARE] 'TAKEN' pushbutton pressed!")
    LED.color = (0, 1, 0)  # Green
    try:
        requests.post(f"{CARENEST_API_BASE}/hardware/button", json={"button": "TAKEN"}, timeout=2)
    except Exception as e:
        print(f"API Error: {e}")

def on_snooze_pressed():
    print("[HARDWARE] 'REMIND LATER' pushbutton pressed!")
    LED.color = (1, 1, 0)  # Yellow
    try:
        requests.post(f"{CARENEST_API_BASE}/hardware/button", json={"button": "REMIND_LATER"}, timeout=2)
    except Exception as e:
        print(f"API Error: {e}")

def on_sos_pressed():
    print("[HARDWARE] 'EMERGENCY SOS' pushbutton pressed!")
    LED.color = (1, 0, 0)  # Red
    BUZZER.beep(on_time=0.2, off_time=0.2, n=5)
    try:
        requests.post(f"{CARENEST_API_BASE}/hardware/button", json={"button": "SOS"}, timeout=2)
    except Exception as e:
        print(f"API Error: {e}")

def main():
    print("CareNest AI Hardware Daemon Started.")
    LED.color = (0, 0.5, 0)  # Calm teal-green idle
    
    BTN_TAKEN.when_pressed = on_taken_pressed
    BTN_SNOOZE.when_pressed = on_snooze_pressed
    BTN_SOS.when_pressed = on_sos_pressed

    while True:
        time.sleep(1)

if __name__ == "__main__":
    main()
```

---

## 4. Hardware Simulation Mode

When physical Raspberry Pi hardware is not connected:
1. Open **Settings** -> **Hardware Abstraction Layer (Raspberry Pi Prototype)**.
2. Click the simulation buttons:
   - **Simulate "TAKEN" Push**: Dispatches GPIO 17 event and updates LED state to `GREEN_IDLE`.
   - **Simulate "SNOOZE" Push**: Dispatches GPIO 27 event and pulses yellow.
   - **Simulate "SOS" Push**: Dispatches GPIO 22 event, flashes red, and activates buzzer alarm.
3. This verifies the complete Hardware Abstraction Layer architecture without requiring live physical breadboards.

