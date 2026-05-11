"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import type { TipTapDoc } from "@/db/schema";

interface Props {
  value: TipTapDoc | null;
  onChange: (next: TipTapDoc | null) => void;
}

/**
 * 案例正文编辑器：基于 TipTap StarterKit。
 *  - 工具栏：bold / italic / H2 / H3 / 列表 / 有序列表 / 引用
 *  - 不含图片：图集走 GalleryManager，正文专心写文字结构
 *  - 不含链接：v1 简化版；以后需要可加 @tiptap/extension-link
 */
export function BodyEditor({ value, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // 让 H1 不可用，案例标题已是 H1
        heading: { levels: [2, 3] },
      }),
    ],
    // biome-ignore lint/suspicious/noExplicitAny: TipTap JSONContent 的 content 项是递归类型，我们用宽松 unknown 存储；运行时由 TipTap 自校验
    content: (value ?? { type: "doc", content: [{ type: "paragraph" }] }) as any,
    editorProps: {
      attributes: {
        class:
          "min-h-[240px] max-w-none rounded-b-xl border-hairline border-t-0 border bg-white/70 px-4 py-3 text-[14px] leading-relaxed text-ink outline-none [&_h2]:mt-4 [&_h2]:font-serif [&_h2]:text-[18px] [&_h3]:mt-3 [&_h3]:font-serif [&_h3]:text-[15px] [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-ink/30 [&_blockquote]:pl-3 [&_blockquote]:text-mute",
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON() as TipTapDoc;
      // 全空文档 → 存 null
      const isEmpty =
        !json.content ||
        json.content.length === 0 ||
        (json.content.length === 1 &&
          (json.content[0] as { type?: string; content?: unknown })?.type === "paragraph" &&
          !(json.content[0] as { content?: unknown[] })?.content?.length);
      onChange(isEmpty ? null : json);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getJSON();
    if (JSON.stringify(current) === JSON.stringify(value)) return;
    const next = value ?? { type: "doc", content: [{ type: "paragraph" }] };
    // biome-ignore lint/suspicious/noExplicitAny: TipTap Content 联合类型；我们已用 zod 校验形状
    editor.commands.setContent(next as any);
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="rounded-xl border border-hairline bg-white/40 px-4 py-8 text-center text-[12px] text-mute-soft">
        编辑器加载中…
      </div>
    );
  }

  const Btn = (props: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={props.onClick}
      title={props.title}
      className={`rounded px-2 py-1 text-[12px] transition ${
        props.active
          ? "bg-ink text-paper"
          : "bg-white/40 text-mute hover:bg-white/80 hover:text-ink"
      }`}
    >
      {props.children}
    </button>
  );

  return (
    <div className="rounded-xl border border-hairline">
      <div className="flex flex-wrap items-center gap-1 rounded-t-xl border-hairline border-b bg-paper-soft/60 px-2 py-1.5">
        <Btn
          title="加粗"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </Btn>
        <Btn
          title="斜体"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </Btn>
        <span className="mx-1 h-4 w-px bg-hairline" aria-hidden="true" />
        <Btn
          title="二级标题"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Btn>
        <Btn
          title="三级标题"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </Btn>
        <span className="mx-1 h-4 w-px bg-hairline" aria-hidden="true" />
        <Btn
          title="无序列表"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • 列表
        </Btn>
        <Btn
          title="有序列表"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. 列表
        </Btn>
        <Btn
          title="引用块"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          ❝引用
        </Btn>
        <span className="mx-1 h-4 w-px bg-hairline" aria-hidden="true" />
        <Btn title="撤销" onClick={() => editor.chain().focus().undo().run()}>
          ↶
        </Btn>
        <Btn title="重做" onClick={() => editor.chain().focus().redo().run()}>
          ↷
        </Btn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
