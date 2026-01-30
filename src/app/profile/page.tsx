
import { redirect } from 'next/navigation';
import ProfileForm from '@/components/ProfileForm';
import { cookies } from 'next/headers';
import { verifyToken, getUserById } from '@/lib/auth';
import { profileOperations } from '@/lib/dbOperations';

export default async function ProfilePage() {
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

  type Profile = {
    id: string
    email: string
    role: 'farmer_pet_owner' | 'veterinarian' | 'admin'
    name: string | null
    location: string | null
    qualifications: string | null
    specialization: string | null
    service_regions: string | null
    verification_status: 'pending' | 'verified' | 'rejected'
    profile_photo: string | null
  } | null

  const rawProfile = profileOperations.getById(user.id);
  const profile = rawProfile as Profile;

  if (!profile) {
    // Profile doesn't exist yet, create a default one
    // Or handle appropriately
  }

  return (
    <div className="flex flex-col items-center p-4 w-full">
      <div className="w-full max-w-2xl px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center sm:text-left">User Profile</h1>
        <ProfileForm user={user} profile={profile} />
      </div>
    </div>
  );
}
