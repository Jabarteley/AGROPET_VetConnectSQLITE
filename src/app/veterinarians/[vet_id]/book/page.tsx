import { redirect } from 'next/navigation';
import BookingForm from '@/components/BookingForm';
import { cookies } from 'next/headers';
import { verifyToken, getUserById } from '@/lib/auth';
import { profileOperations } from '@/lib/dbOperations';

export default async function BookingPage({ params }: { params: { vet_id: string } }) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  const decodedToken = verifyToken(token as string);

  if (!decodedToken) {
    return redirect(`/login?redirectTo=/veterinarians/${params.vet_id}/book`);
  }

  const user = getUserById(decodedToken.userId);

  if (!user) {
    return redirect(`/login?redirectTo=/veterinarians/${params.vet_id}/book`);
  }

  // Decode the vet_id parameter in case it's URL-encoded
  const decodedVetId = decodeURIComponent(params.vet_id);
  const rawVet = profileOperations.getById(decodedVetId);

  type VetProfile = {
    id: string
    name: string | null
  }

  const vet = rawVet as VetProfile;

  if (!vet || rawVet?.role !== 'veterinarian') {
    return (
      <div className="p-4 text-center">
        <p>Veterinarian not found or an error occurred.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Book an Appointment</h1>
        <p className="text-lg text-gray-600 mb-8">
          With <span className="font-semibold">{vet.name}</span>
        </p>
        <BookingForm user={user} vet={vet} />
      </div>
    </div>
  );
}
