from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select

from models import Product, create_db_and_tables, engine

app = FastAPI()


@app.on_event("startup")
def on_startup() -> None:
	create_db_and_tables()


@app.get("/inventory")
def get_inventory():
	with Session(engine) as session:
		products = session.exec(select(Product)).all()
		return [
			{
				"id": product.id,
				"name": product.item_name,
				"category": product.category,
				"quantity": product.quantity,
				"price": product.unit_price,
				"supplier": product.supplier,
				"last_restocked": product.last_restocked,
			}
			for product in products
		]

@app.delete("/inventory/{id}") 
def delete_item(id: int):
	with Session(engine) as session:
		product = session.get(Product, id)
		if product is None:
			raise HTTPException(status_code=404, detail="Inventory item not found")

		session.delete(product)
		session.commit()
		return {"message": "Inventory item deleted", "id": id}

@app.post("/inventory")
def create_item()


app.mount("/", StaticFiles(directory="static", html=True), name="static")