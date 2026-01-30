
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import { cookies } from 'next/headers';
import { verifyToken, getUserById } from '@/lib/auth';
import { profileOperations } from '@/lib/dbOperations';

export default async function NavBar() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  const decodedToken = verifyToken(token as string);

  let user = null;
  let profile = null;

  if (decodedToken) {
    user = getUserById(decodedToken.userId);
    if (user) {
      profile = profileOperations.getById(user.id);
    }
  }

  let userRole = profile?.role;

  return (
    <nav className="w-full bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-4 items-center">
            {/* Logo / Home Link */}
            <Link href="/" className="font-bold text-xl text-indigo-600">
              AGROPET
            </Link>

            {/* Public Nav */}
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/veterinarians" className="py-2 px-3 text-gray-700 hover:text-indigo-600 rounded">
                Find a Vet
              </Link>
            </div>

            {/* Primary Nav (Authenticated Users) */}
            {user && (
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/appointments" className="py-2 px-3 text-gray-700 hover:text-indigo-600 rounded">
                  Appointments
                </Link>
                <Link href="/messages" className="py-2 px-3 text-gray-700 hover:text-indigo-600 rounded">
                  Messages
                </Link>
              </div>
            )}
          </div>

          {/* Secondary Nav & Auth */}
          <div className="flex items-center space-x-3">
            {user && userRole === 'admin' && (
              <Link href="/admin" className="py-2 px-3 text-sm font-semibold text-red-600 hover:text-red-800 rounded">
                Admin
              </Link>
            )}
            {user && (
              <Link href="/profile" className="py-2 px-3 hidden sm:block text-gray-700 hover:text-indigo-600 rounded">
                My Profile
              </Link>
            )}
            {user ? (
              <LogoutButton />
            ) : (
              <Link href="/login" className="py-2 px-3 text-gray-700 hover:text-indigo-600 rounded">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
