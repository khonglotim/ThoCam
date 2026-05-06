import { getDB } from './db'

function nextCode() {
  const last = getDB().prepare('SELECT code FROM import_receipts ORDER BY id DESC LIMIT 1').get()
  if (!last) return 'PN-0001'
  const n = parseInt(last.code.replace('PN-', '')) + 1
  return 'PN-' + String(n).padStart(4, '0')
}

export function getAllImports() {
  return getDB().prepare(`
    SELECT ir.*,
      (SELECT COUNT(*) FROM import_items WHERE import_id = ir.id) as item_count
    FROM import_receipts ir
    ORDER BY ir.id DESC
  `).all()
}

export function getImportById(id) {
  const db = getDB()
  const receipt = db.prepare('SELECT * FROM import_receipts WHERE id = ?').get(id)
  if (!receipt) return null
  receipt.items = db.prepare(`
    SELECT ii.*, p.name as product_name, p.code as product_code, p.unit
    FROM import_items ii
    JOIN products p ON ii.product_id = p.id
    WHERE ii.import_id = ?
  `).all(id)
  return receipt
}

export function createImport(data) {
  const db = getDB()
  const code = nextCode()
  const totalAmount = data.items.reduce((s, i) => s + i.quantity * i.cost_price, 0)

  db.transaction(() => {
    const res = db.prepare(`
      INSERT INTO import_receipts (code, date, supplier, total_amount, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(code, data.date, data.supplier || '', totalAmount, data.notes || '')

    const importId = res.lastInsertRowid

    for (const item of data.items) {
      db.prepare(`
        INSERT INTO import_items (import_id, product_id, quantity, cost_price)
        VALUES (?, ?, ?, ?)
      `).run(importId, item.product_id, item.quantity, item.cost_price)

      const existing = db.prepare('SELECT stock, cost_price FROM products WHERE id = ?').get(item.product_id)
      const newStock = existing.stock + item.quantity
      const avgCost = newStock > 0
        ? (existing.stock * existing.cost_price + item.quantity * item.cost_price) / newStock
        : item.cost_price
      db.prepare('UPDATE products SET stock = stock + ?, cost_price = ? WHERE id = ?')
        .run(item.quantity, avgCost, item.product_id)
    }
  })()

  return { code, totalAmount }
}
