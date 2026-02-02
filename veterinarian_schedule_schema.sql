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