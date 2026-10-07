import { useState } from "react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

// Format date into DD/MM/YYYY converting BE to CE if needed
export function normalizeDateInput(val: any): string {
  if (!val) return "";
  if (val instanceof Date) {
    const d = String(val.getDate()).padStart(2, "0");
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const y = val.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const str = String(val).trim();
  // Regex for D/M/Y or DD/MM/YYYY with / or -
  const match = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (match) {
    const d = match[1].padStart(2, "0");
    const m = match[2].padStart(2, "0");
    let y = parseInt(match[3], 10);
    // If Buddhist Era (e.g. 2568, 2569) convert to CE
    if (y > 2400) {
      y = y - 543;
    } else if (y < 100) {
      y = 2000 + y;
    }
    return `${d}/${m}/${y}`;
  }
  return str;
}

// Convert user label in excel to standard Google Form question type
export function mapExcelTypeToStandard(rawType: string): string {
  const t = String(rawType || "").toLowerCase().trim();
  if (t.includes("short") || t.includes("สั้น")) return "short_answer";
  if (t.includes("para") || t.includes("ยาว") || t.includes("ย่อหน้า")) return "paragraph";
  if (t.includes("multi") || t.includes("choice") || t.includes("ปรนัย") || t.includes("กา")) return "multiple_choice";
  if (t.includes("check") || t.includes("กล่อง") || t.includes("หลายข้อ")) return "checkboxes";
  if (t.includes("drop") || t.includes("เลื่อน")) return "dropdown";
  if (t.includes("file") || t.includes("ไฟล์")) return "file_upload";
  if (t.includes("scale") || t.includes("เชิงเส้น")) return "linear_scale";
  if (t.includes("rate") || t.includes("ดาว") || t.includes("คะแนน")) return "rating";
  if (t.includes("date") || t.includes("วัน")) return "date";
  if (t.includes("time") || t.includes("เวลา")) return "time";
  if (t.includes("multi") && t.includes("grid")) return "multiple_choice_grid";
  if (t.includes("check") && t.includes("grid")) return "checkbox_grid";
  return "short_answer";
}

export interface ParsedExcelForm {
  title: string;
  description: string;
  maxPoints: number | null;
  questions: any[];
}

export async function parseExcelOrCsvForm(file: File): Promise<ParsedExcelForm> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // A1: Form title:, B1: Title Value, C1: Max points:, D1: Max Points Value
  const rawTitle = worksheet["B1"]?.v || worksheet["A1"]?.v || "";
  let title = String(rawTitle).replace(/^Form title:\s*/i, "").trim();
  if (!title || title.toLowerCase() === "form title:") {
    // fallback if user put title in B1 or somewhere near
    title = worksheet["B1"]?.v ? String(worksheet["B1"].v).trim() : "แบบสอบถาม";
  }

  // A2: Form description:, B2: Description Value
  const rawDesc = worksheet["B2"]?.v || worksheet["A2"]?.v || "";
  let description = String(rawDesc).replace(/^Form description:\s*/i, "").trim();
  if (description.toLowerCase() === "form description:") {
    description = "";
  }

  // Max points from D1 or C1
  let maxPoints: number | null = null;
  const rawPoints = worksheet["D1"]?.v || worksheet["C1"]?.v;
  if (rawPoints !== undefined && rawPoints !== null && !isNaN(Number(rawPoints))) {
    maxPoints = Number(rawPoints);
  }

  // Read questions starting from Row 4 (A4)
  // Headers are in Row 3: Question # (A), Type (B), Question Text (C), Answer 1 (D), Answer 2 (E), Answer 3 (F), Answer 4 (G), Correct (H), Points (I)
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:I50");
  const questions: any[] = [];

  for (let r = 3; r <= range.e.r; r++) { // 0-indexed: row 3 is Row 4
    const cellQNo = worksheet[XLSX.utils.encode_cell({ r, c: 0 })]?.v;
    const cellType = worksheet[XLSX.utils.encode_cell({ r, c: 1 })]?.v;
    const cellText = worksheet[XLSX.utils.encode_cell({ r, c: 2 })]?.v;

    // Stop if row is completely empty
    if (cellQNo === undefined && cellType === undefined && cellText === undefined) {
      continue;
    }

    const qText = cellText ? String(cellText).trim() : `คำถามข้อที่ ${questions.length + 1}`;
    const standardType = mapExcelTypeToStandard(cellType ? String(cellType) : "short_answer");

    // Answers 1..4 (Columns D..G -> c: 3..6)
    const options: string[] = [];
    for (let c = 3; c <= 6; c++) {
      const optVal = worksheet[XLSX.utils.encode_cell({ r, c })]?.v;
      if (optVal !== undefined && optVal !== null && String(optVal).trim() !== "") {
        options.push(String(optVal).trim());
      }
    }

    // Correct Answer (Column H -> c: 7)
    let correctRaw = worksheet[XLSX.utils.encode_cell({ r, c: 7 })]?.v;
    let correctAnswer = "";
    if (correctRaw !== undefined && correctRaw !== null) {
      if (standardType === "date") {
        correctAnswer = normalizeDateInput(correctRaw);
      } else {
        correctAnswer = String(correctRaw).trim();
      }
    }

    // Points (Column I -> c: 8)
    const pointsRaw = worksheet[XLSX.utils.encode_cell({ r, c: 8 })]?.v;
    let points = 0;
    if (pointsRaw !== undefined && pointsRaw !== null && !isNaN(Number(pointsRaw))) {
      points = Number(pointsRaw);
    }

    questions.push({
      id: `q_${Date.now()}_${questions.length + 1}`,
      title: qText,
      type: standardType,
      options: (standardType === "multiple_choice" || standardType === "checkboxes" || standardType === "dropdown") && options.length === 0
        ? ["ตัวเลือกที่ 1", "ตัวเลือกที่ 2"]
        : options,
      correct_answer: correctAnswer,
      points: points,
      required: false,
    });
  }

  return {
    title: title || file.name.replace(/\.[^/.]+$/, ""),
    description: description || "",
    maxPoints,
    questions,
  };
}
