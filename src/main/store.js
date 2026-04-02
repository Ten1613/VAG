/**
 * 本地資料儲存模組
 * 管理 account.json（帳號資料）與 config.json（系統設定）
 */
import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { encrypt, decrypt } from './crypto'

// 取得應用程式的使用者資料目錄（例如 %APPDATA%/valorant-auto-login）
const USER_DATA_PATH = app.getPath('userData')

// 確保資料目錄存在
if (!existsSync(USER_DATA_PATH)) {
  mkdirSync(USER_DATA_PATH, { recursive: true })
}

const ACCOUNTS_FILE = join(USER_DATA_PATH, 'accounts.json')
const CONFIG_FILE = join(USER_DATA_PATH, 'config.json')

// ==================== 帳號管理 ====================

/**
 * 讀取所有帳號（密碼會自動解密為明文再傳給前端做顯示判斷）
 * @returns {Array} 帳號陣列
 */
export function getAccounts() {
  try {
    if (!existsSync(ACCOUNTS_FILE)) return []
    const data = JSON.parse(readFileSync(ACCOUNTS_FILE, 'utf8'))
    // 解密每個帳號的密碼欄位
    return data.map((account) => ({
      ...account,
      password: decrypt(account.password)
    }))
  } catch (error) {
    console.error('讀取帳號資料失敗：', error.message)
    return []
  }
}

/**
 * 新增帳號（密碼自動加密後儲存）
 * @param {Object} account - { username, password, note }
 * @returns {Object} 新增的帳號物件（含 id）
 */
export function addAccount({ username, password, note }) {
  const accounts = getAccountsRaw()
  const newAccount = {
    id: Date.now().toString(),
    username,
    password: encrypt(password), // 加密密碼
    note: note || '',
    createdAt: new Date().toISOString()
  }
  accounts.push(newAccount)
  writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf8')

  // 回傳解密版給前端
  return { ...newAccount, password }
}

/**
 * 刪除帳號
 * @param {string} id - 帳號 ID
 * @returns {boolean} 是否成功刪除
 */
export function deleteAccount(id) {
  let accounts = getAccountsRaw()
  const originalLength = accounts.length
  accounts = accounts.filter((a) => a.id !== id)
  if (accounts.length === originalLength) return false

  writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf8')
  return true
}

/**
 * 讀取原始帳號資料（密碼保持加密）
 * @returns {Array} 原始帳號陣列
 */
function getAccountsRaw() {
  try {
    if (!existsSync(ACCOUNTS_FILE)) return []
    return JSON.parse(readFileSync(ACCOUNTS_FILE, 'utf8'))
  } catch {
    return []
  }
}

// ==================== 系統設定 ====================

/**
 * 讀取系統設定
 * @returns {Object} 設定物件
 */
export function getConfig() {
  try {
    if (!existsSync(CONFIG_FILE)) return { riotClientPath: '' }
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf8'))
  } catch {
    return { riotClientPath: '' }
  }
}

/**
 * 儲存系統設定
 * @param {Object} config - 設定物件
 */
export function saveConfig(config) {
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8')
}
