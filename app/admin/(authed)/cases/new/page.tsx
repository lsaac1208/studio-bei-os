import type { Metadata } from "next";
import Link from "next/link";
import { CaseForm } from "@/components/admin/cases/CaseForm";

export const metadata: Metadata = { title: "新建案例" };

export default function NewCasePage() {
  return (
    <div className="space-y-6">
      <header>
        <nav className="text-[12px] text-mute-soft">
          <Link href="/admin/cases" className="transition hover:text-ink">
            案例
          </Link>
          <span className="mx-1.5">/</span>
          <span>新建</span>
        </nav>
        <h1 className="mt-2 font-serif text-2xl tracking-tight text-ink sm:text-3xl">新建案例</h1>
        <p className="mt-1 text-[13px] text-mute">
          填写完保存后会进入编辑页，可继续完善图集、正文等长内容
        </p>
      </header>
      <CaseForm mode="create" />
    </div>
  );
}
