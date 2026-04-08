PRAGMA foreign_keys = ON;

-- Simple inventory table for a sports warehouse
CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit_price REAL NOT NULL CHECK (unit_price >= 0),
    supplier TEXT,
    last_restocked DATE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO inventory_items (item_name, category, quantity, unit_price, supplier, last_restocked)
VALUES
    ('Basketball - Indoor Size 7', 'Basketball', 45, 29.99, 'Hoops Supply Co.', '2026-04-01'),
    ('Basketball - Outdoor Size 6', 'Basketball', 35, 24.50, 'Court Gear Inc.', '2026-03-28'),
    ('Baseball Bat - Aluminum 32"', 'Baseball', 18, 79.00, 'Slugger Works', '2026-03-15'),
    ('Baseball Bat - Wood 34"', 'Baseball', 12, 64.95, 'Slugger Works', '2026-03-20'),
    ('Hockey Mask - Senior', 'Hockey', 10, 119.99, 'IceSafe Equipment', '2026-03-30'),
    ('Hockey Mask - Junior', 'Hockey', 14, 99.99, 'IceSafe Equipment', '2026-03-26'),
    ('Soccer Ball - Match', 'Soccer', 28, 39.99, 'Pitch Pro', '2026-04-03'),
    ('Tennis Racket - Midplus', 'Tennis', 16, 89.50, 'Ace Sports', '2026-03-22');

-- Trigger to keep updated_at current on row updates
CREATE TRIGGER IF NOT EXISTS trg_inventory_items_updated_at
AFTER UPDATE ON inventory_items
FOR EACH ROW
BEGIN
    UPDATE inventory_items
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;
