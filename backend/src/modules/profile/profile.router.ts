import { Router } from 'express';
import { ProfileService } from './profile.service.js';
import { requireAuth } from '../../lib/auth.js';
import { validate, UpdateProfileSchema } from '../../lib/validation.js';
import { ok, fail } from '../../lib/response.js';

export const profileRouter = Router();

/**
 * GET /api/v1/profile
 * Returns authenticated user's profile.
 */
profileRouter.get('/', requireAuth, async (req, res) => {
  try {
    const profile = await ProfileService.getProfileByUserId(req.userId!);
    if (!profile) {
      res.status(404).json(fail('NOT_FOUND', 'Profile not found. Please complete your traveller profile.'));
      return;
    }
    res.json(ok(profile));
  } catch (err: any) {
    console.error('[profile:GET]', err.message);
    res.status(500).json(fail('INTERNAL_ERROR', 'Failed to fetch profile.'));
  }
});

/**
 * PUT /api/v1/profile
 * Creates or updates authenticated user's profile.
 */
profileRouter.put('/', requireAuth, validate(UpdateProfileSchema), async (req, res) => {
  try {
    const profile = await ProfileService.upsertProfile(req.userId!, req.body);
    res.json(ok(profile));
  } catch (err: any) {
    console.error('[profile:PUT]', err.message);
    res.status(500).json(fail('INTERNAL_ERROR', 'Failed to update profile.'));
  }
});
