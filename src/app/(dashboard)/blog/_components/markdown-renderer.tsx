'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl font-bold text-zinc-900 mt-6 mb-3">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold text-zinc-900 mt-6 mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-zinc-800 mt-4 mb-1">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold text-zinc-800 mt-3 mb-1">{children}</h4>
        ),
        p: ({ children }) => (
          <p className="text-sm text-zinc-700 leading-relaxed mb-3">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-zinc-900">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-zinc-600">{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="list-disc ml-4 mb-3 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal ml-4 mb-3 space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm text-zinc-700">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-amber-400 pl-3 my-3 text-sm text-zinc-600 italic">
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) {
            return (
              <pre className="bg-zinc-900 text-zinc-100 rounded-lg p-4 my-3 overflow-x-auto text-xs">
                <code>{children}</code>
              </pre>
            );
          }
          return (
            <code className="bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono">
              {children}
            </code>
          );
        },
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:text-amber-700 underline underline-offset-2"
          >
            {children}
          </a>
        ),
        hr: () => <hr className="my-4 border-zinc-200" />,
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full text-sm border-collapse border border-zinc-200 rounded-lg">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-zinc-50">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="text-left px-3 py-2 text-xs font-medium text-zinc-600 border border-zinc-200">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-sm text-zinc-700 border border-zinc-200">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/** @deprecated Use MarkdownRenderer component instead */
export function renderMarkdown(md: string) {
  return <MarkdownRenderer content={md} />;
}
