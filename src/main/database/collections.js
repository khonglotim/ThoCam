import { getDB } from './db'

export function getAllCollections() {
  return getDB().prepare(`
    SELECT dc.*, c.name as customer_name, c.code as customer_code,
      o.code as order_code
    FROM debt_collections dc
    JOIN customers c ON dc.customer_id = c.id
    LEFT JOIN orders o ON dc.order_id = o.id
    ORDER BY dc.id DESC
  `).all()
}

export function createCollection(data) {
  const db = getDB()

  db.transaction(() => {
    const customer = db.prepare('SELECT debt FROM customers WHERE id = ?').get(data.customer_id)
    if (!customer) throw new Error('Khách hàng không tồn tại')

    const debtBefore = customer.debt
    const debtAfter = Math.max(0, debtBefore - data.amount)

    db.prepare(`
      INSERT INTO debt_collections (date, customer_id, amount, debt_before, debt_after, notes, order_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.date, data.customer_id, data.amount,
      debtBefore, debtAfter,
      data.notes || '', data.order_id || null
    )

    db.prepare(`
      UPDATE customers SET total_paid = total_paid + ?, debt = MAX(0, debt - ?) WHERE id = ?
    `).run(data.amount, data.amount, data.customer_id)

    if (data.order_id) {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(data.order_id)
      if (order) {
        const newPaid = order.paid_amount + data.amount
        const newDebt = Math.max(0, order.total_amount - newPaid)
        const status = newDebt === 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid'
        db.prepare(`
          UPDATE orders SET paid_amount=?, remaining_debt=?, status=? WHERE id=?
        `).run(newPaid, newDebt, status, data.order_id)
      }
    }
  })()

  return { success: true }
}
