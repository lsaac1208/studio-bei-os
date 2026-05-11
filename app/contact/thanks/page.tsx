import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "已收到你的需求",
  description: "我会尽快回复。",
};

type Props = {
  searchParams: Promise<{ code?: string }>;
};

export default async function ContactThanksPage({ searchParams }: Props) {
  const { code } = await searchParams;
  const cfg = await getSettings(["contact.promiseHours", "contact.publicEmail"]);
  const promiseHoursRaw = cfg["contact.promiseHours"];
  const promiseHours =
    promiseHoursRaw && /^\d+$/.test(promiseHoursRaw) ? Number(promiseHoursRaw) : null;
  const replyTiming =
    promiseHours === null
      ? "1 个工作日内"
      : promiseHours <= 24
        ? `${promiseHours} 小时内`
        : `${Math.ceil(promiseHours / 24)} 个工作日内`;
  const publicEmail = cfg["contact.publicEmail"] || "hello@studiobei.dev";

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5 py-12 sm:px-8">
        <header className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-[12px] text-mute uppercase tracking-[0.14em] transition-colors hover:text-ink"
          >
            ← Studio Bei
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-center">
          <span className="font-mono text-[11px] text-studio-1 uppercase tracking-[0.14em]">
            已收到 / Received
          </span>

          <h1 className="mt-4 mb-6 font-bold text-[clamp(40px,7vw,72px)] leading-[1] tracking-[-0.04em]">
            收到了，
            <br />
            <em className="font-serif font-semibold text-studio-1 italic">谢谢你写下来。</em>
          </h1>

          <p className="mb-3 max-w-[520px] text-[16px] text-ink-soft leading-[1.75]">
            通常我会在 <strong className="text-ink">{replyTiming}</strong>{" "}
            回复你。回复时会基于你写的流程和卡点，先判断要不要先做一个最小可用版本，再约一次远程对话。
          </p>
          <p className="mb-10 max-w-[520px] text-[16px] text-ink-soft leading-[1.75]">
            如果暂时没收到回复，可能是你留的联系方式没拼对。可以直接发邮件到{" "}
            <a
              href={`mailto:${publicEmail}`}
              className="border-ink border-b font-medium text-ink hover:text-studio-1 hover:border-studio-1"
            >
              {publicEmail}
            </a>{" "}
            把这个编号发给我。
          </p>

          {code && code !== "SB-IGNORE" ? (
            <div className="mb-10 rounded-2xl border border-hairline bg-white/50 p-5">
              <small className="block font-semibold text-[10px] text-mute uppercase tracking-[0.14em]">
                需求编号
              </small>
              <strong className="mt-1.5 block font-mono font-bold text-2xl tracking-tight">
                {code}
              </strong>
              <span className="mt-2 block text-[12px] text-mute">
                复制保存即可，后续沟通和报价单都会带上这个编号。
              </span>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-semibold text-[14px] text-paper transition-all hover:-translate-y-px hover:bg-studio-1"
            >
              <span>返回首页</span>
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/#case-01"
              className="inline-flex items-center gap-2 rounded-full border border-hairline-strong px-5 py-3 font-semibold text-[14px] text-ink transition-colors hover:bg-paper-soft"
            >
              再看看三个案例
            </Link>
          </div>
        </main>

        <footer className="mt-12 border-hairline border-t pt-6 text-[12px] text-mute">
          © Studio Bei · 独立全栈开发者 · 让线索 / 预约 / 订单 / 库存跑在能用的系统上
        </footer>
      </div>
    </div>
  );
}
