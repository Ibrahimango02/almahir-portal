'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

export default function TeacherRulesPage() {
    const [markdown, setMarkdown] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadMarkdown() {
            try {
                setLoading(true)
                setError(null)
                const response = await fetch('/teacher_rules.md')
                if (!response.ok) {
                    throw new Error('Failed to fetch teacher_rules.md')
                }
                const text = await response.text()
                setMarkdown(text)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }
        loadMarkdown()
    }, [])

    return (
        <main className="p-6">
            <div className="prose prose-lg max-w-none border-2 border-green-600 rounded-lg p-6 bg-white shadow-sm pl-2">
                {loading && <div className="text-green-700 font-medium">Loading...</div>}
                {error && <div className="text-red-500">Error: {error}</div>}
                {!loading && !error && (
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            code: ({ inline, className, children, ...props }: any) => {
                                return !inline ? (
                                    <pre className="bg-green-50 p-4 rounded-lg overflow-x-auto border border-green-200">
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    </pre>
                                ) : (
                                    <code className="bg-green-100 px-1 rounded text-green-800" {...props}>
                                        {children}
                                    </code>
                                )
                            },
                            h1: ({ children }) => <h1 className="text-3xl font-bold mb-4 text-green-700">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-2xl font-semibold mb-3 text-green-600">{children}</h2>,
                            a: ({ children, href }) => <a href={href} className="text-green-700 underline hover:text-green-900">{children}</a>,
                        }}
                    >
                        {markdown}
                    </ReactMarkdown>
                )}
            </div>
        </main>
    )
} 