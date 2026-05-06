const { app } = require('electron')
const Database = require('better-sqlite3')
const { join } = require('path')

app.whenReady().then(() => {
  const db = new Database(join(process.cwd(), 'tho-cam.db'))
  db.pragma('foreign_keys = ON')

  db.exec(`
    DELETE FROM debt_collections;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM import_items;
    DELETE FROM import_receipts;
    DELETE FROM products;
    DELETE FROM customers;
  `)

  // Khách hàng
  const ic = db.prepare(`INSERT INTO customers (code,name,phone,address,total_purchased,total_paid,debt) VALUES (?,?,?,?,?,?,?)`)
  ic.run('KH-0001','Cửa hàng Hoa Mai','0912 345 678','Số 12 Nguyễn Huệ, Sơn La',36000000,36000000,0)
  ic.run('KH-0002','Đại lý Sơn La','0934 567 890','Thị trấn Sơn La, Sơn La',82000000,17000000,65000000)
  ic.run('KH-0003','Shop Vân Hương','0956 789 012','Số 8 Lê Lợi, Điện Biên Phủ',51000000,0,51000000)
  ic.run('KH-0004','Cửa hàng Bắc Hà','0978 901 234','Phố Cổ Bắc Hà, Lào Cai',29000000,29000000,0)
  ic.run('KH-0005','Đại lý Lai Châu','0901 234 567','Số 5 Trần Phú, Lai Châu',48000000,16000000,32000000)

  // Sản phẩm
  const ip = db.prepare(`INSERT INTO products (code,name,category,unit,cost_price,sell_price,stock,stock_warning) VALUES (?,?,?,?,?,?,?,?)`)
  ip.run('SP-001','Khăn thổ cẩm truyền thống','Khăn','Cái',180000,300000,48,10)
  ip.run('SP-002','Túi thổ cẩm đeo chéo','Túi','Cái',220000,410000,12,15)
  ip.run('SP-003','Vải thổ cẩm họa tiết hoa','Vải','Mét',95000,160000,3,10)
  ip.run('SP-004','Áo thổ cẩm nữ','Áo','Cái',340000,580000,24,8)
  ip.run('SP-005','Bộ gối thổ cẩm','Đồ dùng','Bộ',280000,450000,2,5)
  ip.run('SP-006','Khăn trải bàn thổ cẩm','Khăn','Cái',150000,250000,30,10)
  ip.run('SP-007','Ví thổ cẩm nữ','Túi','Cái',85000,150000,20,10)
  ip.run('SP-008','Áo thổ cẩm nam','Áo','Cái',360000,620000,15,8)

  // Phiếu nhập
  const ir = db.prepare(`INSERT INTO import_receipts (code,date,supplier,total_amount,notes) VALUES (?,?,?,?,?)`)
  const ii = db.prepare(`INSERT INTO import_items (import_id,product_id,quantity,cost_price) VALUES (?,?,?,?)`)

  const pn1 = ir.run('PN-0001','10/04/2026','Làng nghề Mường Lò',18900000,'Hàng đầu tháng')
  ii.run(pn1.lastInsertRowid,1,50,180000); ii.run(pn1.lastInsertRowid,2,30,220000); ii.run(pn1.lastInsertRowid,6,40,150000)

  const pn2 = ir.run('PN-0002','18/04/2026','HTX Thổ Cẩm Tây Bắc',22200000,'')
  ii.run(pn2.lastInsertRowid,3,50,95000); ii.run(pn2.lastInsertRowid,4,30,340000); ii.run(pn2.lastInsertRowid,5,20,280000)

  const pn3 = ir.run('PN-0003','01/05/2026','Làng nghề Mường Lò',10450000,'Bổ sung hàng bán chạy')
  ii.run(pn3.lastInsertRowid,7,30,85000); ii.run(pn3.lastInsertRowid,8,20,360000)

  // Đơn bán
  const io = db.prepare(`INSERT INTO orders (code,date,customer_id,total_amount,paid_amount,remaining_debt,status,notes) VALUES (?,?,?,?,?,?,?,?)`)
  const ioi = db.prepare(`INSERT INTO order_items (order_id,product_id,quantity,unit_price,cost_price) VALUES (?,?,?,?,?)`)

  const dh19 = io.run('DH-0019','01/05/2026',4,2900000,2900000,0,'paid','')
  ioi.run(dh19.lastInsertRowid,1,5,300000,180000); ioi.run(dh19.lastInsertRowid,7,8,150000,85000)

  const dh20 = io.run('DH-0020','03/05/2026',5,4800000,1600000,3200000,'partial','')
  ioi.run(dh20.lastInsertRowid,4,6,580000,340000); ioi.run(dh20.lastInsertRowid,6,3,250000,150000)

  const dh21 = io.run('DH-0021','04/05/2026',1,3600000,3600000,0,'paid','Khách VIP')
  ioi.run(dh21.lastInsertRowid,1,12,300000,180000)

  const dh22 = io.run('DH-0022','05/05/2026',3,5100000,0,5100000,'unpaid','')
  ioi.run(dh22.lastInsertRowid,3,15,160000,95000); ioi.run(dh22.lastInsertRowid,5,5,450000,280000)

  const dh23 = io.run('DH-0023','06/05/2026',2,8200000,1700000,6500000,'partial','Giao hàng đợt 2')
  ioi.run(dh23.lastInsertRowid,2,20,410000,220000)

  // Thu nợ
  const icl = db.prepare(`INSERT INTO debt_collections (date,customer_id,amount,debt_before,debt_after,notes,order_id) VALUES (?,?,?,?,?,?,?)`)
  icl.run('06/05/2026',2,1700000,8200000,6500000,'Trả tiền lần 1',dh23.lastInsertRowid)
  icl.run('03/05/2026',5,1600000,4800000,3200000,'Thanh toán một phần',dh20.lastInsertRowid)

  db.close()
  console.log('✅ Seed data thành công!')
  app.quit()
})
