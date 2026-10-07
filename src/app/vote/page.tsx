import { Metadata } from 'next';
import VoteClient from './VoteClient';

export const metadata: Metadata = {
  title: 'ระบบลงมติและแสดงตน | พริมจ๋า ม.2/3',
  description: 'ระบบลงคะแนนเสียง ตรวจสอบองค์ประชุม และอภิปราย สภาห้องเรียน ม.2/3',
};

export default function VotePage() {
  return <VoteClient />;
}
