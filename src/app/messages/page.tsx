import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifyToken, getUserById } from '@/lib/auth';
import db from '@/lib/db';

export default async function MessagesPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  const decodedToken = verifyToken(token as string);

  if (!decodedToken) {
    return redirect('/login?redirectTo=/messages');
  }

  const user = getUserById(decodedToken.userId);

  if (!user) {
    return redirect('/login?redirectTo=/messages');
  }

  const conversations = db
    .prepare(
      'SELECT * FROM conversations WHERE participant1_id = ? OR participant2_id = ? ORDER BY last_message_at DESC'
    )
    .all(user.id, user.id);

  if (!conversations) {
    return <p className="p-4 text-center text-red-500">Could not fetch conversations.</p>;
  }

  const otherParticipantIds = conversations.map((c: any) =>
    c.participant1_id === user.id ? c.participant2_id : c.participant1_id
  );

  if (otherParticipantIds.length === 0) {
    return (
      <div className="flex flex-col items-center p-4 w-full">
        <div className="w-full max-w-2xl">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">My Conversations</h1>
          <div className="space-y-4">
            <p className="text-center text-gray-500">You have no conversations.</p>
          </div>
        </div>
      </div>
    );
  }

  const placeholders = otherParticipantIds.map(() => '?').join(',');
  const profiles = db.prepare(`SELECT id, name, email FROM profiles WHERE id IN (${placeholders})`).all(...otherParticipantIds);

  if (!profiles) {
    return <p className="p-4 text-center text-red-500">Could not fetch user profiles.</p>;
  }

  const profileMap = new Map(profiles.map((p: any) => [p.id, p.name || p.email]));

  return (
    <div className="flex flex-col items-center p-4 w-full">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Conversations</h1>
        <div className="space-y-4">
          {conversations.length > 0 ? (
            conversations.map((convo: any) => {
              const otherId = convo.participant1_id === user.id ? convo.participant2_id : convo.participant1_id;
              const otherName = profileMap.get(otherId) || 'Unknown User';
              return (
                <Link
                  key={convo.id}
                  href={`/messages/${convo.id}`}
                  className="block p-4 bg-white rounded-lg shadow-md border hover:bg-gray-50"
                >
                  <h2 className="font-bold text-lg text-gray-800">Chat with {otherName}</h2>
                  <p className="text-sm text-gray-500">
                    Last message: {new Date(convo.last_message_at).toLocaleString()}
                  </p>
                </Link>
              );
            })
          ) : (
            <p className="text-center text-gray-500">You have no conversations.</p>
          )}
        </div>
      </div>
    </div>
  );
}
