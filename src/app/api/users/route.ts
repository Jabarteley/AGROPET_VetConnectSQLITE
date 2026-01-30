import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, getUserById } from '@/lib/auth'; // Adjust the path as needed
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    const decodedToken = verifyToken(token as string);

    if (!decodedToken) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = getUserById(decodedToken.userId);

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get email from query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return Response.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    // Query the profiles table for the user with the given email
    const profile = db
      .prepare('SELECT id, name, email FROM profiles WHERE email = ?')
      .get(email);

    if (!profile) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json(profile, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}