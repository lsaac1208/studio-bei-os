import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings/SettingsForm";
import { getSettings } from "@/lib/settings";
import { BITABLE_FIELDS, CONTACT_FIELDS, NOTIFY_FIELDS, SETTING_KEYS } from "@/lib/settings-keys";

export const metadata: Metadata = { title: "站点设置" };

export default async function AdminSettingsPage() {
  const current = await getSettings(SETTING_KEYS);

  const contactInitial = Object.fromEntries(
    CONTACT_FIELDS.map((f) => [f.key, current[f.key] ?? ""]),
  );
  const notifyInitial = Object.fromEntries(NOTIFY_FIELDS.map((f) => [f.key, current[f.key] ?? ""]));
  const bitableInitial = Object.fromEntries(
    BITABLE_FIELDS.map((f) => [f.key, current[f.key] ?? ""]),
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-2xl tracking-tight text-ink sm:text-3xl">站点设置</h1>
        <p className="mt-1 text-[13px] text-mute">
          联系方式 / 飞书通知配置。所有改动立即生效，无需重启服务。
        </p>
      </header>

      <SettingsForm
        title="联系方式"
        description="展示在官网页脚与感谢页；所有字段均可留空。"
        fields={CONTACT_FIELDS}
        initial={contactInitial}
      />

      <SettingsForm
        title="飞书通知"
        description="新线索推送到飞书群或个人。通道 A（Webhook）配置简单但无回调，通道 B（企业自建）按钮可回调写库。详见 docs/feishu-setup.md。"
        fields={NOTIFY_FIELDS}
        initial={notifyInitial}
      />

      <SettingsForm
        title="飞书多维表格双向同步"
        description="填入 app_token / table_id 后，新线索会自动同步到指定表格；管理员在表格上修改「状态 / 优先级」也会回流到本系统。需先在飞书自建应用中开通 bitable 权限并把表格授权给该应用。"
        fields={BITABLE_FIELDS}
        initial={bitableInitial}
      />
    </div>
  );
}
