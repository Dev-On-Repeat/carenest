from typing import Dict, Any, Optional
from datetime import datetime, timezone

class HardwareState:
    def __init__(self):
        self.is_raspberry_pi: bool = False
        self.led_status: str = "GREEN_IDLE"  # GREEN_IDLE, PULSE_YELLOW_DUE, FLASH_RED_SOS
        self.buzzer_active: bool = False
        self.camera_ready: bool = True
        self.speaker_ready: bool = True
        self.microphone_ready: bool = True
        self.last_button_pressed: Optional[str] = None
        self.last_event_time: Optional[datetime] = None

# In-memory singleton state for mock & live hardware
hardware_state = HardwareState()

class HardwareAbstractionLayer:
    """
    Hardware Abstraction Layer (HAL) for CareNest AI.
    Seamlessly adapts between physical Raspberry Pi GPIO pins (RPi.GPIO / gpiozero)
    and Laptop / Web Mock Mode for local testing and demonstration.
    """

    @classmethod
    def get_status(cls) -> Dict[str, Any]:
        return {
            "mode": "Raspberry Pi (Physical GPIO)" if hardware_state.is_raspberry_pi else "Simulation / Laptop Demo Mode",
            "is_raspberry_pi": hardware_state.is_raspberry_pi,
            "led_indicator": hardware_state.led_status,
            "buzzer": hardware_state.buzzer_active,
            "peripherals": {
                "camera": hardware_state.camera_ready,
                "speaker": hardware_state.speaker_ready,
                "microphone": hardware_state.microphone_ready,
            },
            "gpio_pins_mapping": {
                "GPIO_17": "Physical 'TAKEN' Green Pushbutton",
                "GPIO_27": "Physical 'REMIND LATER' Yellow Pushbutton",
                "GPIO_22": "Physical 'SOS EMERGENCY' Red Pushbutton",
                "GPIO_23": "RGB LED Red Channel",
                "GPIO_24": "RGB LED Green Channel",
                "GPIO_25": "Piezo Active Buzzer"
            },
            "last_event": {
                "button": hardware_state.last_button_pressed,
                "timestamp": hardware_state.last_event_time.isoformat() if hardware_state.last_event_time else None
            }
        }

    @classmethod
    def trigger_button_event(cls, button_name: str) -> Dict[str, Any]:
        """
        Simulates or receives an event from a physical tactile button:
        - 'TAKEN': marks current due dose as taken
        - 'REMIND_LATER': snoozes current dose for 15 minutes
        - 'SOS': triggers emergency caregiver alert
        """
        valid_buttons = ["TAKEN", "REMIND_LATER", "SOS"]
        btn = button_name.upper().strip()
        if btn not in valid_buttons:
            return {"success": False, "error": f"Unknown button {button_name}. Choose from {valid_buttons}"}

        hardware_state.last_button_pressed = btn
        hardware_state.last_event_time = datetime.now(timezone.utc)

        if btn == "TAKEN":
            hardware_state.led_status = "GREEN_IDLE"
            hardware_state.buzzer_active = False
        elif btn == "REMIND_LATER":
            hardware_state.led_status = "PULSE_YELLOW_DUE"
            hardware_state.buzzer_active = False
        elif btn == "SOS":
            hardware_state.led_status = "FLASH_RED_SOS"
            hardware_state.buzzer_active = True

        return {
            "success": True,
            "button_pressed": btn,
            "led_state": hardware_state.led_status,
            "buzzer": hardware_state.buzzer_active,
            "timestamp": hardware_state.last_event_time.isoformat()
        }

    @classmethod
    def set_led(cls, color_state: str) -> Dict[str, Any]:
        hardware_state.led_status = color_state
        return {"led_status": hardware_state.led_status}

