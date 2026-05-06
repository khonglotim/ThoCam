import { getDB } from './db'

function nextCode() {
  const last = getDB().prepare('SELECT code FROM products ORDER BY id DESC LIMIT 1').get()
  if (!last) return 'SP-001'
  const n = parseInt(last.code.replace('SP-', '')) + 1
  return 'SP-' + String(n).padStart(3, '0')
}

export function getAllProducts() {
  return getDB().prepare('SELECT * FROM products ORDER BY name ASC').all()
}

export function getProductById(id) {
  return getDB().prepare('SELECT * FROM products WHERE id = ?').get(id)
}

export function createProduct(data) {
  const db = getDB()
  const code = nextCode()
  const result = db.prepare(`
    INSERT INTO products (code, name, category, unit, cost_price, sell_price, stock, stock_warning)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    code, data.name, data.category || '', data.unit || 'Cái',
    data.cost_price || 0, data.sell_price || 0, data.stock || 0, data.stock_warning || 10
  )
  return getProductById(result.lastInsertRowid)
}

export function updateProduct(id, data) {
  getDB().prepare(`
    UPDATE products SET name=?, category=?, unit=?, cost_price=?, sell_price=?, stock_warning=?
    WHERE id=?
  `).run(
    data.name, data.category || '', data.unit || 'Cái',
    data.cost_price || 0, data.sell_price || 0, data.stock_warning || 10, id
  )
  return getProductById(id)
}

export function deleteProduct(id) {
  const db = getDB()
  const inOrders = db.prepare('SELECT COUNT(*) as n FROM order_items WHERE product_id = ?').get(id)
  const inImports = db.prepare('SELECT COUNT(*) as n FROM import_items WHERE product_id = ?').get(id)
  if (inOrders.n > 0 || inImports.n > 0) throw new Error('Không thể xoá sản phẩm đã có giao dịch')
  db.prepare('DELETE FROM products WHERE id = ?').run(id)
  return { success: true }
}
