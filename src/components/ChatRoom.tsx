'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid';

type Message = {
  id: string // IDs are UUIDs in the database
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

type Profile = {
  name: string | null
  email: string
} | null

type User = {
  id: string;
  email: string;
  role?: string;
}

export default function ChatRoom({
  conversationId,
  initialMessages,
  currentUser,
  currentUserProfile,
  otherParticipantProfile,
}: {
  conversationId: string
  initialMessages: Message[]
  currentUser: User
  currentUserProfile: Profile
  otherParticipantProfile: Profile
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<null | HTMLDivElement>(null)
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Simulate receiving new messages (placeholder implementation)
  useEffect(() => {
    
  }, [conversationId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newMessage.trim() === '') return

    // Create a temporary ID that's guaranteed to be unique
    const tempId = `temp-${uuidv4()}`;

    // In a real implementation, you would send the message to the server
    const newMsg: Message = {
      id: tempId, // temporary ID
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: newMessage.trim(),
      created_at: new Date().toISOString()
    };

    // Optimistically update UI
    setMessages(prev => [...prev, newMsg])
    setNewMessage('')

    // Send to server
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message')
      }

      const savedMessage = await response.json();

      // Update the message with the server-generated ID and data
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId ? { ...savedMessage } : msg
        )
      );
    } catch (error: any) {
      console.error('Error sending message:', error)
      // Rollback optimistic update
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      // Optionally show an error message to the user
      alert(`Error sending message: ${error.message || 'Unknown error'}`);
    }
  }

  const getSenderName = (senderId: string) => {
    if (senderId === currentUser.id) {
      return currentUserProfile?.name || 'You'
    }
    return otherParticipantProfile?.name || 'Them'
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 rounded-lg shadow-inner">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className="flex flex-col max-w-[70%]">
              <span className={`text-xs ${msg.sender_id === currentUser.id ? 'text-gray-500 text-right' : 'text-gray-500 text-left'} mb-1`}>
                {getSenderName(msg.sender_id)}
              </span>
              <div
                className={`px-4 py-2 rounded-xl break-words ${
                  msg.sender_id === currentUser.id
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${ msg.sender_id === currentUser.id ? 'text-indigo-200' : 'text-gray-500'}`}>
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t bg-white rounded-b-lg">
        <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}