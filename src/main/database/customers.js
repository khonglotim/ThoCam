import { getDB } from './db'

function nextCode() {
  const last = getDB().prepare('SELECT code FROM customers ORDER BY id DESC LIMIT 1').get()
  if (!last) return 'KH-0001'
  const n = parseInt(last.code.replace('KH-', '')) + 1
  return 'KH-' + String(n).padStart(4, '0')
}

export function getAllCustomers() {
  return getDB().prepare('SELECT * FROM customers ORDER BY name ASC').all()
}

export function getCustomerById(id) {
  return getDB().prepare('SELECT * FROM customers WHERE id = ?').get(id)
}

export function getCustomerOrders(customerId) {
  return getDB().prepare(`
    SELECT o.*, c.name as customer_name
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.customer_id = ?
    ORDER BY o.id DESC
  `).all(customerId)
}

export function createCustomer(data) {
  const db = getDB()
  const code = nextCode()
  const result = db.prepare(`
    INSERT INTO customers (code, name, phone, address)
    VALUES (?, ?, ?, ?)
  `).run(code, data.name, data.phone || '', data.address || '')
  return getCustomerById(result.lastInsertRowid)
}

export function updateCustomer(id, data) {
  getDB().prepare(`
    UPDATE customers SET name=?, phone=?, address=? WHERE id=?
  `).run(data.name, data.phone || '', data.address || '', id)
  return getCustomerById(id)
}

export function deleteCustomer(id) {
  const hasOrders = getDB().prepare('SELECT COUNT(*) as n FROM orders WHERE customer_id = ?').get(id)
  if (hasOrders.n > 0) throw new Error('Không thể xoá khách hàng đã có đơn hàng')
  getDB().prepare('DELETE FROM customers WHERE id = ?').run(id)
  return { success: true }
}
