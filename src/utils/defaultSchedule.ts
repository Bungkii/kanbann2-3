export type ScheduleRow = {
  id?: number | string;
  day_of_week: number;
  period: number;
  subject: string;
  teacher: string | null;
};

export const DEFAULT_CLASS_SCHEDULE: ScheduleRow[] = [
  // วันจันทร์ (Day 1)
  { day_of_week: 1, period: 1, subject: 'คณิตศาสตร์ 3', teacher: 'มิสเสาวลักษณ์' },
  { day_of_week: 1, period: 2, subject: 'CEL', teacher: 'Nicholas, Ollie, Kate' },
  { day_of_week: 1, period: 3, subject: 'วิทยาศาสตร์ 3', teacher: 'ม.ธนากร' },
  { day_of_week: 1, period: 4, subject: 'วิทยาศาสตร์ 3', teacher: 'ม.ธนากร' },
  { day_of_week: 1, period: 5, subject: 'ภาษาอังกฤษ 3', teacher: 'ม.อัคเดช' },
  { day_of_week: 1, period: 6, subject: 'วิทยาการคำนวณ 2', teacher: 'ม.ธนพล' },
  { day_of_week: 1, period: 7, subject: 'วิทยาการคำนวณ 2', teacher: 'ม.ธนพล' },
  { day_of_week: 1, period: 8, subject: 'สอนเสริม', teacher: '-' },

  // วันอังคาร (Day 2)
  { day_of_week: 2, period: 1, subject: 'พื้นฐานดนตรี 3', teacher: 'มิสเนตรชนก' },
  { day_of_week: 2, period: 2, subject: 'คณิตศาสตร์ 3', teacher: 'มิสเสาวลักษณ์' },
  { day_of_week: 2, period: 3, subject: 'ภาษาไทย 3', teacher: 'ม.คมสันต์' },
  { day_of_week: 2, period: 4, subject: 'CEL', teacher: 'Nicholas, Ollie, Kate' },
  { day_of_week: 2, period: 5, subject: 'วิทยาศาสตร์ 3', teacher: 'ม.ธนากร' },
  { day_of_week: 2, period: 6, subject: 'มงฟอร์ตศึกษา 3', teacher: 'มิสจุฑามาศ' },
  { day_of_week: 2, period: 7, subject: 'ทักษะภาษาอังกฤษ', teacher: 'Mr. Joemar' },
  { day_of_week: 2, period: 8, subject: 'สอนเสริม', teacher: '-' },

  // วันพุธ (Day 3)
  { day_of_week: 3, period: 1, subject: 'ทักษะภาษาอังกฤษ', teacher: 'Mr. Marlon' },
  { day_of_week: 3, period: 2, subject: 'CEL', teacher: 'Nicholas, Ollie, Kate' },
  { day_of_week: 3, period: 3, subject: 'สุข-พละ', teacher: 'ม.มาโนช บุญผ่องใส' },
  { day_of_week: 3, period: 4, subject: 'สุข-พละ', teacher: 'ม.มาโนช บุญผ่องใส' },
  { day_of_week: 3, period: 5, subject: 'STEM ACTIVITY 3', teacher: 'มิสภัสสร, มิสรัชนีภรณ์, ม.ธนากร, มิสเสาวลักษณ์' },
  { day_of_week: 3, period: 6, subject: 'STEM ACTIVITY 3', teacher: 'มิสภัสสร, มิสรัชนีภรณ์, ม.ธนากร, มิสเสาวลักษณ์' },
  { day_of_week: 3, period: 7, subject: 'STEM ACTIVITY 3', teacher: 'มิสภัสสร, มิสรัชนีภรณ์, ม.ธนากร, มิสเสาวลักษณ์' },
  { day_of_week: 3, period: 8, subject: 'สอนเสริม', teacher: '-' },

  // วันพฤหัสบดี (Day 4)
  { day_of_week: 4, period: 1, subject: 'ภาษาอังกฤษ 3', teacher: 'ม.อัคเดช' },
  { day_of_week: 4, period: 2, subject: 'ศิลปพื้นฐาน 3', teacher: 'ม.ปณวัชร' },
  { day_of_week: 4, period: 3, subject: 'ทักษะการปฏิบัติดนตรี 2', teacher: 'ม.ปริญญา/ม.วรรษรักษ์' },
  { day_of_week: 4, period: 4, subject: 'ภาษาไทย 3', teacher: 'ม.คมสันต์' },
  { day_of_week: 4, period: 5, subject: 'CEL', teacher: 'Nicholas, Ollie, Kate' },
  { day_of_week: 4, period: 6, subject: 'ลูกเสือ', teacher: '-' },
  { day_of_week: 4, period: 7, subject: 'ชมรม', teacher: '-' },
  { day_of_week: 4, period: 8, subject: 'สอนเสริม', teacher: '-' },

  // วันศุกร์ (Day 5)
  { day_of_week: 5, period: 1, subject: 'สังคมศึกษา 3', teacher: 'มิสธนวรรณ' },
  { day_of_week: 5, period: 2, subject: 'CEL', teacher: 'Nicholas, Ollie, Kate' },
  { day_of_week: 5, period: 3, subject: 'ภาษาไทย 3', teacher: 'ม.คมสันต์' },
  { day_of_week: 5, period: 4, subject: 'คณิตศาสตร์ 3', teacher: 'มิสเสาวลักษณ์' },
  { day_of_week: 5, period: 5, subject: 'ภาษาอังกฤษ 3', teacher: 'ม.อัคเดช' },
  { day_of_week: 5, period: 6, subject: 'สังคมศึกษา 3', teacher: 'มิสธนวรรณ' },
  { day_of_week: 5, period: 7, subject: 'การงานอาชีพ 3', teacher: 'มิสรุ่งนภา' },
  { day_of_week: 5, period: 8, subject: 'ประวัติศาสตร์ 3', teacher: 'ม.เตชพัฒน์' },
];

export type CleaningScheduleRow = {
  id?: string;
  day_of_week: number;
  day_name: string;
  cleaners: string;
};

export const DEFAULT_CLEANING_SCHEDULE: CleaningScheduleRow[] = [
  { day_of_week: 1, day_name: 'วันจันทร์', cleaners: '-' },
  { day_of_week: 2, day_name: 'วันอังคาร', cleaners: '-' },
  { day_of_week: 3, day_name: 'วันพุธ', cleaners: '-' },
  { day_of_week: 4, day_name: 'วันพฤหัสบดี', cleaners: '-' },
  { day_of_week: 5, day_name: 'วันศุกร์', cleaners: '-' },
];

export type UniformScheduleRow = {
  id?: string;
  day_of_week: number;
  day_name: string;
  uniform_name: string;
  theme_color?: string;
};

export const DEFAULT_UNIFORM_SCHEDULE: UniformScheduleRow[] = [
  { day_of_week: 1, day_name: 'วันจันทร์', uniform_name: 'ชุดนักเรียน', theme_color: '#1E3A8A' },
  { day_of_week: 2, day_name: 'วันอังคาร', uniform_name: 'ชุดนักเรียน', theme_color: '#1E3A8A' },
  { day_of_week: 3, day_name: 'วันพุธ', uniform_name: 'ชุดพละและเสื้อช้อป', theme_color: '#15803D' },
  { day_of_week: 4, day_name: 'วันพฤหัสบดี', uniform_name: 'ชุดนักเรียน', theme_color: '#1E3A8A' },
  { day_of_week: 5, day_name: 'วันศุกร์', uniform_name: 'ชุดนักเรียน', theme_color: '#1E3A8A' },
];
