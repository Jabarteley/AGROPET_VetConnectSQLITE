// src/app/api/appointments/[id]/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, getUserById } from '@/lib/auth';
import { appointmentOperations } from '@/lib/dbOperations';

// GET handler for fetching a single appointment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    const decodedToken = verifyToken(token as string);

    if (!decodedToken) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = getUserById(decodedToken.userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 401 });
    }

    // Get the appointment
    const appointment = appointmentOperations.getById(params.id);

    if (!appointment) {
      return Response.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Verify that the user has permission to view this appointment
    if (appointment.user_id !== user.id && appointment.vet_id !== user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return Response.json({ appointment });
  } catch (error: any) {
    console.error('Error fetching appointment:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT handler for updating an appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    const decodedToken = verifyToken(token as string);

    if (!decodedToken) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = getUserById(decodedToken.userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 401 });
    }

    const updateData = await request.json();

    // Get the appointment to verify ownership
    const appointment = appointmentOperations.getById(params.id);

    if (!appointment) {
      return Response.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Verify that the authenticated user is the veterinarian for this appointment
    if (appointment.vet_id !== user.id) {
      return Response.json({ error: 'Unauthorized - Only the assigned veterinarian can update this appointment' }, { status: 403 });
    }

    // Update the appointment with the provided data
    const updatedAppointment = appointmentOperations.update(params.id, updateData);

    return Response.json({ appointment: updatedAppointment });
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}