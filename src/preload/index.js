/**
 * Preload Script — ContextBridge
 * 安全地暴露 Electron API 給 React 前端
 * 前端透過 window.electronAPI 存取所有功能
 */
import { contextBridge, ipcRenderer } from 'electron'

// 定義所有暴露給前端的 API
const electronAPI = {
  // === 視窗控制 ===
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),

  // === 應用程式資訊 ===
  getVersion: () => ipcRenderer.invoke('get-version'),

  // === 帳號管理 ===
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  addAccount: (accountData) => ipcRenderer.invoke('add-account', accountData),
  deleteAccount: (id) => ipcRenderer.invoke('delete-account', id),

  // === 自動登入 ===
  autoLogin: (credentials) => ipcRenderer.invoke('auto-login', credentials),
  cancelLogin: () => ipcRenderer.invoke('cancel-login'),
  onLoginStatus: (callback) => {
    const handler = (_event, message) => callback(message)
    ipcRenderer.on('login-status', handler)
    // 回傳取消訂閱的函式
    return () => ipcRenderer.removeListener('login-status', handler)
  },

  // === 帳號複製 ===
  copyAccount: (accountData) => ipcRenderer.invoke('copy-account', accountData),

  // === 系統設定 ===
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),

  // === 路徑偵測 ===
  // --- 選擇檔案 ---
  detectRiotPath: () => ipcRenderer.invoke('detect-riot-path'),
  selectFile: () => ipcRenderer.invoke('select-file'),

  // === 自動更新器 ===
  updater: {
    check: () => ipcRenderer.send('updater:check'),
    download: () => ipcRenderer.send('updater:download'),
    install: () => ipcRenderer.send('updater:install'),
    onUpdateAvailable: (callback) => {
      const handler = (_event, info) => callback(info)
      ipcRenderer.on('updater:update-available', handler)
      return () => ipcRenderer.removeListener('updater:update-available', handler)
    },
    onUpdateNotAvailable: (callback) => {
      const handler = () => callback()
      ipcRenderer.on('updater:update-not-available', handler)
      return () => ipcRenderer.removeListener('updater:update-not-available', handler)
    },
    onDownloadProgress: (callback) => {
      const handler = (_event, progressObj) => callback(progressObj)
      ipcRenderer.on('updater:download-progress', handler)
      return () => ipcRenderer.removeListener('updater:download-progress', handler)
    },
    onUpdateDownloaded: (callback) => {
      const handler = () => callback()
      ipcRenderer.on('updater:update-downloaded', handler)
      return () => ipcRenderer.removeListener('updater:update-downloaded', handler)
    },
    onError: (callback) => {
      const handler = (_event, error) => callback(error)
      ipcRenderer.on('updater:error', handler)
      return () => ipcRenderer.removeListener('updater:error', handler)
    }
  }
}

// 使用 contextBridge 安全暴露 API
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI)
  } catch (error) {
    console.error('ContextBridge 暴露 API 失敗：', error)
  }
} else {
  window.electronAPI = electronAPI
}
