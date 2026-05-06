# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quy tắc làm việc

- Luôn gọi người dùng là **boss**.
- Trước khi viết hoặc thay đổi bất kỳ đoạn code nào, **bắt buộc phải trình bày kế hoạch và chờ boss phê duyệt**. Không được tự ý quyết định hay thực thi code khi chưa được đồng ý.

## ⚠️ QUY TẮC TỐI THƯỢNG — KHÔNG ĐƯỢC VI PHẠM

> **TRƯỚC KHI LÀM BẤT KỲ VIỆC GÌ — DÙ LÀ SỬA CODE, CHẠY LỆNH, PUSH GIT, XÓA FILE, HAY BẤT CỨ THAO TÁC NÀO — ĐỀU PHẢI TRÌNH BÀY KẾ HOẠCH VÀ CHỜ BOSS PHÊ DUYỆT. TUYỆT ĐỐI KHÔNG TỰ Ý QUYẾT ĐỊNH.**

## Project Overview

Hệ thống quản lý bán sỉ hàng thổ cẩm — hỗ trợ doanh nghiệp theo dõi nhập/xuất hàng, công nợ khách hàng, doanh thu và lợi nhuận. Phiên bản 1.0, tháng 05/2026.

## Tech Stack

- **Frontend:** React 18 + Vite (renderer process)
- **Backend:** Electron 33 (main process, Node.js)
- **Database:** SQLite via better-sqlite3
- **Build tool:** electron-vite
- **Đóng gói:** electron-builder (bước 6, chưa làm)

## Development Commands

```bash
# Cài dependencies
npm install

# Rebuild better-sqlite3 cho Electron (chạy sau npm install)
npx @electron/rebuild -f -w better-sqlite3

# Chạy dev server
npm run dev

# Build production
npm run build
```

## Architecture

```
src/
├── main/                  # Electron main process
│   ├── index.js           # Entry point
│   ├── ipc.js             # Tất cả IPC handlers
│   └── database/
│       ├── db.js          # Kết nối & init SQLite
│       ├── customers.js
│       ├── products.js
│       ├── orders.js
│       ├── imports.js
│       └── collections.js
├── preload/
│   └── index.js           # contextBridge expose window.api
└── renderer/
    ├── index.html
    └── src/
        ├── main.jsx        # React entry
        ├── App.jsx         # Root, quản lý view state
        ├── api.js          # Wrapper gọi IPC từ renderer
        ├── utils.js        # fmtFull, fmt, todayDisplay, isoToDisplay...
        ├── styles/global.css
        ├── components/
        │   ├── Sidebar.jsx
        │   └── TabNav.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── DonBan.jsx
            ├── NhapHang.jsx
            ├── ThuNo.jsx
            ├── HangHoa.jsx
            ├── KhachHang.jsx
            └── BaoCao.jsx
```

### IPC Channels (renderer → main)
| Channel | Mô tả |
|---|---|
| `customers:getAll/getById/getOrders/create/update/delete` | CRUD khách hàng |
| `products:getAll/getById/create/update/delete` | CRUD hàng hoá |
| `orders:getAll/getById/create/updatePayment` | CRUD đơn bán |
| `imports:getAll/getById/create` | Phiếu nhập |
| `collections:getAll/create` | Thu nợ |
| `dashboard:getStats` | KPI dashboard |
| `reports:getMonthly/getTopCustomers` | Báo cáo |

## Business Domain

### Các module chính

| Module | Chức năng |
|---|---|
| Khách hàng | Quản lý đại lý / người mua sỉ, theo dõi công nợ |
| Hàng hoá | Danh mục sản phẩm thổ cẩm, tồn kho, ngưỡng cảnh báo |
| Nhập hàng | Phiếu nhập kho, ghi nhận giá vốn |
| Đơn bán | Tạo đơn bán sỉ, thanh toán (toàn phần / một phần) |
| Thu nợ | Ghi nhận thu tiền, lịch sử thu nợ |
| Báo cáo | Doanh thu, lợi nhuận, tồn kho, top khách hàng |

### Entities & trường dữ liệu quan trọng

**Khách hàng:** mã KH (tự sinh), tên, SĐT, địa chỉ, tổng tiền đã mua, tổng tiền đã trả, công nợ hiện tại (= tổng mua − tổng đã trả).

**Sản phẩm:** mã SP (tự sinh), tên, danh mục, đơn vị tính, giá vốn, giá bán sỉ, số lượng tồn kho, ngưỡng cảnh báo tồn kho.

**Phiếu nhập:** mã (tự sinh), ngày nhập, nhà cung cấp, danh sách {sản phẩm, số lượng, giá vốn}, tổng tiền nhập.

**Đơn bán:** mã (tự sinh), ngày bán, khách hàng, danh sách {sản phẩm, số lượng, đơn giá bán}, tổng tiền đơn, tiền đã trả, còn nợ (= tổng − đã trả), trạng thái thanh toán.

**Thu nợ:** ngày thu, khách hàng, số tiền thu, công nợ trước/sau khi thu, ghi chú.

### Trạng thái thanh toán đơn bán

| Trạng thái | Điều kiện | Màu |
|---|---|---|
| Đã thanh toán đủ | Còn nợ = 0 | Xanh lá |
| Còn nợ (một phần) | 0 < Còn nợ < Tổng tiền | Vàng cam |
| Chưa trả | Đã trả = 0 | Đỏ |

### Công thức tính

```
Tổng doanh thu   = Σ(số lượng bán × giá bán sỉ)
Tổng giá vốn     = Σ(số lượng bán × giá vốn nhập)
Lợi nhuận gộp   = Tổng doanh thu − Tổng giá vốn
Tỷ suất LN       = (Lợi nhuận / Doanh thu) × 100%
Công nợ KH       = Tổng tiền đơn hàng − Tiền đã trả
```

