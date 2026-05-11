export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-hairline border-t bg-paper px-5 py-8 text-[12px] text-mute sm:px-8 lg:px-14">
      <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <span>
          © {year} Studio Bei · 独立全栈开发者 · 让线索 / 预约 / 订单 / 库存跑在能用的系统上
        </span>
        <span>飞书扫码沟通 · 远程协作 · 大陆 / 港澳台 / 海外均可</span>
      </div>
    </footer>
  );
}
