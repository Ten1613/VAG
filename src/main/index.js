/**
 * Valorant 自動登入器 — Electron Main Process
 * 負責視窗建立、IPC 通訊、以及整合所有後端模組
 */
import { app, shell, BrowserWindow, ipcMain, dialog, clipboard } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getAccounts, addAccount, deleteAccount, getConfig, saveConfig } from './store'
import { detectRiotClientPath } from './pathDetector'
import { performAutoLogin, cancelAutoLogin } from './autoLogin'
import { decrypt } from './crypto'
import { existsSync } from 'fs'
import { exec } from 'child_process'
import { autoUpdater } from 'electron-updater'

let mainWindow = null

function createWindow() {
  // 建立無框視窗，實現自定義標題欄的電競風格介面
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false, // 無框視窗
    transparent: false,
    backgroundColor: '#0a0a0f',
    autoHideMenuBar: true,
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 根據開發或生產環境載入對應的 URL
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ==================== 註冊所有 IPC Handlers ====================

function registerIpcHandlers() {
  // --- 視窗控制 ---
  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.on('window-close', () => {
    mainWindow?.close()
  })

  // --- 應用程式版本 ---
  ipcMain.handle('get-version', () => {
    return app.getVersion()
  })

  // --- 開機自動啟動 ---
  ipcMain.handle('get-login-item', () => {
    const settings = app.getLoginItemSettings()
    return { openAtLogin: settings.openAtLogin }
  })

  ipcMain.handle('set-login-item', (_event, { openAtLogin }) => {
    app.setLoginItemSettings({
      openAtLogin,
      path: process.execPath
    })
    return { success: true }
  })

  // --- 桌面捷徑 ---
  ipcMain.handle('desktop-shortcut-exists', () => {
    const desktopPath = app.getPath('desktop')
    const shortcutPath = join(desktopPath, 'VAG.lnk')
    return existsSync(shortcutPath)
  })

  ipcMain.handle('set-desktop-shortcut', (_event, { create }) => {
    return new Promise((resolve) => {
      const desktopPath = app.getPath('desktop')
      const shortcutPath = join(desktopPath, 'VAG.lnk')
      const targetPath = process.execPath
      const workDir = join(targetPath, '..')

      if (create) {
        // 使用 PowerShell 建立 .lnk 捷徑
        const ps = [
          `$s = (New-Object -ComObject WScript.Shell).CreateShortcut('${shortcutPath.replace(/'/g, "''")}')`,
          `$s.TargetPath = '${targetPath.replace(/'/g, "''")}'`,
          `$s.WorkingDirectory = '${workDir.replace(/'/g, "''")}'`,
          `$s.Description = 'VAG - Valorant Auto-Login'`,
          `$s.Save()`
        ].join('; ')

        exec(`powershell -NoProfile -Command "${ps}"`, (err) => {
          resolve({ success: !err, error: err?.message })
        })
      } else {
        // 刪除捷徑
        const ps = `if (Test-Path '${shortcutPath.replace(/'/g, "''")}') { Remove-Item '${shortcutPath.replace(/'/g, "''")}' }`
        exec(`powershell -NoProfile -Command "${ps}"`, (err) => {
          resolve({ success: !err, error: err?.message })
        })
      }
    })
  })

  // --- 帳號管理 ---
  ipcMain.handle('get-accounts', () => {
    try {
      return { success: true, data: getAccounts() }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('add-account', (_event, accountData) => {
    try {
      const newAccount = addAccount(accountData)
      return { success: true, data: newAccount }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('delete-account', (_event, id) => {
    try {
      const result = deleteAccount(id)
      return { success: result, error: result ? null : '找不到該帳號' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // --- 自動登入 ---
  ipcMain.handle('auto-login', async (_event, { username, password }) => {
    try {
      const config = getConfig()
      if (!config.riotClientPath || !existsSync(config.riotClientPath)) {
        return {
          success: false,
          message: '找不到 Riot Client 執行檔，請先至「系統設定」中設定正確的路徑。'
        }
      }

      const result = await performAutoLogin(config.riotClientPath, username, password, mainWindow)
      return result
    } catch (error) {
      return { success: false, message: `自動登入失敗：${error.message}` }
    }
  })

  ipcMain.handle('cancel-login', () => {
    try {
      cancelAutoLogin()
      return { success: true }
    } catch (error) {
      return { success: false, message: `取消失敗：${error.message}` }
    }
  })

  // --- 帳號複製（嚴格遵守指定格式） ---
  ipcMain.handle('copy-account', (_event, { username, password }) => {
    try {
      // 格式：```帳號```\n```密碼```
      const formattedText = `\`\`\`${username}\`\`\`\n\`\`\`${password}\`\`\``
      clipboard.writeText(formattedText)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // --- 系統設定 ---
  ipcMain.handle('get-config', () => {
    try {
      return { success: true, data: getConfig() }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('save-config', (_event, config) => {
    try {
      saveConfig(config)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // --- 路徑偵測 ---
  ipcMain.handle('detect-riot-path', () => {
    try {
      const detectedPath = detectRiotClientPath()
      return { success: true, path: detectedPath }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // --- 選擇檔案 ---
  ipcMain.handle('select-file', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: '選擇 RiotClientServices.exe',
        filters: [{ name: '執行檔', extensions: ['exe'] }],
        properties: ['openFile']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: '已取消選擇' }
      }

      return { success: true, path: result.filePaths[0] }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
}

// ==================== 自動更新處理 ====================
function setupAutoUpdater() {
  // 設定不自動下載，我們將在前端提示使用者後由使用者觸發下載
  autoUpdater.autoDownload = false

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('updater:update-available', info)
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('updater:update-not-available')
  })

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('updater:download-progress', progressObj)
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('updater:update-downloaded')
  })

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('updater:error', err.message)
  })

  ipcMain.on('updater:check', () => {
    autoUpdater.checkForUpdates()
  })

  ipcMain.on('updater:download', () => {
    autoUpdater.downloadUpdate()
  })

  ipcMain.on('updater:install', () => {
    autoUpdater.quitAndInstall()
  })
}

// ==================== 應用程式生命週期 ====================

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.valorant-auto-login')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 註冊 IPC 處理器
  registerIpcHandlers()

  // 建立主視窗
  createWindow()

  // 註冊與啟動自動更新服務
  setupAutoUpdater()
  setTimeout(async () => {
    try {
      console.log('[AutoUpdater] 開始檢查更新...')
      await autoUpdater.checkForUpdates()
    } catch (err) {
      console.error('[AutoUpdater] 檢查更新失敗：', err.message)
      // 將錯誤傳送到前端以便除錯
      mainWindow?.webContents.send('updater:error', err.message)
    }
  }, 3000) // 延遲 3 秒後檢查更新，避免拖慢視窗啟動

  // 初次啟動時自動偵測 Riot Client 路徑
  const config = getConfig()
  if (!config.riotClientPath) {
    const detectedPath = detectRiotClientPath()
    if (detectedPath) {
      saveConfig({ ...config, riotClientPath: detectedPath })
      console.log(`[初始化] 已自動偵測 Riot Client 路徑：${detectedPath}`)
    }
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
