"use client"

import { useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
    Bold, Italic, Heading2, Heading3, Quote,
    List, ListOrdered, Link2, Eye, PenLine,
} from "lucide-react"

interface Props {
    value:       string
    onChange:    (val: string) => void
    placeholder?: string
    minRows?:    number
}

type ToolbarAction =
    | { type: "wrap";   before: string; after: string; placeholder: string }
    | { type: "prefix"; prefix: string }
    | { type: "link" }

const TOOLBAR: { label: string; icon: React.ReactNode; action: ToolbarAction }[] = [
    { label: "Bold",          icon: <Bold size={14} />,        action: { type: "wrap",   before: "**", after: "**", placeholder: "bold text" } },
    { label: "Italic",        icon: <Italic size={14} />,      action: { type: "wrap",   before: "_",  after: "_",  placeholder: "italic text" } },
    { label: "Heading 2",     icon: <Heading2 size={14} />,    action: { type: "prefix", prefix: "## " } },
    { label: "Heading 3",     icon: <Heading3 size={14} />,    action: { type: "prefix", prefix: "### " } },
    { label: "Blockquote",    icon: <Quote size={14} />,       action: { type: "prefix", prefix: "> " } },
    { label: "Bullet List",   icon: <List size={14} />,        action: { type: "prefix", prefix: "- " } },
    { label: "Numbered List", icon: <ListOrdered size={14} />, action: { type: "prefix", prefix: "1. " } },
    { label: "Link",          icon: <Link2 size={14} />,       action: { type: "link" } },
]

function applyAction(
    textarea: HTMLTextAreaElement,
    action:   ToolbarAction,
    value:    string,
    onChange: (v: string) => void,
) {
    const start = textarea.selectionStart
    const end   = textarea.selectionEnd
    const sel   = value.slice(start, end)

    let newValue:      string
    let cursorStart:   number
    let cursorEnd:     number

    if (action.type === "wrap") {
        const text = sel || action.placeholder
        newValue    = value.slice(0, start) + action.before + text + action.after + value.slice(end)
        cursorStart = start + action.before.length
        cursorEnd   = cursorStart + text.length
    } else if (action.type === "prefix") {
        const lineStart = value.lastIndexOf("\n", start - 1) + 1
        const chunk     = value.slice(lineStart, end)
        const prefixed  = chunk.split("\n").map(l => action.prefix + l).join("\n")
        newValue    = value.slice(0, lineStart) + prefixed + value.slice(end)
        cursorStart = start + action.prefix.length
        cursorEnd   = end + (prefixed.length - chunk.length)
    } else {
        const text  = sel || "link text"
        const link  = `[${text}](url)`
        newValue    = value.slice(0, start) + link + value.slice(end)
        cursorStart = start + 1
        cursorEnd   = start + 1 + text.length
    }

    onChange(newValue)
    requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(cursorStart, cursorEnd)
    })
}

export default function MarkdownEditor({ value, onChange, placeholder, minRows = 22 }: Props) {
    const [activeTab, setTab] = useState<"write" | "preview">("write")
    const ref = useRef<HTMLTextAreaElement>(null)

    return (
        <div className="rounded-xl border-2 border-gray-200 overflow-hidden bg-white">

            {/* Tab bar */}
            <div className="flex items-center border-b border-gray-200 bg-gray-50">
                {(["write", "preview"] as const).map(t => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={[
                            "px-4 py-2.5 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-colors",
                            activeTab === t
                                ? "border-[#8B5E3C] text-[#8B5E3C] bg-white"
                                : "border-transparent text-gray-500 hover:text-gray-700",
                        ].join(" ")}
                    >
                        {t === "write"
                            ? <><PenLine size={13} /> Write</>
                            : <><Eye     size={13} /> Preview</>
                        }
                    </button>
                ))}
            </div>

            {activeTab === "write" && (
                <>
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
                        {TOOLBAR.map(({ label, icon, action }) => (
                            <button
                                key={label}
                                type="button"
                                title={label}
                                onClick={() => ref.current && applyAction(ref.current, action, value, onChange)}
                                className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                {icon}
                            </button>
                        ))}
                        <span className="ml-auto text-xs text-gray-400 pr-2 select-none hidden sm:inline">
                            **bold** &nbsp;*italic* &nbsp;## H2 &nbsp;&gt; quote
                        </span>
                    </div>

                    {/* Textarea */}
                    <textarea
                        ref={ref}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder={
                            placeholder ??
                            "Start writing your article here…\n\n## Introduction\n\nTell the reader what this article is about.\n\n## Section Title\n\nAdd your content here. Use the toolbar to format text."
                        }
                        rows={minRows}
                        className="w-full px-4 py-4 font-mono text-sm text-gray-800 resize-y focus:outline-none leading-relaxed placeholder:text-gray-400"
                    />
                </>
            )}

            {activeTab === "preview" && (
                <div className="px-6 py-6 min-h-[400px]">
                    {value.trim() ? (
                        <div className="prose prose-stone prose-lg max-w-none
                            prose-headings:font-bold prose-headings:text-gray-900
                            prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                            prose-p:text-gray-700 prose-p:leading-relaxed
                            prose-a:text-[#8B5E3C] prose-a:no-underline hover:prose-a:underline
                            prose-strong:text-gray-900
                            prose-blockquote:border-l-[#C49A6C] prose-blockquote:text-gray-600 prose-blockquote:italic
                            prose-ul:text-gray-700 prose-ol:text-gray-700
                            prose-li:marker:text-[#8B5E3C]
                            prose-table:text-sm prose-table:border prose-td:border prose-th:border
                            prose-th:bg-[#F5F0EB] prose-th:p-2 prose-td:p-2
                            prose-hr:border-gray-200
                            prose-img:rounded-xl prose-img:shadow-md">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
                        </div>
                    ) : (
                        <p className="text-gray-400 italic text-sm">
                            Nothing to preview yet — switch to Write and start typing.
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}
