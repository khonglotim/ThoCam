async function invoke(channel, data) {
  const result = await window.api.invoke(channel, data)
  if (!result.success) throw new Error(result.error || 'Lỗi không xác định')
  return result.data
}

export const customers = {
  getAll: () => invoke('customers:getAll'),
  getById: (id) => invoke('customers:getById', { id }),
  getOrders: (id) => invoke('customers:getOrders', { id }),
  create: (data) => invoke('customers:create', data),
  update: (id, data) => invoke('customers:update', { id, ...data }),
  delete: (id) => invoke('customers:delete', { id })
}

export const products = {
  getAll: () => invoke('products:getAll'),
  getById: (id) => invoke('products:getById', { id }),
  create: (data) => invoke('products:create', data),
  update: (id, data) => invoke('products:update', { id, ...data }),
  delete: (id) => invoke('products:delete', { id })
}

export const orders = {
  getAll: () => invoke('orders:getAll'),
  getById: (id) => invoke('orders:getById', { id }),
  create: (data) => invoke('orders:create', data),
  updatePayment: (orderId, amount) => invoke('orders:updatePayment', { orderId, amount })
}

export const imports = {
  getAll: () => invoke('imports:getAll'),
  getById: (id) => invoke('imports:getById', { id }),
  create: (data) => invoke('imports:create', data)
}

export const collections = {
  getAll: () => invoke('collections:getAll'),
  create: (data) => invoke('collections:create', data)
}

export const dashboard = {
  getStats: () => invoke('dashboard:getStats')
}

export const reports = {
  getMonthly: () => invoke('reports:getMonthly'),
  getTopCustomers: () => invoke('reports:getTopCustomers')
}
