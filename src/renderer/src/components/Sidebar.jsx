import { useState, useEffect } from 'react'

function Sidebar({ currentPage, onNavigate }) {
  // 'none', 'available', 'downloading', 'downloaded'
  const [updateStatus, setUpdateStatus] = useState('none')

  useEffect(() => {
    if (!window.electronAPI?.updater) return

    const unsubAvailable = window.electronAPI.updater.onUpdateAvailable(() => {
      setUpdateStatus('available')
    })
    
    const unsubProgress = window.electronAPI.updater.onDownloadProgress(() => {
      setUpdateStatus('downloading')
    })

    const unsubDownloaded = window.electronAPI.updater.onUpdateDownloaded(() => {
      setUpdateStatus('downloaded')
    })

    return () => {
      unsubAvailable()
      unsubProgress()
      unsubDownloaded()
    }
  }, [])

  const handleUpdateClick = () => {
    if (updateStatus === 'available') {
      window.electronAPI.updater.download()
      setUpdateStatus('downloading')
    } else if (updateStatus === 'downloaded') {
      window.electronAPI.updater.install()
    }
  }

  const navItems = [
    {
      id: 'accounts',
      label: 'Accounts',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    }
  ]

  return (
    <aside className="w-56 flex flex-col shrink-0 bg-[#000000] border-r border-[#262626] relative z-10 h-full">

      {/* ===== Logo 區域 ===== */}
      <div className="p-5 pb-3">
        <div className="flex flex-row items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#111111] border border-[#262626] flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M2 5L12 19L15 14.5V5H12.5V11.5L9.5 7H2Z" fill="#ffffff" />
              <path d="M17 5V14.5L22 5H17Z" fill="#ffffff" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[14px] font-semibold text-[#ffffff] leading-tight">Workspace</h1>
            <p className="text-[11px] text-[#a3a3a3] font-medium leading-tight mt-0.5">VRT Login</p>
          </div>
        </div>
      </div>

      {/* ===== 導覽選單 ===== */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        <p className="text-[11px] font-semibold text-[#52525b] uppercase tracking-wider px-2 mb-2">
          Menu
        </p>
        {navItems.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex flex-row items-center gap-3 px-3 py-2 rounded-md transition-colors text-[13px] font-medium ${currentPage === item.id
                ? 'bg-[#262626] text-[#ffffff]'
                : 'text-[#a3a3a3] hover:bg-[#171717] hover:text-[#ededed]'
              }`}
          >
            <span className="flex-shrink-0 flex items-center justify-center w-4 h-4">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ===== 底部系統資訊與更新提示 ===== */}
      <div className="p-4">
        <div className="flex flex-row items-center px-3 py-2 rounded-md bg-[#0a0a0a] border border-[#262626]">
          <div className="flex flex-row items-center gap-2.5 flex-1">
            <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
            <p className="text-[12px] text-[#a3a3a3] font-medium">
              System Online
            </p>
          </div>

          {updateStatus !== 'none' && (
            <button
              onClick={handleUpdateClick}
              disabled={updateStatus === 'downloading'}
              className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
                updateStatus === 'available' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' :
                updateStatus === 'downloading' ? 'bg-yellow-500/20 text-yellow-500 cursor-not-allowed' :
                'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              }`}
              title={
                updateStatus === 'available' ? '新版本可用，點擊下載' :
                updateStatus === 'downloading' ? '下載中...' : '下載完成，點擊安裝並重啟'
              }
            >
              {updateStatus === 'downloading' ? (
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : updateStatus === 'downloaded' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

    </aside>
  )
}

export default Sidebar
