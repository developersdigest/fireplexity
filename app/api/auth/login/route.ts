import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

const convex = new ConvexHttpClient(process.env.CONVEX_URL!)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await convex.query(api.auth.loginUser, {
      email,
      password,
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Invalid email or password' },
      { status: 401 }
    )
  }
}
