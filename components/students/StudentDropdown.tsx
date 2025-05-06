"use client";

import Link from "next/link";
import { Dropdown, Space } from "antd";
import type { MenuProps } from "antd";
import { DownOutlined } from "@ant-design/icons";

const items: MenuProps["items"] = [
  {
    key: "1",
    label: <Link href="/student/profile">Thông tin cá nhân</Link>,
  },
  {
    key: "2",
    label: <Link href="/student/grades">Bảng điểm</Link>,
  },
  {
    key: "3",
    label: <Link href="/uit/student/assignActivities">Đăng kí tham gia hoạt động</Link>,
  },
  {
    key: "4",
    label: <Link href="/student/committee">Ban chấp hành</Link>,
  },
  {
    key: "5",
    label: <Link href="/student/youth-info">Thông tin CS Đoàn</Link>,
  },
  {
    key: "6",
    label: <Link href="/student/final-score">Bảng Điểm Tổng Kết Sinh Viên</Link>,
  },
];

export default function StudentDropdown() {
  return (
    <Dropdown menu={{ items }} trigger={["click"]}>
      <a onClick={(e) => e.preventDefault()} className="text-white cursor-pointer ml-4">
        <Space>
          SINH VIÊN
          <DownOutlined />
        </Space>
      </a>
    </Dropdown>
  );
}
