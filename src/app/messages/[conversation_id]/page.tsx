import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ChatRoom from '@/components/ChatRoom';
import { verifyToken, getUserById } from '@/lib/auth';
import { profileOperations } from '@/lib/dbOperations';
import db from '@/lib/db';

export default async function ConversationPage({ params }: { params: { conversation_id: string } }) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  const decodedToken = verifyToken(token as string);
  const conversationId = params.conversation_id;

  if (!decodedToken) {
    return redirect(`/login?redirectTo=/messages/${conversationId}`);
  }

  const user = getUserById(decodedToken.userId);

  if (!user) {
    return redirect(`/login?redirectTo=/messages/${conversationId}`);
  }

  interface Conversation {
    id: string;
    participant1_id: string;
    participant2_id: string;
  }

  const conversation = db
    .prepare(
      'SELECT id, participant1_id, participant2_id FROM conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)'
    )
    .get(conversationId, user.id, user.id) as Conversation | undefined;

  if (!conversation) {
    return (
      <div className="p-4 text-center">
        <p>Conversation not found or you do not have access.</p>
      </div>
    );
  }

  type Profile = {
    name: string | null
    email: string
  } | null

  const rawCurrentUserProfile = profileOperations.getById(user.id);
  const currentUserProfile = rawCurrentUserProfile ? { name: rawCurrentUserProfile.name, email: rawCurrentUserProfile.email } as Profile : null;

  const otherParticipantId =
    conversation.participant1_id === user.id ? conversation.participant2_id : conversation.participant1_id;

  const rawOtherParticipantProfile = profileOperations.getById(otherParticipantId);
  const otherParticipantProfile = rawOtherParticipantProfile ? { name: rawOtherParticipantProfile.name, email: rawOtherParticipantProfile.email } as Profile : null;

  type Message = {
    id: string
    conversation_id: string
    sender_id: string
    content: string
    created_at: string
  }

  const rawMessages = db
    .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
    .all(conversationId) as Message[];

  // Filter out any messages with null or invalid IDs
  const initialMessages = rawMessages.filter(msg => msg.id != null && msg.id !== '');

  if (!initialMessages) {
    return <p className="p-4 text-center text-red-500">Could not load messages.</p>;
  }

  return (
    <div className="flex flex-col items-center p-4 h-[calc(100vh-4rem)]">
      <div className="w-full max-w-2xl h-full flex flex-col">
        <div className="border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Chat with {otherParticipantProfile?.name || 'User'}
          </h1>
        </div>
        <ChatRoom
          conversationId={conversationId}
          initialMessages={initialMessages || []}
          currentUser={user}
          currentUserProfile={currentUserProfile}
          otherParticipantProfile={otherParticipantProfile}
        />
      </div>
    </div>
  );
}
