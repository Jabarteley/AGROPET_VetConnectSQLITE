-- SQLite Schema for AgroPet VetConnect

-- Create the profiles table
CREATE TABLE profiles (
  id TEXT PRIMARY KEY, -- Using TEXT for UUID storage
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('farmer_pet_owner', 'veterinarian', 'admin')),
  name TEXT,
  location TEXT,
  qualifications TEXT,
  specialization TEXT,
  service_regions TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending', 'verified', 'rejected')),
  password TEXT, -- Store hashed password
  profile_photo TEXT, -- URL to the user's profile photo
  is_available INTEGER DEFAULT 1, -- Availability status for veterinarians (0 = unavailable, 1 = available)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create the appointments table
CREATE TABLE appointments (
  id TEXT PRIMARY KEY, -- Using TEXT for UUID storage
  user_id TEXT NOT NULL,
  vet_id TEXT NOT NULL,
  appointment_datetime DATETIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'completed', 'cancelled')),
  reason TEXT,
  images TEXT, -- JSON string of image URLs/filenames
  diagnosis TEXT,
  prescription TEXT,
  vet_comments TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id),
  FOREIGN KEY (vet_id) REFERENCES profiles(id)
);

-- Create the notifications table
CREATE TABLE notifications (
  id TEXT PRIMARY KEY, -- Using TEXT for UUID storage
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK(type IN ('info', 'warning', 'success', 'error', 'appointment_reminder')),
  is_read INTEGER DEFAULT 0, -- Using INTEGER (0/1) for boolean in SQLite
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id)
);

-- Create indexes for better performance
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_vet_id ON appointments(vet_id);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_datetime);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Trigger to automatically update the 'updated_at' column for profiles
CREATE TRIGGER update_profiles_updated_at
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN OLD.updated_at = NEW.updated_at
BEGIN
  UPDATE profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to automatically update the 'updated_at' column for appointments
CREATE TRIGGER update_appointments_updated_at
  AFTER UPDATE ON appointments
  FOR EACH ROW
  WHEN OLD.updated_at = NEW.updated_at
BEGIN
  UPDATE appointments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

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

-- Create the veterinarian_schedules table
CREATE TABLE veterinarian_schedules (
  id TEXT PRIMARY KEY, -- Using TEXT for UUID storage
  vet_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start_time TEXT NOT NULL, -- Format: HH:MM (24-hour format)
  end_time TEXT NOT NULL, -- Format: HH:MM (24-hour format)
  is_available INTEGER DEFAULT 1, -- Whether the vet is available on this day (0 = unavailable, 1 = available)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vet_id) REFERENCES profiles(id)
);

-- Create index for better performance
CREATE INDEX idx_veterinarian_schedules_vet_id ON veterinarian_schedules(vet_id);
CREATE INDEX idx_veterinarian_schedules_day ON veterinarian_schedules(day_of_week);

-- Trigger to automatically update the 'updated_at' column
CREATE TRIGGER update_veterinarian_schedules_updated_at
  AFTER UPDATE ON veterinarian_schedules
  FOR EACH ROW
  WHEN OLD.updated_at = NEW.updated_at
BEGIN
  UPDATE veterinarian_schedules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
