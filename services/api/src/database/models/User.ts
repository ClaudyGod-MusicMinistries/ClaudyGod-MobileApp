// database/models/User.ts
/**
 * User Entity/Interface
 * Database model for user accounts and authentication
 */

export interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  
  // Password hash (bcrypt)
  password: string;
  
  // Email verification
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  
  // Password reset
  passwordResetToken?: string;
  passwordResetTokenExpiry?: Date;
  
  // Profile
  bio?: string;
  avatarUrl?: string;
  avatarColor?: string;
  profileVisibility: 'public' | 'private' | 'followers';
  
  // Account status
  isActive: boolean;
  isAdmin: boolean;
  lastLoginAt?: Date;
  loginCount: number;
  
  // Preferences
  preferences: Record<string, any>;
  language: string;
  theme: 'light' | 'dark' | 'auto';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