### Quy tắc nghiệp vụ quan trọng

- **Tồn kho** chỉ giảm khi đơn bán được **xác nhận**, không giảm khi tạo nháp.
- **Giá vốn** được chốt tại thời điểm nhập hàng, không thay đổi hồi tố.
- **Lợi nhuận** tính theo hàng đã bán thực tế, không tính hàng tồn kho.
- Một đơn bán có thể được **thanh toán nhiều lần** (trả góp nợ nhiều đợt).
- Không cho phép **sửa mã** khách hàng hoặc mã sản phẩm sau khi tạo.
- Chỉ **xoá sản phẩm** khi chưa có giao dịch liên quan.

### Luồng nghiệp vụ tổng thể

```
Nhập hàng → tồn kho tăng, ghi nhận giá vốn
    ↓
Tạo đơn bán → tồn kho giảm, tạo công nợ khách hàng
    ↓
Khách trả tiền (ngay hoặc sau) → cập nhật trạng thái đơn
    ↓
Thu nợ bổ sung → công nợ khách hàng giảm
    ↓
Xem báo cáo định kỳ → doanh thu / lợi nhuận / công nợ tổng hợp
```

## Environment Variables

```
# Không cần biến môi trường — SQLite lưu local tại gốc project (dev) hoặc userData (prod)
```

---

## Tiến độ build (cập nhật 06/05/2026)

### ✅ Đã hoàn thành
| File | Trạng thái |
|---|---|
| `package.json` + `electron.vite.config.mjs` | ✅ |
| `src/main/index.js` | ✅ |
| `src/main/ipc.js` | ✅ |
| `src/main/database/db.js` | ✅ |
| `src/main/database/customers.js` | ✅ |
| `src/main/database/products.js` | ✅ |
| `src/main/database/orders.js` | ✅ |
| `src/main/database/imports.js` | ✅ |
| `src/main/database/collections.js` | ✅ |
| `src/preload/index.js` | ✅ |
| `src/renderer/index.html` | ✅ |
| `src/renderer/src/utils.js` | ✅ |
| `src/renderer/src/api.js` | ✅ |
| `src/renderer/src/styles/global.css` | ✅ |
| `src/renderer/src/components/Sidebar.jsx` | ✅ |
| `src/renderer/src/components/TabNav.jsx` | ✅ |
| `src/renderer/src/pages/Dashboard.jsx` | ✅ |
| `src/renderer/src/pages/DonBan.jsx` | ✅ |
| `src/renderer/src/pages/NhapHang.jsx` | ✅ |
| `src/renderer/src/pages/ThuNo.jsx` | ✅ |
| `src/renderer/src/pages/HangHoa.jsx` | ✅ |
| `src/renderer/src/pages/KhachHang.jsx` | ✅ |

### ✅ Hoàn thành toàn bộ bước 1–5 (07/05/2026)
Tất cả file đã viết xong, dependencies đã cài, app đã chạy được bằng `npm run dev`.

### ✅ Hoàn thành bước 6 — Đóng gói .exe (07/05/2026)
- Cài `electron-builder ^26.8.1`
- Thêm config `"build"` vào `package.json`: target NSIS x64, `asarUnpack` cho `better-sqlite3`
- Script: `npm run pack` → chạy `electron-vite build && electron-builder`
- Output: `dist/Quan Ly Tho Cam Setup 1.0.0.exe` (~81 MB)
- Data test **không** được đóng gói vào app (production dùng `app.getPath('userData')`)
- Update app **không** mất data khách (userData tách biệt với Program Files)

### Lưu ý cài đặt lần đầu
```bash
npm install --ignore-scripts        # bỏ qua build native (không cần Python)
node node_modules/electron/install.js  # download Electron binary
npx @electron/rebuild -f -w better-sqlite3  # rebuild cho Electron
npm run dev                          # chạy app
npm run pack                         # đóng gói → dist/
```

### Data test
File `seed.js` tạo sẵn data mẫu (5 KH, 10 SP, 3 phiếu nhập, 6 đơn bán, 2 thu nợ).
Chạy: `npx electron seed.js` (phải dùng electron thay vì node vì better-sqlite3 compile cho Electron).

### ✅ Cập nhật tính năng (07/05/2026)
- **Real-time sync:** Tạo `DataContext` (`src/renderer/src/contexts/DataContext.jsx`) với `refreshKey` + `triggerRefresh()`. Mọi mutation (tạo đơn, thu tiền, nhập hàng...) gọi `triggerRefresh()` → Sidebar badge nợ và Dashboard tự cập nhật ngay.
- **Chi tiết sản phẩm — Đơn bán:** Click vào dòng đơn hàng → xổ ra bảng sản phẩm (tên, ĐVT, SL, đơn giá, thành tiền). Dùng `orders:getById`, cache kết quả.
- **Chi tiết sản phẩm — Thu nợ:** Click vào dòng khách hàng (tab Đang nợ) → xổ ra các đơn còn nợ kèm sản phẩm. Chọn đơn trong modal thu tiền → hiện sản phẩm ngay bên dưới.
- **Báo cáo:** Bỏ `LIMIT 12`, thêm scroll cho bảng doanh thu theo tháng → hiển thị tất cả tháng.
- **Giá vốn bình quân:** `imports.js` — khi nhập hàng, giá vốn tính lại theo bình quân gia quyền: `(tồn_cũ × giá_cũ + nhập_mới × giá_nhập) / tổng_tồn`. Không đè giá mới lên toàn bộ tồn kho cũ.

### ✅ Hoàn thành toàn bộ bước 1–6
