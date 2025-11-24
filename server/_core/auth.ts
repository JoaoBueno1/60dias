import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { COOKIE_NAME, ONE_YEAR_MS } from '@shared/const';
import type { Request } from 'express';
import { parse as parseCookieHeader } from 'cookie';
import { ENV } from './env';
import * as db from '../db';
import { ForbiddenError } from '@shared/_core/errors';

const SALT_ROUNDS = 10;

// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

export type SessionPayload = {
  userId: number;
  email: string;
  name: string;
};

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a JWT session token
 */
export async function createSessionToken(
  userId: number,
  email: string,
  name: string,
  options: { expiresInMs?: number } = {}
): Promise<string> {
  const issuedAt = Date.now();
  const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
  const secretKey = new TextEncoder().encode(ENV.cookieSecret);

  return new SignJWT({
    userId,
    email,
    name,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

/**
 * Verify a JWT session token
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const secretKey = new TextEncoder().encode(ENV.cookieSecret);
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    const { userId, email, name } = payload as Record<string, unknown>;

    if (
      typeof userId !== 'number' ||
      !isNonEmptyString(email) ||
      !isNonEmptyString(name)
    ) {
      console.warn('[Auth] Session payload missing required fields');
      return null;
    }

    return {
      userId,
      email,
      name,
    };
  } catch (error) {
    console.warn('[Auth] Session verification failed', String(error));
    return null;
  }
}

/**
 * Parse cookies from request
 */
function parseCookies(cookieHeader: string | undefined): Map<string, string> {
  if (!cookieHeader) {
    return new Map<string, string>();
  }

  const parsed = parseCookieHeader(cookieHeader);
  return new Map(Object.entries(parsed));
}

/**
 * Authenticate a request and return the user
 */
export async function authenticateRequest(req: Request) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionCookie = cookies.get(COOKIE_NAME);
  const session = await verifySessionToken(sessionCookie);

  if (!session) {
    throw ForbiddenError('Invalid session cookie');
  }

  const user = await db.getUserById(session.userId);

  if (!user) {
    throw ForbiddenError('User not found');
  }

  // Update last sign in
  await db.updateUserLastSignIn(user.id);

  return user;
}

/**
 * Register a new user
 */
export async function registerUser(email: string, password: string, name?: string) {
  // Check if user already exists
  const existingUser = await db.getUserByEmail(email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await db.createUser({
    email,
    passwordHash,
    name: name || null,
    role: 'user',
  });

  return user;
}

/**
 * Login a user
 */
export async function loginUser(email: string, password: string) {
  const user = await db.getUserByEmail(email);

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  return user;
}
