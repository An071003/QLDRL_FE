"use client";

import Link from "next/link";
import { Dropdown, Space } from "antd";
import type { MenuProps } from "antd";
import { DownOutlined } from "@ant-design/icons";

const items: MenuProps["items"] = [
  {
    key: "1",
    label: <Link href="/uit/class-leader/profile">Thông tin cá nhân</Link>,
  },
  {
    key: "2",
    label: <Link href="/uit/class-leader/grades">Bảng điểm</Link>,
  },
  {
    key: "3",
    label: <Link href="/uit/class-leader/assignActivities">Đăng kí tham gia hoạt động</Link>,
  },
  {
    key: "4",
    label: <Link href="/uit/class-leader/class">Quản lý lớp</Link>,
  },
  {
    key: "5",
    label: <Link href="/uit/class-leader/activities">Quản lý hoạt động</Link>,
  },
  {
    key: "6",
    label: <Link href="/uit/class-leader/final-score">Bảng Điểm Tổng Kết Sinh Viên</Link>,
  },
];

export default function ClassleaderDropdown() {
  return (
    <Dropdown menu={{ items }} trigger={["click"]}>
      <a onClick={(e) => e.preventDefault()} className="text-white cursor-pointer ml-4">
        <Space>
          LỚP TRƯỞNG
          <DownOutlined />
        </Space>
      </a>
    </Dropdown>
  );
}
