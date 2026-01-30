-- SQLite Schema for Messaging

-- Create the conversations table
CREATE TABLE conversations (
  id TEXT PRIMARY KEY, -- Using TEXT for UUID storage
  participant1_id TEXT NOT NULL,
  participant2_id TEXT NOT NULL,
  last_message_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (participant1_id) REFERENCES profiles(id),
  FOREIGN KEY (participant2_id) REFERENCES profiles(id)
);

-- Create the messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY, -- Using TEXT for UUID storage
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (sender_id) REFERENCES profiles(id)
);

-- Create indexes for better performance
CREATE INDEX idx_conversations_participants ON conversations(participant1_id, participant2_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- Trigger to update the 'updated_at' column for conversations
CREATE TRIGGER update_conversations_updated_at
  AFTER UPDATE ON conversations
  FOR EACH ROW
  WHEN OLD.updated_at = NEW.updated_at
BEGIN
  UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to update the 'last_message_at' column for conversations
CREATE TRIGGER update_conversations_last_message_at
  AFTER INSERT ON messages
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at, updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
END;
