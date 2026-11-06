from pydantic import BaseModel
from fastapi import APIRouter
from app.services.hardware_service import HardwareAbstractionLayer

router = APIRouter()

class ButtonTriggerPayload(BaseModel):
    button: str  # TAKEN, REMIND_LATER, SOS

class LEDPayload(BaseModel):
    state: str  # GREEN_IDLE, PULSE_YELLOW_DUE, FLASH_RED_SOS

@router.get("/status")
def get_hardware_status():
    return HardwareAbstractionLayer.get_status()

@router.post("/button")
def trigger_button(payload: ButtonTriggerPayload):
    return HardwareAbstractionLayer.trigger_button_event(payload.button)

@router.post("/led")
def set_led_indicator(payload: LEDPayload):
    return HardwareAbstractionLayer.set_led(payload.state)

