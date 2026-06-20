import Link from 'next/link'
import { signup } from '../login/actions'
import SubmitButton from '@/components/SubmitButton'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SignupPage(props: Props) {
  const searchParams = await props.searchParams;
  const message = searchParams?.message as string | undefined;

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto pt-20">
      <Link
        href="/"
        className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-slate-700 bg-slate-200 hover:bg-slate-300 flex items-center group text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>{" "}
        Back
      </Link>

      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-slate-700" action={signup}>
        <h1 className="text-3xl font-bold mb-6 text-center text-slate-800">สร้างบัญชีผู้ใช้</h1>
        <label className="text-sm font-semibold mb-1" htmlFor="email">
          อีเมล (Email)
        </label>
        <input
          className="rounded-xl px-4 py-2.5 bg-white border border-slate-300 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
          name="email"
          placeholder="you@example.com"
          required
        />
        <label className="text-sm font-semibold mb-1" htmlFor="password">
          รหัสผ่าน (Password)
        </label>
        <input
          className="rounded-xl px-4 py-2.5 bg-white border border-slate-300 mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        <SubmitButton pendingText="กำลังสร้างบัญชี...">สร้างบัญชี (Sign Up)</SubmitButton>
        {message && (
          <p className="mt-4 p-4 bg-red-100 text-red-900 text-center rounded-md">
            {message}
          </p>
        )}
        <p className="text-sm text-center mt-6 text-slate-600">
          มีบัญชีอยู่แล้วใช่ไหม? <Link href="/login" className="underline hover:text-indigo-600 font-semibold transition-colors">เข้าสู่ระบบเลย</Link>
        </p>
      </form>
    </div>
  )
}
