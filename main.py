from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select

from models import Product, ProductCreate, create_db_and_tables, engine

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

@app.post("/inventory", status_code=201)
def create_item(item: ProductCreate):
	with Session(engine) as session:
		if item.id is not None:
			existing_product = session.get(Product, item.id)
			if existing_product is not None:
				raise HTTPException(status_code=409, detail="Inventory item id already exists")

		new_product = Product(**item.model_dump())
		session.add(new_product)
		session.commit()
		session.refresh(new_product)

		return {
			"id": new_product.id,
			"name": new_product.item_name,
			"category": new_product.category,
			"quantity": new_product.quantity,
			"price": new_product.unit_price,
			"supplier": new_product.supplier,
			"last_restocked": new_product.last_restocked,
		}

@app.put("/inventory/{id}")
def modify_item(id: int, item: ProductCreate):
	with Session(engine) as session:
		if item.id is not None and item.id != id:
			raise HTTPException(status_code=400, detail="Body id must match path id")

		product = session.get(Product, id)
		if product is None:
			raise HTTPException(status_code=404, detail="Inventory item not found")

		product.item_name = item.item_name
		product.category = item.category
		product.quantity = item.quantity
		product.unit_price = item.unit_price
		product.supplier = item.supplier
		product.last_restocked = item.last_restocked

		session.add(product)
		session.commit()
		session.refresh(product)

		return {
			"id": product.id,
			"name": product.item_name,
			"category": product.category,
			"quantity": product.quantity,
			"price": product.unit_price,
			"supplier": product.supplier,
			"last_restocked": product.last_restocked,
		}

app.mount("/", StaticFiles(directory="static", html=True), name="static")