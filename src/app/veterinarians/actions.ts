'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken, getUserById } from '@/lib/auth';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function initiateConversation(vetId: string) {
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

  const userId = user.id;

  interface Conversation {
    id: string;
  }

  // Check if a conversation already exists between these two users
  let conversation = db
    .prepare(
      `SELECT id FROM conversations
       WHERE (participant1_id = ? AND participant2_id = ?)
       OR (participant1_id = ? AND participant2_id = ?)`
    )
    .get(userId, vetId, vetId, userId) as Conversation | undefined;

  // If no conversation exists, create a new one
  if (!conversation) {
    const newConversationId = uuidv4();
    const insertStmt = db.prepare(
      `INSERT INTO conversations (id, participant1_id, participant2_id, created_at, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    );
    insertStmt.run(newConversationId, userId, vetId);
    conversation = { id: newConversationId };
  }

  revalidatePath(`/messages/${conversation.id}`);
  redirect(`/messages/${conversation.id}`);
}
