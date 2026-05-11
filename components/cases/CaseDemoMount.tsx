import { CaseHengyue } from "@/components/cases/hengyue/CaseHengyue";
import { CaseMailab } from "@/components/cases/mailab/CaseMailab";
import { CaseQiguang } from "@/components/cases/qiguang/CaseQiguang";
import { isCaseDemoKey } from "@/lib/case-options";

interface Props {
  demoKey: string | null;
}

/**
 * 按 key 渲染对应的 Demo 组件。
 * 这是 server component，但它内部使用的 case 组件本身是 client；Next 会自动处理 client 边界。
 */
export function CaseDemoMount({ demoKey }: Props) {
  if (!demoKey || !isCaseDemoKey(demoKey)) return null;

  switch (demoKey) {
    case "qiguang":
      return <CaseQiguang />;
    case "mailab":
      return <CaseMailab />;
    case "hengyue":
      return <CaseHengyue />;
    default:
      return null;
  }
}
