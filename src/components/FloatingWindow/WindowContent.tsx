// src/components/FloatingWindow/WindowContent.tsx

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { WindowContent } from '../../hooks/useWindowManager'

interface WindowContentRendererProps {
  content: WindowContent
}

/** 预定义组件注册表 */
const componentRegistry: Record<string, React.ComponentType> = {
  dashboard: DashboardPlaceholder,
  chart: ChartPlaceholder,
  code: CodePlaceholder,
  status: StatusPlaceholder,
}

/** Dashboard 占位组件 */
function DashboardPlaceholder() {
  return (
    <div className="p-4 text-text-primary">
      <h3 className="text-primary mb-3">📊 Dashboard</h3>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Active Users" value="1,234" />
        <StatCard label="Requests/s" value="456" />
        <StatCard label="CPU Usage" value="42%" />
        <StatCard label="Memory" value="8.2 GB" />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
      <div className="text-[11px] text-text-secondary mb-1">{label}</div>
      <div className="text-xl font-bold text-primary">{value}</div>
    </div>
  )
}

/** Chart 占位组件 */
function ChartPlaceholder() {
  return (
    <div className="p-4 text-text-primary">
      <h3 className="text-primary mb-3">📈 Chart</h3>
      <div className="h-[150px] bg-white/3 border border-dashed border-primary/30 rounded-lg flex items-center justify-center text-text-secondary/70">
        Chart visualization placeholder
      </div>
    </div>
  )
}

/** Code 占位组件 */
function CodePlaceholder() {
  const code = `function hello() {
  console.log("Hello, World!");
  return 42;
}`
  return (
    <div className="p-4">
      <h3 className="text-primary mb-3">💻 Code</h3>
      <pre className="bg-black/30 border border-white/10 rounded-lg p-3 text-[13px] text-text-primary overflow-auto">
        <code>{code}</code>
      </pre>
    </div>
  )
}

/** Status 占位组件 */
function StatusPlaceholder() {
  return (
    <div className="p-4 text-text-primary">
      <h3 className="text-primary mb-3">🟢 Status</h3>
      <div className="flex flex-col gap-2">
        <StatusRow label="API Server" status="online" />
        <StatusRow label="WebSocket" status="online" />
        <StatusRow label="Database" status="warning" />
        <StatusRow label="Cache" status="online" />
      </div>
    </div>
  )
}

function StatusRow({ label, status }: { label: string; status: 'online' | 'offline' | 'warning' }) {
  const colors = {
    online: '#4ecdc4',
    offline: '#ff6b6b',
    warning: '#ffd93d',
  }
  return (
    <div className="flex justify-between items-center px-3 py-2 bg-white/3 rounded-md">
      <span>{label}</span>
      <span
        className="text-xs font-bold uppercase"
        style={{ color: colors[status] }}
      >
        {status}
      </span>
    </div>
  )
}

/** 窗口内容渲染器 */
export function WindowContentRenderer({ content }: WindowContentRendererProps) {
  switch (content.type) {
    case 'markdown':
      return (
        <div className="text-text-primary leading-[1.6] text-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              ul: ({ children, ...props }) => (
                <ul className="pl-6 mb-3" {...props}>{children}</ul>
              ),
              ol: ({ children, ...props }) => (
                <ol className="pl-6 mb-3" {...props}>{children}</ol>
              ),
              li: ({ children, ...props }) => (
                <li className="mb-1" {...props}>{children}</li>
              ),
              h1: ({ children, ...props }) => (
                <h1 className="text-2xl font-bold text-primary my-2.5 mb-1.5" {...props}>{children}</h1>
              ),
              h2: ({ children, ...props }) => (
                <h2 className="text-xl font-bold text-primary my-2.5 mb-1.5" {...props}>{children}</h2>
              ),
              h3: ({ children, ...props }) => (
                <h3 className="text-lg font-bold text-primary my-2 mb-1" {...props}>{children}</h3>
              ),
              p: ({ children, ...props }) => (
                <p className="mb-2.5" {...props}>{children}</p>
              ),
              blockquote: ({ children, ...props }) => (
                <blockquote className="border-l-[3px] border-primary pl-3 ml-0 text-text-secondary/70 mb-2.5" {...props}>
                  {children}
                </blockquote>
              ),
              code: ({ className, children, ...props }) => {
                const isBlock = className?.includes('language-')
                if (isBlock) {
                  return (
                    <code
                      className="block bg-black/30 border border-white/10 rounded-md p-3 text-[13px] overflow-auto mb-2.5"
                      {...props}
                    >
                      {children}
                    </code>
                  )
                }
                return (
                  <code className="bg-primary/10 px-1.5 py-0.5 rounded text-[0.9em]" {...props}>
                    {children}
                  </code>
                )
              },
              pre: ({ children, ...props }) => (
                <pre className="m-0" {...props}>{children}</pre>
              ),
              a: ({ children, ...props }) => (
                <a className="text-primary underline" {...props}>{children}</a>
              ),
              strong: ({ children, ...props }) => (
                <strong className="text-white" {...props}>{children}</strong>
              ),
              hr: (props) => (
                <hr className="border-0 border-t border-white/10 my-3" {...props} />
              ),
              table: ({ children, ...props }) => (
                <table className="w-full border-collapse mb-2.5" {...props}>{children}</table>
              ),
              th: ({ children, ...props }) => (
                <th className="border-b border-white/20 px-2 py-1.5 text-left text-primary" {...props}>{children}</th>
              ),
              td: ({ children, ...props }) => (
                <td className="border-b border-white/5 px-2 py-1.5" {...props}>{children}</td>
              ),
            }}
          >
            {content.body}
          </ReactMarkdown>
        </div>
      )

    case 'html':
      return (
        <iframe
          srcDoc={content.body}
          sandbox="allow-scripts"
          title="HTML Content"
          className="w-full h-full border-none rounded bg-white"
        />
      )

    case 'component': {
      const Component = componentRegistry[content.body]
      if (!Component) {
        return (
          <div className="text-secondary p-4">
            Unknown component: {content.body}
          </div>
        )
      }
      return <Component />
    }

    case 'text':
    default:
      return (
        <pre className="text-text-primary text-[13px] leading-[1.5] whitespace-pre-wrap break-words m-0">
          {content.body}
        </pre>
      )
  }
}
