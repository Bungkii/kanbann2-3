import React from 'react';
import type { Metadata } from 'next';
import ParentManualClient from '../components/ParentManualClient';

export const metadata: Metadata = {
  title: 'คู่มือการใช้งานสำหรับผู้ปกครอง 🌸 | ระบบห้อง ม.2/3',
  description: 'คู่มือแนะนำการใช้งานระบบติดตามการบ้าน ตารางเรียน และสรุปสอบสำหรับผู้ปกครอง ม.2/3',
};

export default function ParentManualPage() {
  return <ParentManualClient />;
}
