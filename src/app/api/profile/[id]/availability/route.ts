import { NextRequest } from 'next/server';
import { profileOperations } from '@/lib/dbOperations';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Verify that the user is authenticated and is the profile owner
    // (This would typically be done in middleware, but for simplicity we'll assume it's handled elsewhere)

    const { is_available } = await request.json();

    if (typeof is_available !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Invalid availability value. Expected boolean.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert boolean to integer for SQLite (0 or 1)
    const availabilityValue = is_available ? 1 : 0;

    // Update the profile availability
    const updatedProfile = profileOperations.update(id, { is_available: availabilityValue });

    if (!updatedProfile) {
      return new Response(JSON.stringify({ error: 'Failed to update profile availability.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      profile: updatedProfile
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating profile availability:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}