import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, getUserById } from '@/lib/auth'; // Adjust the path as needed
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // Get the authenticated user
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    const decodedToken = verifyToken(token as string);

    if (!decodedToken) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = getUserById(decodedToken.userId);

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();

    // Validate the request body
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return Response.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Verify that the user is part of the conversation
    const conversation = db
      .prepare(
        'SELECT id, participant1_id, participant2_id FROM conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)'
      )
      .get(params.conversationId, user.id, user.id);

    if (!conversation) {
      return Response.json({ error: 'Conversation not found or unauthorized' }, { status: 404 });
    }

    // Generate a UUID for the new message
    const messageId = uuidv4();

    // Insert the new message into the database
    db
      .prepare(
        'INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)'
      )
      .run(messageId, params.conversationId, user.id, content.trim());

    // Get the inserted message
    const newMessage = db
      .prepare(
        'SELECT * FROM messages WHERE id = ?'
      )
      .get(messageId);

    // Update the conversation's last_message_at timestamp
    db.prepare(
      'UPDATE conversations SET last_message_at = ? WHERE id = ?'
    ).run(new Date().toISOString(), params.conversationId);

    return Response.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/conversations/[conversationId]/messages:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}