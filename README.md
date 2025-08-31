# QLDRL – Hệ thống Quản Lý Điểm Rèn Luyện (Frontend)

> **Tech stack**: Next.js (App Router) • TypeScript • TailwindCSS • JWT Auth (tích hợp backend Express) • Axios/Fetch • Zustand/Context • Azure (deploy)

**Production**: [https://qldrl-gtohy46g2-asad-cad80cb6.vercel.app/](https://qldrl-gtohy46g2-asad-cad80cb6.vercel.app/)

Hệ thống hỗ trợ quản lý điểm rèn luyện theo cấu trúc **Tiêu chí → Phong trào → Hoạt động**, cho phép sinh viên đăng ký tham gia, cán bộ quản lý hoạt động và tính điểm, cùng báo cáo thống kê theo khoa/khóa/lớp.

---

## 📦 Mục lục

* [Tính năng](#-tính-năng)
* [Kiến trúc tổng quan](#-kiến-trúc-tổng-quan)
* [Bắt đầu nhanh](#-bắt-đầu-nhanh)
* [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
* [Luồng nghiệp vụ](#-luồng-nghiệp-vụ)
* [Triển khai](#-triển-khai)
* [Đóng góp & (2 thành viên)](#-đóng-góp-2-thành-viên)
* [Tác giả](#-tác-giả)

---

## ✅ Tính năng

* Quản lý **Tiêu chí / Phong trào / Hoạt động** với giới hạn điểm theo tiêu chí.
* **Đăng ký hoạt động** sinh viên tự đăng ký, hoặc được các vai trò khác đăng ký, sinh viên được duyệt tham gia.
* **Tính điểm tự động** khi tham gia/hoạt động hết hạn; phân loại xếp hạng.
* Phân quyền **admin / advisor / department-officers/ student / class-leader**.
* **Import Excel** danh sách sinh viên.
* Xem **bảng điểm cá nhân**, **thống kê** theo khoa/khóa/lớp/kỳ.
* **Đăng nhập** JWT, bảo vệ route theo vai trò.
* **Đổi mật khẩu** đổi mật khẩu bằng mã gửi qua email.

> Lưu ý: Repository này là **Frontend** (Next.js). Phần **Backend**: Node.js + Express + MySQL + Sequelize, có JWT, phân quyền, trigger/procedure tính điểm.

---

## 🧭 Kiến trúc tổng quan

```
[Next.js App Router (Frontend)]  → gọi API →  [Express + JWT + Sequelize (Backend)]  →  [MySQL]

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
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_APP_NAME=QLDRL
NEXT_PUBLIC_BUILD_ENV=local
```

> Backend cần các biến riêng (MySQL, JWT\_SECRET). Xem README của backend.

---


## 🔄 Luồng nghiệp vụ

1. **Admin/advisor/department-officers** tạo *Tiêu chí* (max\_score) → *Phong trào* → *Hoạt động* (thời hạn, điểm).
2. **Sinh viên** đăng nhập → đăng ký hoạt động → tham gia.
3. **Admin/advisor/department-officers/class-leader** đánh dấu tham gia hoạt động cho sinh viên.
4. Khi **participated** thay đổi hoặc **hoạt động hết hạn**, hệ thống **tính điểm** (proc/triggers backend), đảm bảo điểm từng campaign **không vượt max của tiêu chí**.
5. **Xem bảng điểm** và **xếp loại** theo kỳ, **thống kê** theo khoa/khóa/lớp.

---

## 🧪 Chuẩn code & CI

* **Coding style**: TypeScript strict, module boundaries rõ ràng, async/await.
* **UI/UX**: Tailwind, shadcn/ui (khuyến nghị), responsive, accessible.
* **State**: tránh prop drilling; ưu tiên hooks + Zustand/Context.
* **API**: axios instance .
* **CI (tùy chọn)**: lint + type-check trên pull request.

---

## 🚢 Triển khai

* **Azure**: kết nối repo → cấu hình biến môi trường `NEXT_PUBLIC_API_BASE_URL` trỏ về backend public.

**Production hiện tại**: [https://qldrl-gtohy46g2-asad-cad80cb6.vercel.app/](https://qldrl-gtohy46g2-asad-cad80cb6.vercel.app/)

---

## 🤝 Đóng góp (2 thành viên)

**Thành viên**

| Vai trò | Họ tên                  | Email                  | Ghi chú                   |
| ------- | ----------------------- | ---------------------- | ------------------------- |
| Lead/FE | **Hồ Vũ An**            | 21521804@gm.uit.edu.vn | Backend, Frontend & deloy |
| BE/FE   | **Dương Uy Quan**       | 21521323@gm.uit.edu.vn | Backend & Frontend & Test |


**Quy trình**

1. Tạo issue → tạo branch → code + test cục bộ.
2. `lint` + `type-check` pass → mở PR vào `develop`.
3. Review 1 thành viên còn lại → squash & merge.
4. Khi ổn định, tạo release và merge `develop` → `main` để deploy.

---

## 👤 Tác giả

* **Hồ Vũ An** – FE Lead (Next.js), BE Lead(Nodejs - Express)
* **Dương Uy Quan** – FE Lead (Next.js), BE Lead(Nodejs - Express)

---


> Cảm ơn bạn đã sử dụng hệ thống **QLDRL**! 🎓
