from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.position import PositionRead


class PortfolioCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)


class PortfolioUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=200)


class PortfolioRead(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PortfolioDetail(PortfolioRead):
    positions: list[PositionRead]
