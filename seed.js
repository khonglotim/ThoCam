const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(process.cwd(), 'tho-cam.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function log(msg) { console.log('[SEED]', msg) }

// ─── CREATE TABLES ───────────────────────────────────────────
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
    unit TEXT DEFAULT 'Cai',
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
log('Tables ready')

// ─── CUSTOMERS ───────────────────────────────────────────────
const insC = db.prepare('INSERT INTO customers (code,name,phone,address,created_at) VALUES (?,?,?,?,?)')
const custData = [
  ['KH-0001', 'Nguyen Thi Hoa',  '0912345678', 'Buon Ma Thuot, Dak Lak',  '01/03/2026'],
  ['KH-0002', 'Tran Van Nam',    '0908765432', 'Hai Chau, Da Nang',        '01/03/2026'],
  ['KH-0003', 'Le Thi Mai',      '0977654321', 'Hoan Kiem, Ha Noi',        '01/03/2026'],
  ['KH-0004', 'Pham Van Duc',    '0965432187', 'Ninh Kieu, Can Tho',       '01/03/2026'],
  ['KH-0005', 'Hoang Thi Lan',   '0934218765', 'Le Chan, Hai Phong',       '01/03/2026'],
]
for (const r of custData) insC.run(...r)
log('Customers: ' + custData.length + ' inserted')

// ─── PRODUCTS ────────────────────────────────────────────────
const insP = db.prepare('INSERT INTO products (code,name,category,unit,cost_price,sell_price,stock,stock_warning,created_at) VALUES (?,?,?,?,?,?,0,?,?)')
const prodData = [
  ['SP-0001','Khan tho cam Tay Nguyen', 'Khan',    'Chiec', 80000, 120000, 15,'01/03/2026'],
  ['SP-0002','Tui tho cam truyen thong','Tui',     'Cai',  150000, 220000, 10,'01/03/2026'],
  ['SP-0003','Ao tho cam nu',           'Ao',      'Chiec',350000, 500000, 10,'01/03/2026'],
  ['SP-0004','Vay tho cam HMong',       'Vay',     'Chiec',450000, 650000,  8,'01/03/2026'],
  ['SP-0005','Tam tho cam trang tri',   'Tam vai', 'Tam',  200000, 300000, 10,'01/03/2026'],
  ['SP-0006','Khan quang tho cam',      'Khan',    'Chiec', 95000, 145000, 15,'01/03/2026'],
  ['SP-0007','Vi tho cam handmade',     'Phu kien','Cai',   75000, 120000, 20,'01/03/2026'],
  ['SP-0008','Ao tho cam nam',          'Ao',      'Chiec',380000, 550000, 10,'01/03/2026'],
  ['SP-0009','Dep tho cam',             'Giay dep','Doi',  180000, 270000, 10,'01/03/2026'],
  ['SP-0010','Mu tho cam',              'Phu kien','Cai',  120000, 180000, 10,'01/03/2026'],
]
for (const r of prodData) insP.run(...r)
log('Products: ' + prodData.length + ' inserted')

function pid(code) { return db.prepare('SELECT id FROM products WHERE code=?').get(code).id }
function cid(code) { return db.prepare('SELECT id FROM customers WHERE code=?').get(code).id }

// ─── IMPORT RECEIPTS ─────────────────────────────────────────
//   PN-0001: 01/03/2026  PN-0002: 15/03/2026  PN-0003: 01/04/2026
const imports = [
  { code:'PN-0001', date:'01/03/2026', supplier:'NCC Tho cam Tay Bac', items:[
    {p:'SP-0001',q:50,c:80000},{p:'SP-0002',q:30,c:150000},{p:'SP-0003',q:20,c:350000},
    {p:'SP-0004',q:20,c:450000},{p:'SP-0005',q:40,c:200000}
  ]},
  { code:'PN-0002', date:'15/03/2026', supplier:'NCC Tho cam Tay Nguyen', items:[
    {p:'SP-0006',q:50,c:95000},{p:'SP-0007',q:60,c:75000},{p:'SP-0008',q:25,c:380000},
    {p:'SP-0009',q:35,c:180000},{p:'SP-0010',q:40,c:120000}
  ]},
  { code:'PN-0003', date:'01/04/2026', supplier:'NCC Dang Van Hung', items:[
    {p:'SP-0001',q:30,c:82000},{p:'SP-0003',q:15,c:355000},{p:'SP-0008',q:20,c:385000}
  ]},
]

const insIR = db.prepare('INSERT INTO import_receipts (code,date,supplier,total_amount,created_at) VALUES (?,?,?,?,?)')
const insII = db.prepare('INSERT INTO import_items (import_id,product_id,quantity,cost_price) VALUES (?,?,?,?)')
const addStock = db.prepare('UPDATE products SET stock=stock+?, cost_price=? WHERE id=?')

for (const imp of imports) {
  const total = imp.items.reduce((s,i) => s + i.q*i.c, 0)
  db.transaction(() => {
    const rid = insIR.run(imp.code, imp.date, imp.supplier, total, imp.date+' 08:00').lastInsertRowid
    for (const it of imp.items) {
      insII.run(rid, pid(it.p), it.q, it.c)
      addStock.run(it.q, it.c, pid(it.p))
    }
  })()
}
log('Import receipts: 3 inserted')

// Stock sau nhap:
// SP-0001=80(cost82k) SP-0002=30 SP-0003=35(cost355k) SP-0004=20 SP-0005=40
// SP-0006=50 SP-0007=60 SP-0008=45(cost385k) SP-0009=35 SP-0010=40

// ─── ORDERS ──────────────────────────────────────────────────
const orders = [
  { code:'DH-0001', date:'05/03/2026', ccode:'KH-0001', paid:2300000, items:[
    {p:'SP-0001',q:10,price:120000},{p:'SP-0002',q:5,price:220000}
  ]}, // total 2,300,000 → paid full
  { code:'DH-0002', date:'10/03/2026', ccode:'KH-0002', paid:2000000, items:[
    {p:'SP-0003',q:5,price:500000},{p:'SP-0004',q:3,price:650000}
  ]}, // total 4,450,000 → partial
  { code:'DH-0003', date:'20/03/2026', ccode:'KH-0003', paid:0, items:[
    {p:'SP-0005',q:10,price:300000},{p:'SP-0006',q:15,price:145000}
  ]}, // total 5,175,000 → unpaid
  { code:'DH-0004', date:'01/04/2026', ccode:'KH-0001', paid:3600000, items:[
    {p:'SP-0001',q:20,price:120000},{p:'SP-0007',q:10,price:120000}
  ]}, // total 3,600,000 → paid full
  { code:'DH-0005', date:'05/04/2026', ccode:'KH-0004', paid:3000000, items:[
    {p:'SP-0008',q:8,price:550000},{p:'SP-0009',q:10,price:270000}
  ]}, // total 7,100,000 → partial
  { code:'DH-0006', date:'10/04/2026', ccode:'KH-0005', paid:0, items:[
    {p:'SP-0010',q:20,price:180000},{p:'SP-0006',q:10,price:145000}
  ]}, // total 5,050,000 → unpaid
]

const insO  = db.prepare('INSERT INTO orders (code,date,customer_id,total_amount,paid_amount,remaining_debt,status,created_at) VALUES (?,?,?,?,?,?,?,?)')
const insOI = db.prepare('INSERT INTO order_items (order_id,product_id,quantity,unit_price,cost_price) VALUES (?,?,?,?,?)')
const subStock = db.prepare('UPDATE products SET stock=stock-? WHERE id=?')
const updCust  = db.prepare('UPDATE customers SET total_purchased=total_purchased+?,total_paid=total_paid+?,debt=debt+? WHERE id=?')

for (const ord of orders) {
  const total = ord.items.reduce((s,i) => s + i.q*i.price, 0)
  const rem   = total - ord.paid
  const status = ord.paid >= total ? 'paid' : ord.paid > 0 ? 'partial' : 'unpaid'
  const custId = cid(ord.ccode)

  db.transaction(() => {
    const oid = insO.run(ord.code, ord.date, custId, total, ord.paid, rem, status, ord.date+' 09:00').lastInsertRowid
    for (const it of ord.items) {
      const prodId = pid(it.p)
      const prod = db.prepare('SELECT cost_price FROM products WHERE id=?').get(prodId)
      insOI.run(oid, prodId, it.q, it.price, prod.cost_price)
      subStock.run(it.q, prodId)
    }
    updCust.run(total, ord.paid, rem, custId)
  })()
}
log('Orders: 6 inserted')

// ─── DEBT COLLECTIONS ────────────────────────────────────────
const insCol   = db.prepare('INSERT INTO debt_collections (date,customer_id,amount,debt_before,debt_after,notes,order_id,created_at) VALUES (?,?,?,?,?,?,?,?)')
const updOPay  = db.prepare('UPDATE orders SET paid_amount=?,remaining_debt=?,status=? WHERE id=?')
const updCPay  = db.prepare('UPDATE customers SET total_paid=total_paid+?,debt=MAX(0,debt-?) WHERE id=?')

const colData = [
  { date:'15/04/2026', ccode:'KH-0002', amount:1500000, ocode:'DH-0002', notes:'Thu no dot 1' },
  { date:'20/04/2026', ccode:'KH-0004', amount:2000000, ocode:'DH-0005', notes:'Thu no dot 1' },
]

for (const col of colData) {
  const custId = cid(col.ccode)
  const ordRow = db.prepare('SELECT id FROM orders WHERE code=?').get(col.ocode)
  const oid    = ordRow ? ordRow.id : null

  db.transaction(() => {
    const cust = db.prepare('SELECT debt FROM customers WHERE id=?').get(custId)
    const before = cust.debt
    const after  = Math.max(0, before - col.amount)
    insCol.run(col.date, custId, col.amount, before, after, col.notes, oid, col.date+' 10:00')
    updCPay.run(col.amount, col.amount, custId)
    if (oid) {
      const ord = db.prepare('SELECT * FROM orders WHERE id=?').get(oid)
      const newPaid = ord.paid_amount + col.amount
      const newDebt = Math.max(0, ord.total_amount - newPaid)
      const st = newDebt === 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid'
      updOPay.run(newPaid, newDebt, st, oid)
    }
  })()
}
log('Collections: 2 inserted')

// ─── SUMMARY ─────────────────────────────────────────────────
log('=================================')
const stocks = db.prepare('SELECT code,stock FROM products ORDER BY code').all()
log('Stock: ' + stocks.map(s => s.code+'='+s.stock).join(' | '))
const debts  = db.prepare('SELECT code,debt FROM customers ORDER BY code').all()
log('Debt:  ' + debts.map(c => c.code+'='+c.debt).join(' | '))
log('=================================')
log('DONE!')

db.close()
process.exit(0)
