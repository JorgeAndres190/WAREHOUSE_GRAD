from datetime import date, datetime
from typing import Optional

from sqlmodel import Field, SQLModel, create_engine


class Product(SQLModel, table=True):
	__tablename__ = "inventory_items"

	id: Optional[int] = Field(default=None, primary_key=True)
	item_name: str
	category: str
	quantity: int = Field(default=0, ge=0)
	unit_price: float = Field(ge=0)
	supplier: Optional[str] = None
	last_restocked: Optional[date] = None
	created_at: datetime = Field(default_factory=datetime.utcnow)
	updated_at: datetime = Field(default_factory=datetime.utcnow)


DATABASE_URL = "sqlite:///sports_warehouse.db"
engine = create_engine(DATABASE_URL, echo=False)


def create_db_and_tables() -> None:
	SQLModel.metadata.create_all(engine)

