import type { ReactNode } from "react";
import type { TipTapDoc } from "@/db/schema";

/**
 * 把 TipTap StarterKit JSON doc 渲染成 React 树。
 * 支持节点：doc / paragraph / heading(2,3) / bulletList / orderedList /
 *          listItem / blockquote / hardBreak / horizontalRule / text
 * 支持 marks：bold / italic / strike / code
 *
 * 不支持 link / image（编辑器里也禁用），未识别节点会跳过。
 */

interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: { type: string }[];
}

interface Props {
  doc: TipTapDoc | null;
}

export function CaseBodyRenderer({ doc }: Props) {
  if (!doc) return null;
  const nodes = (doc.content as TipTapNode[] | undefined) ?? [];
  return <div className="case-body space-y-3">{nodes.map((n, i) => renderNode(n, i))}</div>;
}

function renderNode(node: TipTapNode, key: number): ReactNode {
  switch (node.type) {
    case "paragraph":
      return (
        <p key={key} className="text-[15px] leading-7 text-ink">
          {(node.content ?? []).map((n, i) => renderInline(n, i))}
        </p>
      );

    case "heading": {
      const level = (node.attrs?.level as number) ?? 2;
      const className =
        level === 2
          ? "mt-6 font-serif text-[20px] tracking-tight text-ink sm:text-[22px]"
          : "mt-5 font-serif text-[16px] text-ink sm:text-[17px]";
      const inner = (node.content ?? []).map((n, i) => renderInline(n, i));
      if (level === 2) {
        return (
          <h2 key={key} className={className}>
            {inner}
          </h2>
        );
      }
      return (
        <h3 key={key} className={className}>
          {inner}
        </h3>
      );
    }

    case "bulletList":
      return (
        <ul
          key={key}
          className="list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-ink marker:text-mute-soft"
        >
          {(node.content ?? []).map((n, i) => renderNode(n, i))}
        </ul>
      );

    case "orderedList":
      return (
        <ol
          key={key}
          className="list-decimal space-y-1.5 pl-5 text-[15px] leading-7 text-ink marker:text-mute-soft"
        >
          {(node.content ?? []).map((n, i) => renderNode(n, i))}
        </ol>
      );

    case "listItem":
      return <li key={key}>{(node.content ?? []).map((n, i) => renderNode(n, i))}</li>;

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="border-ink/30 border-l-2 py-1 pl-4 text-[14px] italic text-mute"
        >
          {(node.content ?? []).map((n, i) => renderNode(n, i))}
        </blockquote>
      );

    case "horizontalRule":
      return <hr key={key} className="my-6 border-hairline" />;

    case "codeBlock":
      return (
        <pre key={key} className="overflow-x-auto rounded-lg bg-ink/4 p-3 text-[13px] text-ink">
          <code>{(node.content ?? []).map((n) => n.text ?? "").join("")}</code>
        </pre>
      );

    default:
      return null;
  }
}

function renderInline(node: TipTapNode, key: number): ReactNode {
  if (node.type === "text") {
    let element: ReactNode = node.text ?? "";
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") element = <strong key={`b-${key}`}>{element}</strong>;
      else if (mark.type === "italic") element = <em key={`i-${key}`}>{element}</em>;
      else if (mark.type === "strike") element = <s key={`s-${key}`}>{element}</s>;
      else if (mark.type === "code")
        element = (
          <code key={`c-${key}`} className="rounded bg-ink/8 px-1 py-0.5 font-mono text-[0.85em]">
            {element}
          </code>
        );
    }
    return <span key={key}>{element}</span>;
  }

  if (node.type === "hardBreak") {
    return <br key={key} />;
  }

  return null;
}
