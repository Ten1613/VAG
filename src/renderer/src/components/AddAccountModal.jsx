/**
 * AddAccountModal.jsx — 新增帳號 (UI V4.0 極簡版)
 * 專注於填寫效率與完美置中的極簡模態框
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'

function AddAccountModal({ isOpen, onClose, onAdd }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [note, setNote] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [showPasteMode, setShowPasteMode] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return

    setIsSubmitting(true)
    try {
      await onAdd({ username: username.trim(), password: password.trim(), note: note.trim() })
      setUsername('')
      setPassword('')
      setNote('')
      setPasteText('')
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasteInput = (text) => {
    setPasteText(text)
    let cleaned = text.replace(/```/g, '').trim()
    let parts = null

    if (cleaned.includes('\n')) {
      parts = cleaned.split('\n').map((s) => s.trim()).filter(Boolean)
    } else if (cleaned.includes('\t')) {
      parts = cleaned.split('\t').map((s) => s.trim()).filter(Boolean)
    } else if (cleaned.includes(':')) {
      parts = cleaned.split(':').map((s) => s.trim()).filter(Boolean)
    } else if (cleaned.includes(' ')) {
      const idx = cleaned.indexOf(' ')
      parts = [cleaned.substring(0, idx).trim(), cleaned.substring(idx + 1).trim()]
    }

    if (parts && parts.length >= 2) {
      setUsername(parts[0])
      setPassword(parts[1])
    }
  }

  const handleUsernamePaste = (e) => {
    const pasted = e.clipboardData.getData('text')
    const cleaned = pasted.replace(/```/g, '').trim()
    if (cleaned.includes('\n') || cleaned.includes('\t') || cleaned.includes(':') || cleaned.includes(' ')) {
      e.preventDefault()
      handlePasteInput(pasted)
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      resetAndClose()
    }
  }

  const resetAndClose = () => {
    setUsername('')
    setPassword('')
    setNote('')
    setPasteText('')
    setShowPasteMode(false)
    onClose()
  }

  return createPortal(
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        
        {/* ===== 標題列 ===== */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#ffffff10]">
          <div>
            <h2 className="text-[16px] font-semibold text-[#ededed]">Add Account</h2>
            <p className="text-[12px] text-[#71717a] mt-0.5">請輸入 Riot 憑證以儲存至資料庫</p>
          </div>
          <button
            onClick={resetAndClose}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#ffffff0a] text-[#71717a] hover:text-[#ededed] transition-colors outline-none"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ===== 模式切換 ===== */}
        <div className="flex gap-1 p-1 bg-[#ffffff05] rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setShowPasteMode(false)}
            className={`flex-1 text-[12px] py-2 rounded-lg font-medium transition-all ${
              !showPasteMode
                ? 'bg-[#ffffff10] text-[#ededed] shadow-sm'
                : 'text-[#71717a] hover:text-[#a1a1aa]'
            }`}
          >
            Manual Entry
          </button>
          <button
            type="button"
            onClick={() => setShowPasteMode(true)}
            className={`flex-1 text-[12px] py-2 rounded-lg font-medium transition-all ${
              showPasteMode
                ? 'bg-[#ffffff10] text-[#ededed] shadow-sm'
                : 'text-[#71717a] hover:text-[#a1a1aa]'
            }`}
          >
            Quick Paste
          </button>
        </div>

        {/* ===== 貼上模式 ===== */}
        {showPasteMode && (
          <div className="mb-6 animate-fade-in relative">
            <label className="block text-[12px] font-medium text-[#ededed] mb-2">
              Clipboard Analyzer
            </label>
            <textarea
              id="input-paste"
              value={pasteText}
              onChange={(e) => handlePasteInput(e.target.value)}
              placeholder="支援多種分隔格式，例如 帳號:密碼..."
              className="input-field min-h-[90px] resize-none"
              rows={3}
              autoFocus
            />
            {username && password && (
              <div className="mt-4 p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-[12px] flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span className="text-green-400 font-medium">Successfully Parsed</span>
                </div>
                <div className="grid grid-cols-[auto_1fr] pl-3.5 gap-x-4 gap-y-1">
                  <span className="text-[#a1a1aa]">ID</span>
                  <span className="text-[#ededed] font-medium">{username}</span>
                  <span className="text-[#a1a1aa]">Key</span>
                  <span className="text-[#ededed] font-mono">{'•'.repeat(Math.min(password.length, 12))}{password.length > 12 ? '...' : ''}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== 表單 ===== */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!showPasteMode && (
             <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#ededed] mb-1.5">
                  Username <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  id="input-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onPaste={handleUsernamePaste}
                  placeholder="Riot ID"
                  className="input-field"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#ededed] mb-1.5">
                  Password <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    id="input-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Security Key"
                    className="input-field pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded text-[#71717a] hover:text-[#ededed] transition-colors"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      {showPassword ? (
                        <>
                           <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                           <line x1="1" y1="1" x2="23" y2="23" />
                        </>
                      ) : (
                         <>
                           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                           <circle cx="12" cy="12" r="3" />
                         </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
             <label className="block text-[12px] font-medium text-[#ededed] mb-1.5">
              Tag <span className="text-[#71717a] font-normal ml-1">(Optional)</span>
            </label>
            <input
              id="input-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Main, Smurf..."
              className="input-field"
            />
          </div>

          <div className="flex gap-3 pt-6 mt-2">
            <button
              type="button"
              onClick={resetAndClose}
              className="btn-secondary"
              style={{ width: '80px', padding: '10px 0' }}
            >
              Cancel
            </button>
            <button
              id="btn-submit-account"
              type="submit"
              disabled={!username.trim() || !password.trim() || isSubmitting}
              className="btn-primary flex-1"
              style={{ padding: '10px 0' }}
            >
              {isSubmitting ? (
                 <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                 </svg>
              ) : 'Store Credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default AddAccountModal
