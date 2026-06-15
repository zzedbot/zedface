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
    <div style={{ padding: '16px', color: '#e0e0ff' }}>
      <h3 style={{ color: '#4ecdc4', marginBottom: '12px' }}>📊 Dashboard</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '12px',
      }}
    >
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4ecdc4' }}>{value}</div>
    </div>
  )
}

/** Chart 占位组件 */
function ChartPlaceholder() {
  return (
    <div style={{ padding: '16px', color: '#e0e0ff' }}>
      <h3 style={{ color: '#4ecdc4', marginBottom: '12px' }}>📈 Chart</h3>
      <div
        style={{
          height: '150px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px dashed rgba(78, 205, 196, 0.3)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
        }}
      >
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
    <div style={{ padding: '16px' }}>
      <h3 style={{ color: '#4ecdc4', marginBottom: '12px' }}>💻 Code</h3>
      <pre
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '13px',
          color: '#e0e0ff',
          overflow: 'auto',
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  )
}

/** Status 占位组件 */
function StatusPlaceholder() {
  return (
    <div style={{ padding: '16px', color: '#e0e0ff' }}>
      <h3 style={{ color: '#4ecdc4', marginBottom: '12px' }}>🟢 Status</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '6px',
      }}
    >
      <span>{label}</span>
      <span
        style={{
          color: colors[status],
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
        }}
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
        <div
          className="window-markdown-content"
          style={{
            color: '#e0e0ff',
            lineHeight: 1.6,
            fontSize: '14px',
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // 列表需要左内边距，因为全局 * { padding: 0 } 清掉了默认值
              ul: ({ children, ...props }) => (
                <ul style={{ paddingLeft: '1.5em', marginBottom: '0.8em' }} {...props}>{children}</ul>
              ),
              ol: ({ children, ...props }) => (
                <ol style={{ paddingLeft: '1.5em', marginBottom: '0.8em' }} {...props}>{children}</ol>
              ),
              li: ({ children, ...props }) => (
                <li style={{ marginBottom: '0.3em' }} {...props}>{children}</li>
              ),
              h1: ({ children, ...props }) => (
                <h1 style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#4ecdc4', margin: '0.6em 0 0.4em' }} {...props}>{children}</h1>
              ),
              h2: ({ children, ...props }) => (
                <h2 style={{ fontSize: '1.25em', fontWeight: 'bold', color: '#4ecdc4', margin: '0.6em 0 0.4em' }} {...props}>{children}</h2>
              ),
              h3: ({ children, ...props }) => (
                <h3 style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#4ecdc4', margin: '0.5em 0 0.3em' }} {...props}>{children}</h3>
              ),
              p: ({ children, ...props }) => (
                <p style={{ marginBottom: '0.6em' }} {...props}>{children}</p>
              ),
              blockquote: ({ children, ...props }) => (
                <blockquote
                  style={{
                    borderLeft: '3px solid #4ecdc4',
                    paddingLeft: '12px',
                    marginLeft: 0,
                    color: '#aaa',
                    marginBottom: '0.6em',
                  }}
                  {...props}
                >
                  {children}
                </blockquote>
              ),
              code: ({ className, children, ...props }) => {
                const isBlock = className?.includes('language-')
                if (isBlock) {
                  return (
                    <code
                      style={{
                        display: 'block',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '12px',
                        fontSize: '13px',
                        overflow: 'auto',
                        marginBottom: '0.6em',
                      }}
                      className={className}
                      {...props}
                    >
                      {children}
                    </code>
                  )
                }
                return (
                  <code
                    style={{
                      background: 'rgba(78, 205, 196, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.9em',
                    }}
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
              pre: ({ children, ...props }) => (
                <pre style={{ margin: 0 }} {...props}>{children}</pre>
              ),
              a: ({ children, ...props }) => (
                <a style={{ color: '#4ecdc4', textDecoration: 'underline' }} {...props}>{children}</a>
              ),
              strong: ({ children, ...props }) => (
                <strong style={{ color: '#fff' }} {...props}>{children}</strong>
              ),
              hr: (props) => (
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '0.8em 0' }} {...props} />
              ),
              table: ({ children, ...props }) => (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.6em' }} {...props}>{children}</table>
              ),
              th: ({ children, ...props }) => (
                <th style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 8px', textAlign: 'left', color: '#4ecdc4' }} {...props}>{children}</th>
              ),
              td: ({ children, ...props }) => (
                <td style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', padding: '6px 8px' }} {...props}>{children}</td>
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
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '4px',
            background: '#fff',
          }}
        />
      )

    case 'component': {
      const Component = componentRegistry[content.body]
      if (!Component) {
        return (
          <div style={{ color: '#ff6b6b', padding: '16px' }}>
            Unknown component: {content.body}
          </div>
        )
      }
      return <Component />
    }

    case 'text':
    default:
      return (
        <pre
          style={{
            color: '#e0e0ff',
            fontSize: '13px',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
          }}
        >
          {content.body}
        </pre>
      )
  }
}
