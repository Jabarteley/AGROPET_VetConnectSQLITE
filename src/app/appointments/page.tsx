import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppointmentsList from '@/components/AppointmentsList';
import { verifyToken, getUserById } from '@/lib/auth';
import { appointmentOperations, profileOperations } from '@/lib/dbOperations';
import db from '@/lib/db';

export default async function AppointmentsPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  const decodedToken = verifyToken(token as string);

  if (!decodedToken) {
    return redirect('/login?redirectTo=/appointments');
  }

  const user = getUserById(decodedToken.userId);

  if (!user) {
    return redirect('/login?redirectTo=/appointments');
  }

  const profile = profileOperations.getById(user.id);

  const getWelcomeMessage = () => {
    if (profile) {
      if (profile.role === 'veterinarian') {
        return `Dr. ${profile.name || user.email}'s Appointment Dashboard`;
      }
      return `${profile.name || user.email}'s Appointments`;
    }
    return 'My Appointments';
  };

  const appointments = appointmentOperations.getByUserId(user.id);

  if (!appointments) {
    return <p className="p-4 text-center text-red-500">Could not fetch appointments.</p>;
  }

  const userIdSet = new Set(appointments.flatMap((appt: any) => [appt.user_id, appt.vet_id]));
  const userIds = Array.from(userIdSet);

  if (userIds.length === 0) {
    return (
      <div className="flex flex-col items-center p-4 w-full">
        <div className="w-full max-w-4xl px-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center sm:text-left">{getWelcomeMessage()}</h1>
          <AppointmentsList initialAppointments={[]} currentUser={{ id: user.id, role: profile?.role }} />
        </div>
      </div>
    );
  }

  const placeholders = userIds.map(() => '?').join(',');
  const profiles = db.prepare(`SELECT id, name, email, profile_photo FROM profiles WHERE id IN (${placeholders})`).all(...userIds);

  if (!profiles) {
    return <p className="p-4 text-center text-red-500">Could not fetch user profiles.</p>;
  }

  const profileMap = new Map(profiles.map((p: any) => [p.id, p.name || p.email]));
  const profilePhotoMap = new Map(profiles.map((p: any) => [p.id, p.profile_photo]));

  const enrichedAppointments = appointments.map((appt: any) => ({
    ...appt,
    client_name: profileMap.get(appt.user_id) || 'Unknown',
    vet_name: profileMap.get(appt.vet_id) || 'Unknown',
    client_photo: profilePhotoMap.get(appt.user_id),
    vet_photo: profilePhotoMap.get(appt.vet_id),
  }));

  return (
    <div className="flex flex-col items-center p-4 w-full">
      <div className="w-full max-w-4xl px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center sm:text-left">{getWelcomeMessage()}</h1>
        <AppointmentsList
          initialAppointments={enrichedAppointments}
          currentUser={{ id: user.id, role: profile?.role }}
        />
      </div>
    </div>
  );
}
