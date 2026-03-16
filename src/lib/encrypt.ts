import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'

let _key: Buffer | null = null
function getKey(): Buffer {
  if (!_key) {
    _key = crypto.scryptSync(process.env.TOKEN_ENCRYPT_KEY || 'default-key-change-me-in-prod!!', 'salt', 32)
  }
  return _key
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

export function decrypt(ciphertext: string): string {
  const [ivHex, encrypted] = ciphertext.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
