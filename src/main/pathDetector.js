/**
 * Riot Client 路徑自動偵測模組
 * 支援常見安裝路徑掃描與 Windows 註冊表查詢
 */
import { existsSync } from 'fs'
import { execSync } from 'child_process'

// 常見的 Riot Client 安裝路徑
const COMMON_PATHS = [
  'C:\\Riot Games\\Riot Client\\RiotClientServices.exe',
  'D:\\Riot Games\\Riot Client\\RiotClientServices.exe',
  'E:\\Riot Games\\Riot Client\\RiotClientServices.exe',
  'F:\\Riot Games\\Riot Client\\RiotClientServices.exe',
  'C:\\Program Files\\Riot Games\\Riot Client\\RiotClientServices.exe',
  'C:\\Program Files (x86)\\Riot Games\\Riot Client\\RiotClientServices.exe',
  'D:\\Program Files\\Riot Games\\Riot Client\\RiotClientServices.exe'
]

// Windows 註冊表搜尋路徑
const REGISTRY_PATHS = [
  'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall'
]

/**
 * 自動偵測 Riot Client 安裝路徑
 * 優先：常見路徑掃描 → 註冊表查詢
 * @returns {string} 偵測到的路徑，找不到則回傳空字串
 */
export function detectRiotClientPath() {
  // 第一步：掃描常見安裝路徑
  for (const filePath of COMMON_PATHS) {
    if (existsSync(filePath)) {
      console.log(`[路徑偵測] 在常見路徑找到 Riot Client: ${filePath}`)
      return filePath
    }
  }

  // 第二步：透過 Windows 註冊表搜尋
  console.log('[路徑偵測] 常見路徑未找到，嘗試搜尋註冊表...')
  const registryPath = searchRegistry()
  if (registryPath) {
    console.log(`[路徑偵測] 在註冊表找到 Riot Client: ${registryPath}`)
    return registryPath
  }

  console.log('[路徑偵測] 未找到 Riot Client，請手動設定路徑')
  return ''
}

/**
 * 從 Windows 註冊表搜尋 Riot Client 安裝位置
 * @returns {string|null} 偵測到的路徑或 null
 */
function searchRegistry() {
  for (const regPath of REGISTRY_PATHS) {
    try {
      // 使用 reg query 搜尋所有子機碼
      const output = execSync(`reg query "${regPath}" /s /f "Riot" /k`, {
        encoding: 'utf8',
        timeout: 5000,
        windowsHide: true // 隱藏命令列視窗
      })

      // 從輸出中尋找 InstallLocation 值
      const lines = output.split('\n')
      for (const line of lines) {
        if (line.includes('InstallLocation') || line.includes('DisplayIcon')) {
          // 提取路徑值（REG_SZ 類型後面的值）
          const match = line.match(/REG_SZ\s+(.+)/i)
          if (match) {
            let installPath = match[1].trim()

            // 如果是 DisplayIcon，可能包含逗號後的圖示索引
            if (installPath.includes(',')) {
              installPath = installPath.split(',')[0]
            }

            // 嘗試找到 RiotClientServices.exe
            if (installPath.endsWith('RiotClientServices.exe') && existsSync(installPath)) {
              return installPath
            }

            // 如果是目錄，嘗試組合完整路徑
            const possibleExe = installPath.includes('RiotClientServices.exe')
              ? installPath
              : `${installPath}\\RiotClientServices.exe`

            if (existsSync(possibleExe)) {
              return possibleExe
            }

            // 嘗試在子目錄中尋找
            const riotClientPath = `${installPath}\\Riot Client\\RiotClientServices.exe`
            if (existsSync(riotClientPath)) {
              return riotClientPath
            }
          }
        }
      }
    } catch {
      // 此註冊表路徑查詢失敗，嘗試下一個
      continue
    }
  }
  return null
}
