import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

let db

export function initDB() {
  const dbPath = app.isPackaged
    ? join(app.getPath('userData'), 'tho-cam.db')
    : join(process.cwd(), 'tho-cam.db')

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  createTables(db)
  return db
}

export function getDB() {
  if (!db) throw new Error('Database chưa được khởi tạo')
  return db
}

function createTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      total_purchased REAL DEFAULT 0,
      total_paid REAL DEFAULT 0,
      debt REAL DEFAULT 0,
      created_at TEXT DEFAULT (strftime('%d/%m/%Y', 'now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT DEFAULT '',
      unit TEXT DEFAULT 'Cái',
      cost_price REAL DEFAULT 0,
      sell_price REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      stock_warning INTEGER DEFAULT 10,
      created_at TEXT DEFAULT (strftime('%d/%m/%Y', 'now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS import_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      supplier TEXT DEFAULT '',
      total_amount REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (strftime('%d/%m/%Y %H:%M', 'now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS import_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      import_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      cost_price REAL NOT NULL,
      FOREIGN KEY (import_id) REFERENCES import_receipts(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      customer_id INTEGER NOT NULL,
      total_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      remaining_debt REAL DEFAULT 0,
      status TEXT DEFAULT 'unpaid',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (strftime('%d/%m/%Y %H:%M', 'now', 'localtime')),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      cost_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS debt_collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      customer_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      debt_before REAL DEFAULT 0,
      debt_after REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      order_id INTEGER,
      created_at TEXT DEFAULT (strftime('%d/%m/%Y %H:%M', 'now', 'localtime')),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `)
}
