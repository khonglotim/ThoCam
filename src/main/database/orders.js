import { getDB } from './db'

function nextCode() {
  const last = getDB().prepare('SELECT code FROM orders ORDER BY id DESC LIMIT 1').get()
  if (!last) return 'DH-0001'
  const n = parseInt(last.code.replace('DH-', '')) + 1
  return 'DH-' + String(n).padStart(4, '0')
}

function calcStatus(paid, total) {
  if (paid >= total) return 'paid'
  if (paid > 0) return 'partial'
  return 'unpaid'
}

export function getAllOrders() {
  return getDB().prepare(`
    SELECT o.*, c.name as customer_name, c.code as customer_code
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    ORDER BY o.id DESC
  `).all()
}

export function getOrderById(id) {
  const db = getDB()
  const order = db.prepare(`
    SELECT o.*, c.name as customer_name
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ?
  `).get(id)
  if (!order) return null
  order.items = db.prepare(`
    SELECT oi.*, p.name as product_name, p.code as product_code, p.unit
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(id)
  return order
}

export function createOrder(data) {
  const db = getDB()
  const code = nextCode()
  const totalAmount = data.items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const paidAmount = data.paid_amount || 0
  const remainingDebt = totalAmount - paidAmount
  const status = calcStatus(paidAmount, totalAmount)

  const run = db.transaction(() => {
    const res = db.prepare(`
      INSERT INTO orders (code, date, customer_id, total_amount, paid_amount, remaining_debt, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(code, data.date, data.customer_id, totalAmount, paidAmount, remainingDebt, status, data.notes || '')

    const orderId = res.lastInsertRowid

    for (const item of data.items) {
      const product = db.prepare('SELECT cost_price, stock FROM products WHERE id = ?').get(item.product_id)
      if (!product) throw new Error(`Sản phẩm ID ${item.product_id} không tồn tại`)
      if (product.stock < item.quantity) throw new Error(`Không đủ tồn kho cho sản phẩm đã chọn`)

      db.prepare(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, cost_price)
        VALUES (?, ?, ?, ?, ?)
      `).run(orderId, item.product_id, item.quantity, item.unit_price, product.cost_price)

      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product_id)
    }

    db.prepare(`
      UPDATE customers
      SET total_purchased = total_purchased + ?,
          total_paid = total_paid + ?,
          debt = debt + ?
      WHERE id = ?
    `).run(totalAmount, paidAmount, remainingDebt, data.customer_id)

    return orderId
  })

  const orderId = run()
  return getOrderById(orderId)
}

export function updateOrderPayment(orderId, paymentAmount) {
  const db = getDB()

  db.transaction(() => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
    if (!order) throw new Error('Đơn hàng không tồn tại')
    if (paymentAmount <= 0) throw new Error('Số tiền thu phải lớn hơn 0')
    if (paymentAmount > order.remaining_debt) throw new Error('Số tiền thu vượt quá công nợ còn lại')

    const newPaid = order.paid_amount + paymentAmount
    const newDebt = Math.max(0, order.total_amount - newPaid)
    const newStatus = calcStatus(newPaid, order.total_amount)

    db.prepare(`
      UPDATE orders SET paid_amount=?, remaining_debt=?, status=? WHERE id=?
    `).run(newPaid, newDebt, newStatus, orderId)

    db.prepare(`
      UPDATE customers SET total_paid = total_paid + ?, debt = MAX(0, debt - ?) WHERE id = ?
    `).run(paymentAmount, paymentAmount, order.customer_id)
  })()

  return getOrderById(orderId)
}
