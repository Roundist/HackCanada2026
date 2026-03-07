from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    business_description: str = Field(..., min_length=50, max_length=5000)
    demo_profile_id: str | None = None
