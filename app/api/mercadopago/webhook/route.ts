import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ ok: true, disabled: true })
}

export async function GET() {
  return NextResponse.json({ ok: true, disabled: true })
}
