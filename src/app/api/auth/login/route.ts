import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  const state = uuidv4()
  const url = getAuthUrl(state)
  return NextResponse.redirect(url)
}
