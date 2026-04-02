/**
 * 智慧型自動登入模組
 * 使用 nut.js 進行視窗偵測與鍵盤模擬
 *
 * 流程：
 * 1. 啟動 Riot Client
 * 2. 輪詢偵測視窗是否已完全載入
 * 3. 自動輸入帳號密碼
 */
import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import { clipboard } from 'electron'

const execAsync = promisify(exec)
import { keyboard, Key, getActiveWindow, getWindows, mouse, Point } from '@nut-tree-fork/nut-js'

// 設定鍵盤輸入延遲（毫秒），避免輸入太快導致遺漏
keyboard.config.autoDelayMs = 10

// 輪詢設定
const POLL_INTERVAL = 500 // 每 500ms 檢查一次視窗
const MAX_WAIT_TIME = 60000 // 最多等待 60 秒
const UI_RENDER_DELAY = 3000 // 【加長】給予 3 秒讓 Riot Client 的表單有更充裕的時間完全載入完成

// 狀態控制旗標
let isCancelled = false

/**
 * 強制取消當前正在進行的登入程序
 */
export function cancelAutoLogin() {
  isCancelled = true
}

/**
 * 執行自動登入
 * @param {string} riotPath - RiotClientServices.exe 的完整路徑
 * @param {string} username - 帳號
 * @param {string} password - 密碼（明文）
 * @param {BrowserWindow} mainWindow - Electron 主視窗（用於傳送狀態更新）
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function performAutoLogin(riotPath, username, password, mainWindow) {
  isCancelled = false // 每次開始登入時重置取消狀態
  try {
    // === 第一步：啟動 Riot Client ===
    sendStatus(mainWindow, '正在啟動 Riot Client...')

    const riotProcess = spawn(riotPath, ['--launch-product=valorant', '--launch-patchline=live'], {
      detached: true,
      stdio: 'ignore'
    })

    // 分離子程序，讓 Riot Client 獨立於本程式運行
    riotProcess.unref()

    riotProcess.on('error', (err) => {
      console.error('[自動登入] 啟動 Riot Client 失敗：', err.message)
    })

    // === 第二步：輪詢偵測 Riot Client 視窗 ===
    sendStatus(mainWindow, '等待 Riot Client 視窗出現...')

    const windowDetected = await waitForRiotWindow(mainWindow)
    if (isCancelled) {
      return { success: false, message: '自動登入已經由使用者手動取消。' }
    }

    if (!windowDetected) {
      return {
        success: false,
        message: '逾時：未偵測到 Riot Client 視窗（已等待 60 秒）'
      }
    }

    // === 第三步：等待 UI 渲染完成 ===
    sendStatus(mainWindow, '視窗已偵測到，等待 UI 載入完成...')
    // 改為分段等待以便隨時響應取消
    for (let i = 0; i < UI_RENDER_DELAY; i += 500) {
      if (isCancelled) return { success: false, message: '自動登入已經由使用者手動取消。' }
      await sleep(500)
    }

    if (isCancelled) return { success: false, message: '自動登入已經由使用者手動取消。' }

    // === 第四步：確保再次聚焦視窗並模擬鍵盤操作 ===
    sendStatus(mainWindow, '確保 Riot Client 為當前焦點...')
    await focusRiotWindow() // 貼上前強制再聚焦一次，防止等待期間使用者點到別的視窗
    await sleep(500)

    if (isCancelled) return { success: false, message: '自動登入已經由使用者手動取消。' }
    sendStatus(mainWindow, '正在透過剪貼簿貼上帳號...')

    // 備份原先使用者的剪貼簿內容
    const originalClipboard = clipboard.readText() || ''

    // 建立一個先全選再貼上的輔助函式
    const selectAllAndPaste = async (text) => {
      clipboard.writeText(text)
      await sleep(100) // 確保剪貼簿寫入完成

      // 全選 (Ctrl + A)
      await keyboard.pressKey(Key.LeftControl)
      await keyboard.pressKey(Key.A)
      await keyboard.releaseKey(Key.A)
      await keyboard.releaseKey(Key.LeftControl)

      // 貼上 (Ctrl + V)
      await keyboard.pressKey(Key.LeftControl)
      await keyboard.pressKey(Key.V)
      await keyboard.releaseKey(Key.V)
      await keyboard.releaseKey(Key.LeftControl)
    }

    // 1. 全選並貼上帳號
    await selectAllAndPaste(username)

    // 2. 按 Tab 切換到密碼欄位（帳號輸入完成後不再延遲）
    sendStatus(mainWindow, '切換至密碼欄位...')
    await keyboard.pressKey(Key.Tab)
    await keyboard.releaseKey(Key.Tab)

    // 3. 全選並貼上密碼
    sendStatus(mainWindow, '正在貼上密碼...')
    await selectAllAndPaste(password)

    // 4. 按 Enter 送出登入
    await keyboard.pressKey(Key.Enter)
    await keyboard.releaseKey(Key.Enter)

    // 延遲一段時間後復原使用者的剪貼簿 (避免剛貼上就被覆蓋)
    setTimeout(() => {
      clipboard.writeText(originalClipboard)
    }, 1500)

    sendStatus(mainWindow, '登入指令已送出！')

    return {
      success: true,
      message: '自動登入完成！帳號密碼已成功輸入。'
    }
  } catch (error) {
    console.error('[自動登入] 發生錯誤：', error)
    return {
      success: false,
      message: `自動登入失敗：${error.message}`
    }
  }
}

/**
 * 輪詢等待 Riot Client 視窗出現
 * 使用 nut.js 的 getActiveWindow() 檢查當前焦點視窗
 * @param {BrowserWindow} mainWindow - 用於傳送狀態更新
 * @returns {Promise<boolean>} 是否偵測到 Riot Client 視窗
 */
