'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { verifyToken } from '@/lib/auth';
import { appointmentOperations } from '@/lib/dbOperations';

export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: 'approved' | 'cancelled' | 'completed'
) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  const decodedToken = verifyToken(token as string);

  if (!decodedToken) {
    return { error: 'You must be logged in to perform this action.' };
  }

  try {
    const data = appointmentOperations.update(appointmentId, { status: newStatus });
    revalidatePath('/appointments');
    return { data };
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return { error: 'Database error: Could not update appointment status.' };
  }
}

export async function updateAppointmentDetails(
  appointmentId: string,
  details: {
    diagnosis?: string;
    prescription?: string;
    vet_comments?: string;
    appointment_datetime?: string;
  }
) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  const decodedToken = verifyToken(token as string);

  if (!decodedToken) {
    return { error: 'You must be logged in to perform this action.' };
  }

  try {
    const data = appointmentOperations.update(appointmentId, details);
    revalidatePath('/appointments');
    return { data };
  } catch (error) {
    console.error('Error updating appointment details:', error);
    return { error: 'Database error: Could not update appointment details.' };
  }
}
