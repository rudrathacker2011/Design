import type { Request, Response, NextFunction } from 'express';
import { fail } from './response.js';
import dotenv from 'dotenv';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase.js';
import { prisma } from './db.js';
import type { Role } from '@prisma/client';

dotenv.config();

// Attach authenticated user to request
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: Role;
    }
  }
}

/** Resolve the Supabase identity to the local user used by domain tables. */
export async function resolveLocalUser(user: SupabaseUser) {
  if (!user.email) throw new Error('AUTH_USER_EMAIL_MISSING');
  const name = user.user_metadata?.name ?? user.user_metadata?.full_name ?? undefined;
  const existing = await prisma.user.findUnique({ where: { supabaseUid: user.id } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { email: user.email, name },
    });
  }

  const byEmail = await prisma.user.findUnique({ where: { email: user.email } });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { supabaseUid: user.id, name },
    });
  }

  return prisma.user.create({
    data: { supabaseUid: user.id, email: user.email, name: name ?? null },
  });
}

/**
 * requireAuth — verifies Supabase JWT from Authorization header.
 * Usage: router.get('/protected', requireAuth, handler)
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json(fail('AUTH_REQUIRED', 'Authentication token is required.'));
    return;
  }

  const token = authHeader.slice(7);
  let client;
  try {
    client = getSupabaseClient();
  } catch {
    res.status(503).json(fail('SERVICE_UNAVAILABLE', 'Authentication is not configured on this server.'));
    return;
  }
  if (!client) {
    res.status(503).json(fail('SERVICE_UNAVAILABLE', 'Authentication is not configured on this server.'));
    return;
  }

  try {
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) {
      res.status(401).json(fail('AUTH_REQUIRED', 'Invalid or expired authentication token.'));
      return;
    }
    const localUser = await resolveLocalUser(user);
    req.userId = localUser.id;
    req.userRole = localUser.role;
    next();
  } catch (error) {
    if (error instanceof Error && error.message === 'AUTH_USER_EMAIL_MISSING') {
      res.status(401).json(fail('AUTH_REQUIRED', 'Authenticated user has no email address.'));
      return;
    }
    res.status(503).json(fail('SERVICE_UNAVAILABLE', 'Authentication service is unavailable.'));
  }
}

/**
 * optionalAuth — attaches user if token present, does NOT block unauthenticated.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    let client;
    try {
      client = getSupabaseClient();
    } catch {
      next();
      return;
    }
    if (!client) {
      next();
      return;
    }
    const token = authHeader.slice(7);
    try {
      const { data: { user } } = await client.auth.getUser(token);
      if (user) {
        const localUser = await resolveLocalUser(user);
        req.userId = localUser.id;
        req.userRole = localUser.role;
      }
    } catch {
      // Ignore — optional auth
    }
  }

  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userId || !req.userRole) {
      res.status(401).json(fail('AUTH_REQUIRED', 'Authentication token is required.'));
      return;
    }
    if (!roles.includes(req.userRole)) {
      res.status(403).json(fail('FORBIDDEN', 'You do not have permission to access this resource.'));
      return;
    }
    next();
  };
}
