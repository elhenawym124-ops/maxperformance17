from __future__ import annotations
from pydantic import BaseModel, Field
from src.skills.base import Skill

class BookingReserveInput(BaseModel):
    service_name: str = Field(description="Service or doctor name to book")
    appointment_date: str = Field(description="Appointment date (YYYY-MM-DD)")
    appointment_time: str = Field(description="Appointment time (HH:MM)")
    patient_name: str = Field(description="Patient full name")
    patient_phone: str = Field(description="Patient phone number")
    branch_name: str = Field(default="", description="Branch name where customer wants to book")
    gender: str = Field(default="", description="ذكر or أنثى")
    company_id: str = Field(default="", description="")

async def reserve_booking(params: BookingReserveInput) -> dict:
    from src.tools.booking_tools import reserve_appointment as _reserve
    result = await _reserve(
        company_id=params.company_id,
        patient_name=params.patient_name,
        patient_phone=params.patient_phone,
        gender=params.gender,
        service_name=params.service_name,
        branch_name=params.branch_name,
        appointment_date=params.appointment_date,
        appointment_time=params.appointment_time,
    )
    return result

booking_reserve = Skill(
    name="booking_reserve_skill",
    description="Reserve a medical appointment or service booking. Use when customer wants to book a doctor, clinic appointment, or service.",
    input_schema=BookingReserveInput,
    handler=reserve_booking,
    internal_fields=["company_id"],
)
