/**
 * SettingsPage.jsx — 系統設定 (UI V4.0 極簡版)
 * 專注於可讀性與俐落質感的設定面板
 */
import { useState, useEffect } from 'react'

function SettingsPage({ showToast }) {
  const [riotPath, setRiotPath] = useState('')
  const [inputPath, setInputPath] = useState('')
  const [isDetecting, setIsDetecting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pathStatus, setPathStatus] = useState('unknown')
  const [openAtLogin, setOpenAtLogin] = useState(false)
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    loadConfig()
    loadSystemSettings()
  }, [])

  const loadConfig = async () => {
    try {
      const result = await window.electronAPI?.getConfig()
      if (result?.success && result.data.riotClientPath) {
        setRiotPath(result.data.riotClientPath)
        setInputPath(result.data.riotClientPath)
        setPathStatus('found')
      } else {
        setPathStatus('not-found')
      }
    } catch (error) {
      console.error('Config failed:', error)
      setPathStatus('not-found')
    }
  }

  const loadSystemSettings = async () => {
    try {
      const [loginItem, version] = await Promise.all([
        window.electronAPI?.getLoginItem(),
        window.electronAPI?.getVersion()
      ])
      if (loginItem) setOpenAtLogin(loginItem.openAtLogin)
      if (version) setAppVersion(version)
    } catch (error) {
      console.error('System settings failed:', error)
    }
  }

  const handleToggleLoginItem = async (value) => {
    try {
      setOpenAtLogin(value)
      await window.electronAPI?.setLoginItem({ openAtLogin: value })
      showToast(value ? '已設定為開機自動啟動' : '已關閉開機自動啟動')
    } catch (error) {
      showToast('設定失敗：' + error.message, 'error')
    }
  }

  const handleDetect = async () => {
    setIsDetecting(true)
    try {
      const result = await window.electronAPI?.detectRiotPath()
      if (result?.success && result.path) {
        setRiotPath(result.path)
        setInputPath(result.path)
        setPathStatus('found')
        await window.electronAPI?.saveConfig({ riotClientPath: result.path })
        showToast('已偵測到安裝路徑')
      } else {
        setPathStatus('not-found')
        showToast('找不到客戶端，請手動選擇', 'error')
      }
    } catch (error) {
      showToast('掃描異常：' + error.message, 'error')
    } finally {
      setIsDetecting(false)
    }
  }

  const handleSelectFile = async () => {
    try {
      const result = await window.electronAPI?.selectFile()
      if (result?.success && result.path) {
        setInputPath(result.path)
      }
    } catch (error) {
      showToast('選擇任務失敗', 'error')
    }
  }

  const handleSave = async () => {
    if (!inputPath.trim()) {
      showToast('請輸入有效路徑', 'error')
      return
    }

    setIsSaving(true)
    try {
      const result = await window.electronAPI?.saveConfig({ riotClientPath: inputPath.trim() })
      if (result?.success) {
        setRiotPath(inputPath.trim())
        setPathStatus('found')
        showToast('設定已儲存')
      } else {
        showToast('儲存失敗', 'error')
      }
    } catch (error) {
      showToast('寫入異常：' + error.message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full animate-fade-in max-w-2xl mx-auto">
      {/* ===== 精緻頁首 ===== */}
      <div className="flex items-center justify-between pb-8">
        <div>
          <h2 className="text-[24px] font-semibold text-[#ededed] tracking-tight">
            Settings
          </h2>
          <p className="text-[13px] text-[#71717a] mt-1.5 font-medium">
            設定 Riot Client 指定安裝路線。
          </p>
        </div>
      </div>

      {/* ===== 路徑設定面板 ===== */}
      <div className="surface-card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#ffffff0a]">
          <div className="w-10 h-10 rounded-full bg-[#ffffff05] border border-[#ffffff0a] flex items-center justify-center shrink-0">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-[#ededed]">Riot Client Executable</h3>
            <p className="text-[12px] text-[#71717a] mt-0.5">系統將透過此路徑啟動客戶端</p>
          </div>
        </div>

        {/* 目前狀態 */}
        <div className="mb-7">
          <label className="block text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2.5">
            Current Status
          </label>
          <div className="bg-[#ffffff05] border border-[#ffffff0a] rounded-lg p-3.5 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full shrink-0 ${pathStatus === 'found' ? 'bg-green-500' : 'bg-red-500'}`} />
            {pathStatus === 'found' ? (
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-green-400">系統已連結</p>
                <p className="text-[11px] text-[#71717a] font-mono mt-0.5 truncate">{riotPath}</p>
              </div>
            ) : (
               <div className="min-w-0">
                <p className="text-[12px] font-medium text-red-400">路徑未設定或遺失</p>
                <p className="text-[11px] text-[#71717a] mt-0.5 truncate">請執行掃描或手動設定位址。</p>
              </div>
            )}
          </div>
        </div>

        {/* 路徑輸入 */}
        <div className="mb-6">
          <label className="block text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2.5">
            Set Path
          </label>
          <div className="flex gap-2.5">
            <input
              id="input-riot-path"
              type="text"
              value={inputPath}
              onChange={(e) => setInputPath(e.target.value)}
              placeholder="C:\Riot Games\Riot Client\RiotClientServices.exe"
              className="input-field font-mono text-[12px]"
            />
            <button
              id="btn-select-file"
              onClick={handleSelectFile}
              className="btn-secondary shrink-0"
              style={{ width: '80px' }}
            >
              Browse
            </button>
          </div>
        </div>

        {/* 按鈕組 */}
        <div className="flex justify-end gap-2.5 pt-4">
           <button
            id="btn-detect-path"
            onClick={handleDetect}
            disabled={isDetecting}
            className="btn-secondary"
          >
            {isDetecting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                </svg>
                Scanning
              </>
            ) : (
              'Auto Scan'
            )}
          </button>
          <button
             id="btn-save-path"
            onClick={handleSave}
            disabled={!inputPath.trim() || isSaving}
            className="btn-primary"
            style={{ minWidth: '100px' }}
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* 說明與提示 */}
      <div className="bg-[#ffffff02] border border-[#ffffff0a] rounded-xl p-5 mb-6">
         <h4 className="text-[12px] font-semibold text-[#a1a1aa] mb-3 flex items-center gap-2">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
           Information
         </h4>
         <ul className="space-y-2 text-[12px] text-[#71717a]">
           <li>• 建議將應用程式維持在背景執行，不影響系統效能。</li>
           <li>• 如果預設在 C 槽找不到 Riot Client，請嘗試開啟檔案總管手動選擇。</li>
           <li>• 啟動登入程序後，自動綁定會完全接管鍵盤輸入，請短暫停留以確保輸入完成。</li>
         </ul>
      </div>

      {/* ===== 系統偏好設定 ===== */}
      <div className="surface-card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#ffffff0a]">
          <div className="w-10 h-10 rounded-full bg-[#ffffff05] border border-[#ffffff0a] flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
            </svg>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-[#ededed]">系統偏好</h3>
            <p className="text-[12px] text-[#71717a] mt-0.5">控制應用程式的系統整合行為</p>
          </div>
        </div>

        {/* 開機自動啟動 Toggle */}
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-[13px] font-medium text-[#ededed]">開機時自動啟動</p>
            <p className="text-[12px] text-[#71717a] mt-0.5">登入 Windows 後自動在背景開啟 VAG</p>
          </div>
          <button
            id="toggle-login-item"
            onClick={() => handleToggleLoginItem(!openAtLogin)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
              openAtLogin ? 'bg-white' : 'bg-[#262626]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full transition-transform duration-200 ${
                openAtLogin ? 'translate-x-6 bg-black' : 'translate-x-1 bg-[#71717a]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* ===== 關於 ===== */}
      <div className="bg-[#ffffff02] border border-[#ffffff0a] rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold text-[#a1a1aa]">VAG — Valorant Auto-Login</p>
            {appVersion && (
              <p className="text-[11px] text-[#52525b] font-mono mt-1">v{appVersion}</p>
            )}
          </div>
          <a
            href="https://github.com/Ten1613/VAG/releases"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-[#52525b] hover:text-[#a3a3a3] transition-colors"
            onClick={(e) => { e.preventDefault(); window.electronAPI && window.open?.('https://github.com/Ten1613/VAG/releases') }}
          >
            Releases →
          </a>
        </div>
      </div>

    </div>
  )
}

export default SettingsPage
