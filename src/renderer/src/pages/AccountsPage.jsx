/**
 * AccountsPage.jsx — 帳號管理中心 (UI V4.0 Final)
 */
import { useState, useEffect } from 'react'
import AccountCard from '../components/AccountCard'
import AddAccountModal from '../components/AddAccountModal'

function AccountsPage({ showToast }) {
  const [accounts, setAccounts] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loginStatus, setLoginStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    if (!window.electronAPI?.onLoginStatus) return
    const unsubscribe = window.electronAPI.onLoginStatus((message) => {
      setLoginStatus(message)
    })
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [])

  const loadAccounts = async () => {
    try {
      setIsLoading(true)
      const result = await window.electronAPI?.getAccounts()
      if (result?.success) {
        setAccounts(result.data)
      }
    } catch (error) {
      showToast('載入失敗：' + error.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAccount = async (accountData) => {
    try {
      const result = await window.electronAPI?.addAccount(accountData)
      if (result?.success) {
        setAccounts((prev) => [...prev, result.data])
        showToast('已新增帳號')
      } else {
        showToast('新增失敗：' + result?.error, 'error')
      }
    } catch (error) {
      showToast('新增失敗：' + error.message, 'error')
    }
  }

  const handleAutoLogin = async (account) => {
    try {
      setLoginStatus('準備進行登入...')
      const result = await window.electronAPI?.autoLogin({
        username: account.username,
        password: account.password
      })

      if (result?.success) {
        showToast(result.message, 'success')
      } else {
        showToast(result?.message || '自動登入失敗', 'error')
      }
    } catch (error) {
      showToast('登入發生錯誤：' + error.message, 'error')
    } finally {
      setTimeout(() => setLoginStatus(''), 5000)
    }
  }

  const handleCopy = async (account) => {
    try {
      const result = await window.electronAPI?.copyAccount({
        username: account.username,
        password: account.password
      })
      if (result?.success) {
        showToast('已複製憑證')
      } else {
        showToast('複製失敗', 'error')
      }
    } catch (error) {
      showToast('複製異常：' + error.message, 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      const result = await window.electronAPI?.deleteAccount(id)
      if (result?.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== id))
        showToast('帳號已移除')
      } else {
        showToast('移除失敗：' + result?.error, 'error')
      }
    } catch (error) {
      showToast('移除異常：' + error.message, 'error')
    }
  }

  return (
    <div className="flex flex-col w-full h-full animate-fade-in relative">
      {/* ===== 頁首 ===== */}
      <div className="flex flex-row items-start justify-between pb-8">
        <div className="flex flex-col">
          <h2 className="text-[28px] font-semibold text-[#ffffff] tracking-tight leading-tight">
            Accounts
          </h2>
          <p className="text-[14px] text-[#a3a3a3] mt-2 font-medium">
            Manage your credentials and identities.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Account
        </button>
      </div>

      {/* ===== 通知區塊 ===== */}
      {loginStatus && (
        <div className="mb-6 py-3 px-4 rounded-xl border border-[#262626] bg-[#0a0a0a] flex flex-row items-center justify-between shadow-sm">
          <div className="flex flex-row items-center gap-3 min-w-0">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse shrink-0" />
            <p className="text-[13px] text-[#ededed] font-medium tracking-wide truncate">
              {loginStatus}
            </p>
          </div>
          
          {/* 取消按鈕 */}
          <button
            onClick={async () => {
              try {
                await window.electronAPI?.cancelLogin()
              } catch (e) {
                console.error(e)
              }
            }}
            className="flex flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-transparent hover:border-red-500/30 transition-all shrink-0 ml-4 focus:outline-none"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span className="text-[11px] font-bold uppercase tracking-wider">Cancel</span>
          </button>
        </div>
      )}

      {/* ===== 內容 ===== */}
      <div className="flex-1 w-full pb-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center pt-24 text-[#a3a3a3]">
            <svg className="animate-spin w-8 h-8 mb-4 opacity-70" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" />
            </svg>
            <p className="text-[14px] font-medium">載入中 / Loading...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-[#262626] rounded-2xl py-24 mt-2 bg-[#0a0a0a]">
            <div className="w-14 h-14 rounded-full bg-[#111111] border border-[#262626] flex items-center justify-center mb-5 text-[#52525b]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="text-[16px] font-semibold text-[#ffffff] mb-2">No accounts found</h3>
            <p className="text-[14px] text-[#a3a3a3] text-center max-w-sm">
              You haven't added any Riot accounts yet. Click New Account to begin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onAutoLogin={handleAutoLogin}
                onCopy={handleCopy}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <AddAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddAccount}
      />
    </div>
  )
}

export default AccountsPage
