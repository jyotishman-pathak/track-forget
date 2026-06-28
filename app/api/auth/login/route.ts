import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

export async function POST(request: Request) {
  const { password } = await request.json();

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
  }

  if (password !== adminPassword) {
    // Small delay to prevent brute force
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  // Create a deterministic token from the password (never store the password itself)
  const tokenHash = createHash('sha256')
    .update(adminPassword + process.env.AUTH_SALT)
    .digest('hex');

  const response = NextResponse.json({ ok: true });

  response.cookies.set('tf_auth', tokenHash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return response;
}
