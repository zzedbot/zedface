import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root not found in index.html')
}

// 不使用 StrictMode — Three.js requestAnimationFrame 副作用
// 在 double-invoke 下会导致多重渲染循环
ReactDOM.createRoot(rootEl).render(<App />)
