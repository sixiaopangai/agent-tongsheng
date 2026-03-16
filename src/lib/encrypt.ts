import CryptoJS from 'crypto-js'

const KEY = process.env.TOKEN_ENCRYPT_KEY || 'default-key-change-me-in-prod!!'

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, KEY).toString()
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}
