from pydantic import BaseModel


class AnalyzeResponse(BaseModel):
    session_id: str
    status: str
    message: str
    ws_url: str
