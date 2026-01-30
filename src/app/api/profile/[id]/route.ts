// src/app/api/profile/[id]/route.ts
import { NextRequest } from 'next/server';
import { updateUserProfile } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id;
    const profileData = await request.json();
    
    // Verify that the user is authorized to update this profile
    // (In a real app, you'd check the auth token here)
    
    const updatedProfile = await updateUserProfile(userId, profileData);
    
    return Response.json({ profile: updatedProfile });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}