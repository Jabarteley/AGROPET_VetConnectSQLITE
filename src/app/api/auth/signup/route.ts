// src/app/api/auth/signup/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createUser, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();
    
    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }
    
    // Create the user
    const user = await createUser({
      email,
      password,
      name,
      role: role || 'farmer_pet_owner'
    });
    
    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email });
    
    // Set the token in a cookie
    cookies().set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
      sameSite: 'strict',
    });
    
    return Response.json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (error: any) {
    console.error('Signup error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}