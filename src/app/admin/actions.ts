'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { verifyToken, getUserById } from '@/lib/auth';
import { profileOperations } from '@/lib/dbOperations';

async function verifyAdmin() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  const decodedToken = verifyToken(token as string);

  if (!decodedToken) {
    return { error: 'You must be logged in to perform this action.' };
  }

  const user = getUserById(decodedToken.userId);
  if (!user) {
    return { error: 'You must be logged in to perform this action.' };
  }

  const profile = profileOperations.getById(user.id);
  if (!profile || profile.role !== 'admin') {
    return { error: 'Unauthorized: Only administrators can perform this action.' };
  }

  return { user, profile };
}

export async function suspendUser(userId: string) {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) {
    return { error: adminCheck.error };
  }

  try {
    const data = profileOperations.update(userId, { role: 'suspended' });
    revalidatePath('/admin');
    return { data };
  } catch (error) {
    console.error('Error suspending user:', error);
    return { error: 'Database error: Could not suspend user.' };
  }
}

export async function activateUser(userId: string) {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) {
    return { error: adminCheck.error };
  }

  try {
    const data = profileOperations.update(userId, { role: 'farmer_pet_owner' });
    revalidatePath('/admin');
    return { data };
  } catch (error) {
    console.error('Error activating user:', error);
    return { error: 'Database error: Could not activate user.' };
  }
}

export async function updateVetVerificationStatus(vetId: string, status: 'verified' | 'rejected') {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) {
    return { error: adminCheck.error };
  }

  try {
    const data = profileOperations.update(vetId, { verification_status: status });
    revalidatePath('/admin');
    return { data };
  } catch (error) {
    console.error('Error updating vet verification status:', error);
    return { error: 'Database error: Could not update veterinarian status.' };
  }
}