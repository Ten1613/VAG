/**
 * AccountCard.jsx — 特務卡片 (UI V4.0 Final)
 */
import { useState } from 'react'

function AccountCard({ account, onAutoLogin, onCopy, onDelete }) {
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleAutoLogin = async () => {
    setIsLoggingIn(true)
    try {
      await onAutoLogin(account)
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(account.id)
      setConfirmDelete(false)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  const tagColor = getTagColor(account.username)

  return (
    <div className="surface-card p-5 relative">
      
      {/* 頂部資訊區塊 */}
      <div className="flex flex-row items-center justify-between pb-4 border-b border-[#262626]">
        <div className="flex flex-row items-center gap-4">
          {/* 純淨簡約的圓形頭像 */}
          <div 
            className="flex-shrink-0 w-[40px] h-[40px] rounded-full flex items-center justify-center font-medium text-[15px] border border-white/10"
            style={{
              background: `linear-gradient(135deg, ${tagColor.from}, ${tagColor.to})`,
              color: '#ffffff',
            }}
          >
            {account.username.charAt(0).toUpperCase()}
          </div>

          <div className="flex flex-col min-w-0">
             <h3 className="text-[14px] font-semibold text-[#ffffff] truncate">
              {account.username}
             </h3>
             <div className="flex flex-row items-center gap-2 mt-0.5">
                {account.note ? (
                  <>
                     <div className="w-[6px] h-[6px] rounded-full border border-black/50" style={{ background: tagColor.from }}></div>
                     <span className="text-[12px] text-[#a3a3a3] truncate">{account.note}</span>
                  </>
                ) : (
                   <span className="text-[12px] text-[#52525b]">No tags</span>
                )}
             </div>
          </div>
        </div>

        {/* 右上角細緻操作鈕 */}
        <div className="flex flex-row items-center gap-2 text-[#a3a3a3]">
          <button
            onClick={() => onCopy(account)}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#262626] hover:text-[#ffffff] transition-colors"
            title="複製憑證"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          
          <button
            onClick={handleDelete}
            className={`flex items-center justify-center rounded-md transition-colors ${
              confirmDelete
                ? 'bg-red-500/20 text-red-500 px-3 h-8 text-[12px] font-medium'
                : 'w-8 h-8 hover:bg-red-500/10 hover:text-red-500'
            }`}
            title="移除帳號"
          >
             {confirmDelete ? (
              <span>Confirm</span>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 底部登入按鈕區塊 */}
      <div className="pt-4 flex flex-row">
        <button
          onClick={handleAutoLogin}
          disabled={isLoggingIn}
          className="btn-primary w-full"
        >
          {isLoggingIn ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                 <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="31.4 31.4" strokeLinecap="round" />
              </svg>
              <span>Connecting ...</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span>Login to Riot</span>
            </>
          )}
        </button>
      </div>
      
    </div>
  )
}

function getTagColor(name) {
  const colors = [
    { from: '#475569', to: '#1e293b' },
    { from: '#52525b', to: '#27272a' },
    { from: '#3b82f6', to: '#1d4ed8' },
    { from: '#8b5cf6', to: '#5b21b6' },
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default AccountCard
