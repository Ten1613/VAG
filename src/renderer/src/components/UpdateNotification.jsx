/**
 * UpdateNotification.jsx
 * 自動更新提示通知元件
 * - 偵測到新版本時從右下角滑入彈出
 * - 提供「立即下載」/ 「稍後提醒」選項
 * - 下載完成後提示重啟安裝
 */
import { useState, useEffect } from 'react'

function UpdateNotification() {
  // 'hidden' | 'available' | 'downloading' | 'downloaded'
  const [state, setState] = useState('hidden')
  const [updateInfo, setUpdateInfo] = useState(null)
  const [progress, setProgress] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!window.electronAPI?.updater) return

    const unsubAvailable = window.electronAPI.updater.onUpdateAvailable((info) => {
      setUpdateInfo(info)
      setDismissed(false)
      setState('available')
    })

    const unsubProgress = window.electronAPI.updater.onDownloadProgress((progressObj) => {
      setState('downloading')
      setProgress(Math.round(progressObj.percent || 0))
    })

    const unsubDownloaded = window.electronAPI.updater.onUpdateDownloaded(() => {
      setState('downloaded')
      setProgress(100)
    })

    return () => {
      unsubAvailable()
      unsubProgress()
      unsubDownloaded()
    }
  }, [])

  const handleDownload = () => {
    setState('downloading')
    window.electronAPI.updater.download()
  }

  const handleInstall = () => {
    window.electronAPI.updater.install()
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  // 已關閉或沒有動作時，不顯示任何東西
  if (state === 'hidden' || dismissed) return null

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-80 animate-slide-up"
      style={{ animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
    >
      <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden">
        
        {/* 頂部色條 */}
        {state === 'downloaded' ? (
          <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 to-green-400" />
        ) : (
          <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 to-cyan-400" />
        )}

        <div className="p-5">
          {/* 標題列 */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                state === 'downloaded'
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : 'bg-blue-500/10 border border-blue-500/20'
              }`}>
                {state === 'downloaded' ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : state === 'downloading' ? (
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 16 12 12 8 16" />
                    <line x1="12" y1="12" x2="12" y2="21" />
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#ededed] leading-tight">
                  {state === 'downloaded'
                    ? '更新已就緒'
                    : state === 'downloading'
                    ? '正在下載更新'
                    : '發現新版本'}
                </p>
                {updateInfo?.version && (
                  <p className="text-[11px] text-[#71717a] mt-0.5">
                    v{updateInfo.version}
                  </p>
                )}
              </div>
            </div>
            {/* 僅在有更新、未下載時顯示關閉按鈕 */}
            {state === 'available' && (
              <button
                onClick={handleDismiss}
                className="w-6 h-6 flex items-center justify-center rounded-md text-[#52525b] hover:text-[#a3a3a3] hover:bg-white/5 transition-colors shrink-0"
              >
                <svg width="10" height="10" viewBox="0 0 12 12">
                  <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {/* 描述文字 */}
          <p className="text-[12px] text-[#71717a] mb-4 leading-relaxed">
            {state === 'downloaded'
              ? '新版本已下載完成，重新啟動程式後即可完成安裝。'
              : state === 'downloading'
              ? `正在下載中，請稍後... (${progress}%)`
              : 'VAG 有新版本可用，建議更新以獲取最新功能。'}
          </p>

          {/* 下載進度條 */}
          {state === 'downloading' && (
            <div className="mb-4">
              <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* 按鈕區 */}
          {state === 'available' && (
            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="flex-1 text-[12px] font-medium text-[#71717a] hover:text-[#a3a3a3] py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                稍後提醒
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 text-[12px] font-semibold text-white py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors"
              >
                立即下載
              </button>
            </div>
          )}

          {state === 'downloaded' && (
            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="flex-1 text-[12px] font-medium text-[#71717a] hover:text-[#a3a3a3] py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                稍後安裝
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 text-[12px] font-semibold text-white py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors"
              >
                重啟安裝
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UpdateNotification
