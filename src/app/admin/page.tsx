import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/AdminDashboard';
import { cookies } from 'next/headers';
import { verifyToken, getUserById } from '@/lib/auth';
import { profileOperations, appointmentOperations } from '@/lib/dbOperations';
import db from '@/lib/db';

export default async function AdminDashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  const decodedToken = verifyToken(token as string);

  if (!decodedToken) {
    return redirect('/login');
  }

  const user = getUserById(decodedToken.userId);

  if (!user) {
    return redirect('/login');
  }

  const profile = profileOperations.getById(user.id);

  if (!profile || profile.role !== 'admin') {
    console.warn('Non-admin user attempted to access admin dashboard.');
    return redirect('/');
  }

  const pendingVetsResult = profileOperations.getAll({ role: 'veterinarian', verification_status: 'pending' });
  if (!pendingVetsResult) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Could not fetch pending veterinarians.</p>
      </div>
    );
  }

  // Cast to the expected type for the AdminDashboard component
  const pendingVets = pendingVetsResult as VetProfile[];

  const allUsersResult = profileOperations.getAll();
  if (!allUsersResult) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Could not fetch users.</p>
      </div>
    );
  }

  // Cast to the expected type for the AdminDashboard component
  const allUsers = allUsersResult as UserProfile[];

  // Define the types that match the AdminDashboard component expectations
  type VetProfile = {
    id: string
    name: string | null
    email: string
    location: string | null
    specialization: string | null
    verification_status: string
  }

  type UserProfile = {
    id: string
    email: string
    role: string
    created_at: string
  }

  interface CountResult {
    count: number;
  }

  const totalAppointments = (db.prepare('SELECT COUNT(*) as count FROM appointments').get() as CountResult).count;
  const pendingAppointments = (db.prepare('SELECT COUNT(*) as count FROM appointments WHERE status = ?').get('pending') as CountResult).count;
  const completedAppointments = (db.prepare('SELECT COUNT(*) as count FROM appointments WHERE status = ?').get('completed') as CountResult).count;
  const cancelledAppointments = (db.prepare('SELECT COUNT(*) as count FROM appointments WHERE status = ?').get('cancelled') as CountResult).count;

  const appointmentStats = {
    total: totalAppointments || 0,
    pending: pendingAppointments || 0,
    completed: completedAppointments || 0,
    cancelled: cancelledAppointments || 0,
  };

  return (
    <div className="flex flex-col items-center p-4">
      <AdminDashboard pendingVets={pendingVets} allUsers={allUsers} appointmentStats={appointmentStats} />
    </div>
  );
}
