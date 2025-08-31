# QLDRL – Hệ thống Quản Lý Điểm Rèn Luyện (Frontend)

> **Tech stack**: Next.js (App Router) • TypeScript • TailwindCSS • JWT Auth (tích hợp backend Express) • Axios/Fetch • Zustand/Context • Vercel (deploy)

**Production**: [https://qldrl-gtohy46g2-asad-cad80cb6.vercel.app/](https://qldrl-gtohy46g2-asad-cad80cb6.vercel.app/)

Hệ thống hỗ trợ quản lý điểm rèn luyện theo cấu trúc **Tiêu chí → Phong trào → Hoạt động**, cho phép sinh viên đăng ký tham gia, cán bộ quản lý hoạt động và tính điểm, cùng báo cáo thống kê theo khoa/khóa/lớp.

---

## 📦 Mục lục

* [Tính năng](#-tính-năng)
* [Kiến trúc tổng quan](#-kiến-trúc-tổng-quan)
* [Bắt đầu nhanh](#-bắt-đầu-nhanh)
* [Cấu hình môi trường](#-cấu-hình-môi-trường)
* [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
* [Scripts](#-scripts)
* [Luồng nghiệp vụ](#-luồng-nghiệp-vụ)
* [Chuẩn code & CI](#-chuẩn-code--ci)
* [Triển khai](#-triển-khai)
* [Đóng góp & Quy ước nhánh (2 thành viên)](#-đóng-góp--quy-ước-nhánh-2-thành-viên)
* [Tác giả](#-tác-giả)
* [Giấy phép](#-giấy-phép)

---

## ✅ Tính năng

* Quản lý **Tiêu chí / Phong trào / Hoạt động** với giới hạn điểm theo tiêu chí.
* **Đăng ký hoạt động** (sinh viên), duyệt tham gia, đánh dấu **participated**.
* **Tính điểm tự động** khi tham gia/hoạt động hết hạn; phân loại xếp hạng.
* Phân quyền **admin / lecturer / student / class representative**.
* **Import Excel** danh sách sinh viên; tạo user tự động (qua backend).
* Xem **bảng điểm cá nhân**, **thống kê** theo khoa/khóa/lớp/kỳ.
* **Đăng nhập** JWT, bảo vệ route theo vai trò, refresh token (qua backend).
* **Email nền** (Bull queue, trên backend) khi tạo tài khoản.

> Lưu ý: Repository này là **Frontend** (Next.js). Phần **Backend**: Node.js + Express + MySQL + Sequelize, có JWT, phân quyền, trigger/procedure tính điểm.

---

## 🧭 Kiến trúc tổng quan

```
[Next.js App Router (Frontend)]  → gọi API →  [Express + JWT + Sequelize (Backend)]  →  [MySQL]
                                                                  ↳ Bull queue (gửi email)
```

* Frontend chịu trách nhiệm UI/UX, phân quyền hiển thị, form đăng ký, import, bảng điểm.
* Backend cung cấp API xác thực, CRUD tiêu chí/phong trào/hoạt động, tính điểm, thống kê.

---

## 🚀 Bắt đầu nhanh

Yêu cầu: Node.js ≥ 18, pnpm/yarn/npm, và quyền truy cập API backend.

```bash
# Cài dependency
pnpm install
# hoặc
yarn
# hoặc
npm install

# Chạy dev server
pnpm dev
# hoặc
yarn dev
# hoặc
npm run dev

# Mở http://localhost:3000
```

> Bạn có thể bắt đầu chỉnh sửa tại `app/page.tsx`. Trang sẽ tự reload khi lưu file.

---

## 🔐 Cấu hình môi trường

Tạo file `.env.local` trong thư mục gốc frontend:

```env
# URL backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api

# Auth (nếu dùng cookie)
NEXT_PUBLIC_AUTH_COOKIE_NAME=ql-drl-token

# Tùy chọn khác
NEXT_PUBLIC_APP_NAME=QLDRL
NEXT_PUBLIC_BUILD_ENV=local
```

> Backend cần các biến riêng (MySQL, JWT\_SECRET, SMTP, Bull/Redis...). Xem README của backend.

---

## 🗂 Cấu trúc thư mục

```
.
├─ app/                    # App Router pages, layout, route groups
│  ├─ (public)/            # routes public (login, register,…)
│  ├─ (protected)/         # routes yêu cầu đăng nhập
│  ├─ dashboard/           # trang tổng quan theo vai trò
│  ├─ activities/          # danh sách/chi tiết hoạt động
│  ├─ criteria/ campaigns/ # quản trị tiêu chí/phong trào
│  ├─ students/            # quản trị sinh viên, import Excel
│  ├─ api/                 # route handlers (nếu dùng)
│  └─ page.tsx / layout.tsx
├─ components/             # UI components (form, table, modal, charts)
├─ hooks/                  # hooks (useAuth, useRoleGuard,…)
├─ lib/                    # axios client, fetcher, helpers
├─ store/                  # Zustand/Context state
├─ types/                  # TypeScript types/interfaces
├─ public/                 # static assets
├─ styles/                 # globals.css, tailwind.css
└─ README.md
```

---

## 🧰 Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

* `dev`: chạy máy chủ phát triển.
* `build`: build production.
* `start`: chạy production local.
* `lint`: ESLint theo cấu hình Next.js.
* `type-check`: kiểm tra kiểu TypeScript.

---

## 🔄 Luồng nghiệp vụ

1. **Admin/Lecturer** tạo *Tiêu chí* (max\_score) → *Phong trào* → *Hoạt động* (thời hạn, điểm).
2. **Sinh viên** đăng nhập → đăng ký hoạt động → tham gia.
3. Khi **participated** thay đổi hoặc **hoạt động hết hạn**, hệ thống **tính điểm** (proc/triggers backend), đảm bảo điểm từng campaign **không vượt max của tiêu chí**.
4. **Xem bảng điểm** và **xếp loại** theo kỳ, **thống kê** theo khoa/khóa/lớp.

---

## 🧪 Chuẩn code & CI

* **Coding style**: TypeScript strict, module boundaries rõ ràng, async/await.
* **UI/UX**: Tailwind, shadcn/ui (khuyến nghị), responsive, accessible.
* **State**: tránh prop drilling; ưu tiên hooks + Zustand/Context.
* **API**: axios instance kèm interceptors (token, refresh nếu có).
* **Testing (tùy chọn)**: Vitest/RTL cho component/hook quan trọng.
* **CI (tùy chọn)**: lint + type-check trên pull request.

---

## 🚢 Triển khai

* **Vercel**: kết nối repo → cấu hình biến môi trường `NEXT_PUBLIC_API_BASE_URL` trỏ về backend public.
* Kiểm tra `robots.txt`, `sitemap`, headers bảo mật (tùy chọn).
* Bật `Image Optimization` nếu cần.

**Production hiện tại**: [https://qldrl-gtohy46g2-asad-cad80cb6.vercel.app/](https://qldrl-gtohy46g2-asad-cad80cb6.vercel.app/)

---

## 🤝 Đóng góp & Quy ước nhánh (2 thành viên)

**Thành viên**

| Vai trò | Họ tên                  | Email        | Ghi chú                 |
| ------- | ----------------------- | ------------ | ----------------------- |
| Lead/FE | **Hồ Vũ An**            | *(cập nhật)* | Điều phối, kiến trúc FE |
| BE/FE   | **(Tên thành viên #2)** | *(cập nhật)* | Backend & tích hợp      |

**Quy ước Git**

* Nhánh chính: `main` (production), `develop` (tích hợp).
* Nhánh tính năng: `feat/<module>`; sửa lỗi: `fix/<issue>`; tài liệu/ops: `chore/docs`, `chore/ci`.
* Commit message (Conventional): `feat: ...`, `fix: ...`, `refactor: ...`, `docs: ...`.
* Pull Request: mô tả rõ **mục tiêu**, **ảnh chụp UI (nếu có)**, **cách test**.

**Quy trình**

1. Tạo issue → tạo branch → code + test cục bộ.
2. `lint` + `type-check` pass → mở PR vào `develop`.
3. Review 1 thành viên còn lại → squash & merge.
4. Khi ổn định, tạo release và merge `develop` → `main` để deploy.

---

## 👤 Tác giả

* **Hồ Vũ An** – FE Lead (Next.js)
* **(Tên thành viên #2)** – BE/FE

> *Vui lòng cập nhật thông tin liên hệ (email/phone) trong bảng Thành viên.*

---

## 📄 Giấy phép

Phát hành theo **MIT License**. Bạn được phép sử dụng, sao chép, sửa đổi với điều kiện giữ lại thông tin bản quyền và giấy phép trong các bản phân phối.

---

## 🆘 Hỗ trợ & Góp ý

* Tạo issue trên repository.
* Hoặc liên hệ các thành viên dự án.

> Cảm ơn bạn đã sử dụng hệ thống **QLDRL**! 🎓
