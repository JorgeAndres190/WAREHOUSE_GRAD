# WAREHOUSE_GRAD
Warehouse grad app

## SQLite Sports Warehouse Database

This project includes a simple SQLite database for sports inventory.

- Database file: `sports_warehouse.db`
- Initialization script: `db/init_sports_warehouse.sql`

### Recreate the database

```bash
cd /workspaces/WAREHOUSE_GRAD
rm -f sports_warehouse.db
sqlite3 sports_warehouse.db < db/init_sports_warehouse.sql
```

### Example query

```bash
sqlite3 sports_warehouse.db "SELECT id, item_name, category, quantity, unit_price FROM inventory_items ORDER BY id;"
```
