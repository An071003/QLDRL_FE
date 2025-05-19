"use client";

import Link from "next/link";
import { Dropdown, Space } from "antd";
import type { MenuProps } from "antd";
import { DownOutlined } from "@ant-design/icons";

const items: MenuProps["items"] = [
  {
    key: "1",
    label: <Link href="/uit/classleader/profile">Thông tin cá nhân</Link>,
  },
  {
    key: "2",
    label: <Link href="/uit/classleader/grades">Bảng điểm</Link>,
  },
  {
    key: "3",
    label: <Link href="/uit/classleader/assignActivities">Đăng kí tham gia hoạt động</Link>,
  },
  {
    key: "4",
    label: <Link href="/uit/classleader/classManagement">Quản lý lớp</Link>,
  },
  {
    key: "5",
    label: <Link href="/uit/classleader/committee">Ban chấp hành</Link>,
  },
  {
    key: "6",
    label: <Link href="/uit/classleader/youth-info">Thông tin CS Đoàn</Link>,
  },
  {
    key: "7",
    label: <Link href="/uit/classleader/final-score">Bảng Điểm Tổng Kết Sinh Viên</Link>,
  },
];

export default function ClassLeaderDropdown() {
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
