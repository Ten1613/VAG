/**
 * App.jsx — 應用程式主佈局 (UI V4.0 Final)
 */
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import AccountsPage from './pages/AccountsPage'
import SettingsPage from './pages/SettingsPage'
import DynamicBackground from './components/DynamicBackground'
import UpdateNotification from './components/UpdateNotification'

function App() {
  const [currentPage, setCurrentPage] = useState('accounts')
  const [toast, setToast] = useState(null)
  const [showUpdate, setShowUpdate] = useState(true) // true = 允許顯示，匹配 UpdateNotification 內部狀態

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  return (
    <>
      <DynamicBackground />

      <div className="flex flex-col h-screen w-screen overflow-hidden text-[#ffffff] font-sans relative z-10 selection:bg-white/20">
        
        {/* ===== 極簡精緻標題列 ===== */}
        <div className="titlebar-drag flex flex-row items-center justify-between h-10 px-4 bg-[#050505] border-b border-[#262626] flex-shrink-0">
          <div className="flex flex-row items-center gap-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="titlebar-no-drag">
              <path d="M2 5L12 19L15 14.5V5H12.5V11.5L9.5 7H2Z" fill="#a3a3a3" />
              <path d="M17 5V14.5L22 5H17Z" fill="#a3a3a3" />
            </svg>
            <span className="text-[11px] font-semibold text-[#a3a3a3] tracking-widest titlebar-no-drag uppercase">
              Riot Authenticator
            </span>
          </div>

          <div className="flex flex-row items-center gap-1 titlebar-no-drag">
            <button
              id="btn-minimize"
              onClick={() => window.electronAPI?.windowMinimize()}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#262626] transition-colors"
              aria-label="最小化"
            >
              <svg width="10" height="1" viewBox="0 0 12 1">
                <rect width="12" height="1" fill="#a3a3a3" />
              </svg>
            </button>
            <button
              id="btn-close"
              onClick={() => window.electronAPI?.windowClose()}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-500/20 group transition-colors"
              aria-label="關閉"
            >
              <svg width="10" height="10" viewBox="0 0 12 12">
                <path d="M1 1L11 11M1 11L11 1" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" className="group-hover:stroke-red-500 transition-colors" />
              </svg>
            </button>
          </div>
        </div>

        {/* ===== 雙欄式佈局區塊 ===== */}
        <div className="flex flex-row flex-1 overflow-hidden relative">
          
          <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onShowUpdate={() => setShowUpdate(true)} />

          <main className="flex-1 overflow-y-auto px-10 py-10 bg-transparent custom-scrollbar relative">
            <div className="w-full max-w-4xl mx-auto h-full animate-fade-in" key={currentPage}>
              {currentPage === 'accounts' && (
                <AccountsPage showToast={showToast} />
              )}
              {currentPage === 'settings' && (
                <SettingsPage showToast={showToast} />
              )}
            </div>
          </main>
        </div>

        {/* ===== 更新遭知彈窗 ===== */}
        <UpdateNotification key={showUpdate} />

        {/* ===== 極簡 Toast ===== */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 toast-enter">
            <div
              className={`flex flex-row items-center gap-3 px-4 py-3 rounded-lg border shadow-2xl ${
                toast.type === 'success'
                  ? 'bg-[#0a0a0a] border-white/20 text-[#ffffff]'
                  : toast.type === 'error'
                    ? 'bg-[#1e0f0f] border-red-500/30 text-red-500'
                    : 'bg-[#0a0a0a] border-[#262626] text-[#ffffff]'
              }`}
            >
              <span className="text-[13px] font-medium tracking-wide">{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default App
