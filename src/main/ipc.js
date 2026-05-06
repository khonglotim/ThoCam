import { ipcMain } from 'electron'
import * as customers from './database/customers'
import * as products from './database/products'
import * as orders from './database/orders'
import * as imports from './database/imports'
import * as collections from './database/collections'
import { getDB } from './database/db'

function handle(channel, fn) {
  ipcMain.handle(channel, async (_, data) => {
    try {
      return { success: true, data: fn(data) }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })
}

export function registerAllHandlers() {
  handle('customers:getAll', () => customers.getAllCustomers())
  handle('customers:getById', ({ id }) => customers.getCustomerById(id))
  handle('customers:getOrders', ({ id }) => customers.getCustomerOrders(id))
  handle('customers:create', (data) => customers.createCustomer(data))
  handle('customers:update', ({ id, ...data }) => customers.updateCustomer(id, data))
  handle('customers:delete', ({ id }) => customers.deleteCustomer(id))

  handle('products:getAll', () => products.getAllProducts())
  handle('products:getById', ({ id }) => products.getProductById(id))
  handle('products:create', (data) => products.createProduct(data))
  handle('products:update', ({ id, ...data }) => products.updateProduct(id, data))
  handle('products:delete', ({ id }) => products.deleteProduct(id))

  handle('orders:getAll', () => orders.getAllOrders())
  handle('orders:getById', ({ id }) => orders.getOrderById(id))
  handle('orders:create', (data) => orders.createOrder(data))
  handle('orders:updatePayment', ({ orderId, amount }) => orders.updateOrderPayment(orderId, amount))

  handle('imports:getAll', () => imports.getAllImports())
  handle('imports:getById', ({ id }) => imports.getImportById(id))
  handle('imports:create', (data) => imports.createImport(data))

  handle('collections:getAll', () => collections.getAllCollections())
  handle('collections:create', (data) => collections.createCollection(data))

  handle('dashboard:getStats', () => {
    const db = getDB()
    const now = new Date()
    const monthYear = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`

    const rev = db.prepare(`
      SELECT
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) as revenue,
        COALESCE(SUM(oi.quantity * oi.cost_price), 0) as cost
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE SUBSTR(o.date, 4, 7) = ?
    `).get(monthYear)

    const totalDebt = db.prepare('SELECT COALESCE(SUM(debt), 0) as total FROM customers WHERE debt > 0').get()
    const debtorsCount = db.prepare('SELECT COUNT(*) as n FROM customers WHERE debt > 0').get()
    const lowStock = db.prepare('SELECT COUNT(*) as n FROM products WHERE stock <= stock_warning').get()
    const recentOrders = db.prepare(`
      SELECT o.*, c.name as customer_name
      FROM orders o JOIN customers c ON o.customer_id = c.id
      ORDER BY o.id DESC LIMIT 5
    `).all()
    const topDebtors = db.prepare(`
      SELECT id, name, debt, total_purchased, total_paid
      FROM customers WHERE debt > 0
      ORDER BY debt DESC LIMIT 5
    `).all()

    return {
      revenue: rev.revenue,
      cost: rev.cost,
      profit: rev.revenue - rev.cost,
      profitRate: rev.revenue > 0 ? ((rev.revenue - rev.cost) / rev.revenue * 100).toFixed(1) : 0,
      totalDebt: totalDebt.total,
      debtorsCount: debtorsCount.n,
      lowStock: lowStock.n,
      recentOrders,
      topDebtors
    }
  })

  handle('reports:getMonthly', () => {
    return getDB().prepare(`
      SELECT
        SUBSTR(o.date, 4, 2) || '/' || SUBSTR(o.date, 7, 4) as month,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) as revenue,
        COALESCE(SUM(oi.quantity * oi.cost_price), 0) as cost,
        COALESCE(SUM(oi.quantity * oi.unit_price) - SUM(oi.quantity * oi.cost_price), 0) as profit
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      GROUP BY SUBSTR(o.date, 7, 4) || SUBSTR(o.date, 4, 2)
      ORDER BY SUBSTR(o.date, 7, 4) || SUBSTR(o.date, 4, 2) DESC
    `).all()
  })

  handle('reports:getTopCustomers', () => {
    return getDB().prepare(`
      SELECT id, code, name, total_purchased, total_paid, debt
      FROM customers WHERE total_purchased > 0
      ORDER BY total_purchased DESC LIMIT 10
    `).all()
  })
}
