'use server';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenValue = cookieStore.get('token')?.value;

    if (!tokenValue) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(tokenValue, secret);

    return NextResponse.json({ 
      success: true,
      data: {
        user: payload
      }
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
} 