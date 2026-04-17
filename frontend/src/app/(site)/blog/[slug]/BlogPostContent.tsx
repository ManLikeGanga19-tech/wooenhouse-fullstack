"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function BlogPostContent({ content }: { content: string }) {
    return (
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
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
            </ReactMarkdown>
        </div>
    )
}
