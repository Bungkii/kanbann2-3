import { getFormsList, getFormById, getCurrentUserRank } from "./actions";
import { getStudentSessionFromCookies } from "@/utils/studentSession";
import { cookies } from "next/headers";
import FormManagementClient from "./FormManagementClient";
import SingleFormResponder from "./SingleFormResponder";
import { Metadata } from "next";

export const revalidate = 0;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}): Promise<Metadata> {
  const { id } = await searchParams;
  if (id) {
    const form = await getFormById(id);
    if (form) {
      return {
        title: `${form.title} | แบบสอบถาม ม.2/3`,
        description: form.description || "แบบสอบถามห้องเรียน ม.2/3 พริมจ๋า",
      };
    }
  }
  return {
    title: "แบบสอบถาม ม.2/3 | พริมจ๋า",
    description: "ระบบแบบสอบถามออนไลน์สำหรับห้องเรียน ม.2/3",
  };
}

export default async function FormPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const cookieStore = await cookies();
  const currentStudent = getStudentSessionFromCookies(cookieStore as any);

  // Mode 1: Answer single form at /form?id=[formId]
  if (id) {
    const form = await getFormById(id);
    if (form) {
      return <SingleFormResponder form={form} currentStudent={currentStudent} />;
    }
  }

  // Mode 2: Forms List & Management Dashboard at /form
  const [forms, currentUser] = await Promise.all([
    getFormsList(),
    getCurrentUserRank(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <FormManagementClient forms={forms} currentUser={currentUser} />
    </main>
  );
}
