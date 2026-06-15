# ZedFace Window Control Skill

Control floating windows in ZedFace through the control server API. AI can create, move, resize, and populate multiple floating windows with various content types.

## When to Use

Use this skill when:
- User wants to display information in a floating window
- User wants to create dashboards or status panels
- User wants to show AI-generated content (markdown, HTML, charts)
- User wants to manage multiple floating windows
- User asks to create a popup, panel, or overlay

## Configuration

- **Server URL**: http://localhost:3001
- **Auth Token**: Use environment variable `ZEDFACE_TOKEN` or default `zedface-control-dev-token`
- **WebSocket**: ws://localhost:3001 (auto-connected by frontend)

## Window Actions

### 1. Open Window

Create and display a new floating window.

**Parameters:**
- `windowId` (required): Unique identifier (a-z0-9_-, max 32 chars)
- `title`: Window title (default: "Window")
- `col`: Column position in grid (default: 1)
- `row`: Row position in grid (default: 1)
- `width`: Width in grid units (default: 4)
- `height`: Height in grid units (default: 3)

```bash
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "windowOpen",
    "windowId": "my-window",
    "title": "My Window",
    "col": 2,
    "row": 2,
    "width": 5,
    "height": 4
  }'
```

### 2. Close Window

Close and remove a window.

```bash
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "windowClose", "windowId": "my-window"}'
```

### 3. Minimize/Restore Window

Toggle window minimized state.

**Parameters:**
- `windowId` (required): Window identifier
- `minimized`: true/false (default: toggle)

```bash
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "windowMinimize", "windowId": "my-window", "minimized": true}'
```

### 4. Move Window

Move window to a new grid position.

**Parameters:**
- `windowId` (required): Window identifier
- `col` (required): New column position
- `row` (required): New row position

```bash
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "windowMove", "windowId": "my-window", "col": 5, "row": 3}'
```

### 5. Resize Window

Resize window in grid units.

**Parameters:**
- `windowId` (required): Window identifier
- `width` (required): New width in grid units
- `height` (required): New height in grid units

```bash
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "windowResize", "windowId": "my-window", "width": 6, "height": 5}'
```

### 6. Set Window Content

Set the content displayed in a window.

**Content Types:**

| Type | Description | Use Case |
|------|-------------|----------|
| `markdown` | Rendered Markdown (GFM supported) | AI-generated formatted text |
| `html` | HTML string (embedded in iframe) | Complete web pages, custom styling |
| `component` | Pre-defined React component | Dashboard, charts, status panels |
| `text` | Plain text | Simple messages, logs |

**Parameters:**
- `windowId` (required): Window identifier
- `contentType` (required): One of `markdown`, `html`, `component`, `text`
- `content` (required): Content string (max 10000 chars)

#### Markdown Content

```bash
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "windowSetContent",
    "windowId": "my-window",
    "contentType": "markdown",
    "content": "# Hello World\n\nThis is **bold** and *italic*.\n\n- Item 1\n- Item 2\n\n```js\nconsole.log(\"code block\")\n```"
  }'
```

#### HTML Content

```bash
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "windowSetContent",
    "windowId": "my-window",
    "contentType": "html",
    "content": "<!DOCTYPE html><html><body style=\"font-family:sans-serif;padding:20px;background:#1a1a2e;color:#eee\"><h1 style=\"color:#4ecdc4\">Custom HTML</h1><p>This is embedded HTML with <strong>custom styling</strong>.</p></body></html>"
  }'
```

#### Pre-defined Components

Available components: `dashboard`, `chart`, `code`, `status`

```bash
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "windowSetContent", "windowId": "my-window", "contentType": "component", "content": "dashboard"}'
```

#### Plain Text

```bash
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "windowSetContent", "windowId": "my-window", "contentType": "text", "content": "Simple plain text content.\nLine 2."}'
```

### 7. List All Windows

Get status of all open windows.

```bash
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "windowList"}'
```

## Grid System

The viewport is divided into a grid (default 12 columns × 8 rows). All positions and sizes are in grid units:

- **Grid cell size** = viewport width / 12 × viewport height / 8
- **Window position** (col, row) = top-left corner in grid units
- **Window size** (width, height) = how many grid cells the window occupies

Example: A window at `col: 2, row: 1, width: 4, height: 3` occupies columns 2-5 and rows 1-3.

## Example Workflows

### Create a Dashboard

```bash
# 1. Open window
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -d '{"action": "windowOpen", "windowId": "dashboard", "title": "System Dashboard", "col": 1, "row": 1, "width": 6, "height": 4}'