async function waitForRiotWindow(mainWindow) {
  const startTime = Date.now()
  let dotCount = 0

  while (Date.now() - startTime < MAX_WAIT_TIME) {
    if (isCancelled) return false

    // 搜索並嘗試強制聚焦 Riot Window
    const isFocused = await focusRiotWindow()
    if (isFocused) {
      return true
    }

    // 更新等待狀態的動畫
    dotCount = (dotCount + 1) % 4
    const dots = '.'.repeat(dotCount + 1)
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000)
    sendStatus(mainWindow, `等待 Riot Client 視窗出現${dots}（已等待 ${elapsedSec} 秒）`)

    await sleep(POLL_INTERVAL)
  }

  return false
}


/**
 * 搜尋所有視窗並將焦點強制放置於 Riot Client 上
 * @returns {Promise<boolean>} 是否成功找到並聚焦
 */
async function focusRiotWindow() {
  try {
    const windows = await getWindows()
    for (const win of windows) {
      const title = await win.title
      if (
        title &&
        (title.toLowerCase().includes('riot client') || title.toLowerCase().includes('riot games'))
      ) {
        console.log(`[視窗聚焦] 找到 Riot Client 視窗：「${title}」，強制拉至前景聚焦...`)

        // 策略 1：使用 nut.js 原生 API (但在部分 Windows 環境可能僅會閃爍工作列)
        try {
          await win.focus()
        } catch (e) {
          console.warn('[視窗聚焦] nut.js focus() 呼叫失敗', e)
        }

        // 策略 2：使用 PowerShell 的 COM 物件發送系統級的視窗喚醒指令
        try {
          const psCommand = `$wshell = New-Object -ComObject wscript.shell; $wshell.AppActivate('${title}')`
          await execAsync(`powershell -NoProfile -Command "${psCommand}"`)
        } catch (e) {
          console.warn('[視窗聚焦] PowerShell 喚醒失敗', e)
        }

        // 策略 3：物理點擊安全區域
        // 特殊處理：當 AppActivate 把 Riot Client 拉到前景時，如果在此期間使用者曾點擊了桌面其他位置，
        // CEF 瀏覽器內的焦點就會從預設的 Username 欄位消失！
        // 透過瞬間點選視窗內部安全區域（視窗最左上角或正中央），強迫 CEF 取回所有活動焦點（讓閃爍游標回來）。
        try {
          const region = await win.region
          if (region) {
            // 點擊 Riot Client 左上角 15px 的標題列安全區域（不會點到任何退出或切換按鈕）
            const safeX = region.left + 50
            const safeY = region.top + 15

            // 備份並瞬間找回原本的滑鼠
            const oldMousePos = await mouse.getPosition()
            await mouse.setPosition(new Point(safeX, safeY))
            await mouse.leftClick()
            await mouse.setPosition(oldMousePos) // 無縫恢復
          }
        } catch (e) {
          console.warn('[視窗聚焦] 物理還原焦點點擊失敗', e)
        }

        return true
      }
    }
  } catch (error) {
    // 忽略錯誤
  }
  return false
}

/**
 * 傳送狀態更新到前端
 * @param {BrowserWindow} mainWindow
 * @param {string} message
 */
function sendStatus(mainWindow, message) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('login-status', message)
  }
}

/**
 * 延遲工具函式
 * @param {number} ms - 延遲毫秒數
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
