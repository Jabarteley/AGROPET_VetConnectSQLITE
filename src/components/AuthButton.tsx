import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken, getUserById } from '@/lib/auth'

export default async function AuthButton() {
  const cookieStore = cookies()
  const token = cookieStore.get('auth-token')?.value
  const decodedToken = token ? verifyToken(token) : null

  let user = null;
  if (decodedToken) {
    user = getUserById(decodedToken.userId);
  }

  const signOut = async () => {
    'use server'

    // Clear the auth token cookie
    cookies().delete('auth-token')
    return redirect('/login')
  }

  return user ? (
    <div className="flex items-center gap-4">
      Hey, {user.email}!
      <form action={signOut}>
        <button className="py-2 px-4 rounded-md no-underline bg-btn-background hover:bg-btn-background-hover">
          Logout
        </button>
      </form>
    </div>
  ) : (
    <Link
      href="/login"
      className="py-2 px-3 flex rounded-md no-underline bg-btn-background hover:bg-btn-background-hover"
    >
      Login
    </Link>
  )
}
