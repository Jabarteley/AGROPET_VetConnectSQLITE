import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { profileOperations } from '@/lib/dbOperations';
import db from '@/lib/db';

// Secret for JWT tokens (should be stored in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Compare a password with its hash
export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate a JWT token
export function generateToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

// Verify a JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Create a new user account
export async function createUser(userData: {
  email: string,
  password: string,
  role?: string,
  name?: string
}): Promise<any> {
  // Check if user already exists
  const existingUser = db.prepare('SELECT * FROM profiles WHERE email = ?').get(userData.email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Create the user profile with password
  const newUser = {
    id: userData.email, // Using email as ID for simplicity, but could use UUID
    email: userData.email,
    role: userData.role || 'farmer_pet_owner',
    name: userData.name || null,
    location: null,
    qualifications: null,
    specialization: null,
    service_regions: null,
    verification_status: 'pending',
    password: userData.password // Will be hashed in upsert
  };

  // Add password to the profile (will be hashed in upsert)
  const profile = await profileOperations.upsert(newUser);

  // Return user info without password
  if (profile) {
    const { password, ...userWithoutPassword } = profile;
    return userWithoutPassword;
  }
  return null;
}

// Authenticate a user
export async function authenticateUser(email: string, password: string): Promise<any> {
  // Get user from database
  const user = db.prepare('SELECT * FROM profiles WHERE email = ?').get(email) as { password?: string } | undefined;

  if (!user) {
    return null; // User not found
  }

  // Check if password exists and compare
  if (!user.password) {
    return null; // No password set for this user
  }

  // Compare passwords
  const isValid = await comparePasswords(password, user.password);

  if (!isValid) {
    return null; // Invalid password
  }

  // Return user info without password
  const { password: pwd, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Get user by ID
export function getUserById(id: string): any {
  const user = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as { password?: string } | undefined;

  if (!user) {
    return null;
  }

  // Return user info without password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Update user profile
export async function updateUserProfile(userId: string, profileData: any): Promise<any> {
  // Get existing profile
  const existingProfile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(userId);

  if (!existingProfile) {
    throw new Error('User not found');
  }

  // Prepare update data
  const updateFields = [];
  const params = [];

  for (const [key, value] of Object.entries(profileData)) {
    if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
      updateFields.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (updateFields.length === 0) {
    return getUserById(userId); // Return current profile if no updates
  }

  // Add the ID for WHERE clause
  params.push(userId);

  // Build and execute update query
  const query = `UPDATE profiles SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  const stmt = db.prepare(query);
  stmt.run(...params);

  // Return updated profile
  return getUserById(userId);
}