import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-serif text-3xl">页面走丢了</h1>
      <p className="text-muted-foreground">这里没有你想找的内容。</p>
      <Link
        href="/"
        className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-accent"
      >
        回到首页
      </Link>
    </main>
  );
}