# 2. Set dashboard component
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -d '{"action": "windowSetContent", "windowId": "dashboard", "contentType": "component", "content": "dashboard"}'
```

### Display AI Analysis

```bash
# 1. Open window
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -d '{"action": "windowOpen", "windowId": "analysis", "title": "Analysis Results", "col": 7, "row": 1, "width": 5, "height": 5}'

# 2. Set markdown content
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -d '{
    "action": "windowSetContent",
    "windowId": "analysis",
    "contentType": "markdown",
    "content": "# Analysis Results\n\n## Summary\n\n- **Total Requests**: 12,345\n- **Success Rate**: 99.2%\n- **Avg Response Time**: 145ms\n\n## Key Findings\n\n1. Performance improved by 23%\n2. Error rate decreased by 15%\n3. User engagement up 8%\n\n> Note: Data collected over last 24 hours"
  }'
```

### Create Multi-Window Layout

```bash
# Window 1: Status
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -d '{"action": "windowOpen", "windowId": "status", "title": "Status", "col": 1, "row": 1, "width": 3, "height": 3}'
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -d '{"action": "windowSetContent", "windowId": "status", "contentType": "component", "content": "status"}'

# Window 2: Chart
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -d '{"action": "windowOpen", "windowId": "chart", "title": "Trends", "col": 4, "row": 1, "width": 5, "height": 3}'
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -d '{"action": "windowSetContent", "windowId": "chart", "contentType": "component", "content": "chart"}'

# Window 3: Info
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -d '{"action": "windowOpen", "windowId": "info", "title": "Information", "col": 9, "row": 1, "width": 3, "height": 3}'
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -d '{"action": "windowSetContent", "windowId": "info", "contentType": "markdown", "content": "# Info\n\nAdditional details here."}'
```

### Custom HTML Widget

```bash
curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -d '{
    "action": "windowOpen",
    "windowId": "custom",
    "title": "Custom Widget",
    "col": 2,
    "row": 2,
    "width": 5,
    "height": 4
  }'

curl -X POST http://localhost:3001/api/control \
  -H "Authorization: Bearer zedface-control-dev-token" \
  -d '{
    "action": "windowSetContent",
    "windowId": "custom",
    "contentType": "html",
    "content": "<!DOCTYPE html><html><head><style>body{margin:0;padding:20px;font-family:sans-serif;background:linear-gradient(135deg,#1a1a2e,#16213e);color:#eee}.card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;margin:10px 0}h1{color:#4ecdc4}button{background:#4ecdc4;color:#1a1a2e;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:bold}</style></head><body><h1>Interactive Widget</h1><div class=\"card\"><p>This is a custom HTML widget with interactive elements.</p><button onclick=\"alert('Clicked!')\">Click Me</button></div></body></html>"
  }'
```

## Pre-defined Components

| Component | Description |
|-----------|-------------|
| `dashboard` | Stats cards showing active users, requests/s, CPU, memory |
| `chart` | Placeholder for chart visualization |
| `code` | Code snippet display |
| `status` | Service status indicators (API, WebSocket, DB, Cache) |

## Tips

1. **Window IDs**: Use descriptive names like `dashboard`, `analysis`, `logs`, `settings`
2. **Grid Positioning**: Plan your layout before creating windows to avoid overlaps
3. **Content Size**: Markdown and HTML content is limited to 10,000 characters
4. **HTML Security**: HTML content is rendered in a sandboxed iframe (scripts allowed)
5. **Responsive**: Windows automatically adjust when browser is resized

## Troubleshooting

**Window not appearing:**
- Check that windowId is valid (a-z0-9_-, max 32 chars)
- Verify the control server is running

**Content not rendering:**
- Check contentType is one of: markdown, html, component, text
- For component type, content must be: dashboard, chart, code, or status
- Verify content length is under 10,000 characters

**401 Unauthorized:**
- Check the Authorization header with Bearer token
- Token can be customized via `ZEDFACE_TOKEN` environment variable
