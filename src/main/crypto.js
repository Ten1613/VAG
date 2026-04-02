/**
 * AES-256-CBC 加解密模組
 * 用於安全儲存帳號密碼至本地檔案
 */
import crypto from 'crypto'

// 加密演算法與金鑰設定
const ALGORITHM = 'aes-256-cbc'
// 32 bytes = 256 bits 金鑰（本地應用專用，非銀行級別安全）
const SECRET_KEY = crypto.scryptSync('valorant-auto-login-v26-secret', 'salt-key', 32)

/**
 * 加密明文字串
 * @param {string} text - 要加密的明文
 * @returns {string} 加密後的字串（格式：iv:encrypted，Base64 編碼）
 */
export function encrypt(text) {
  // 產生隨機初始化向量（16 bytes）
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv)

  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  // 以 "iv:密文" 的格式儲存，方便解密時取回 IV
  return `${iv.toString('base64')}:${encrypted}`
}

/**
 * 解密加密字串
 * @param {string} encryptedText - 加密後的字串（格式：iv:encrypted）
 * @returns {string} 解密後的明文
 */
export function decrypt(encryptedText) {
  const [ivBase64, encrypted] = encryptedText.split(':')
  const iv = Buffer.from(ivBase64, 'base64')
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv)

  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
