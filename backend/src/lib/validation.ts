import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { fail } from './response.js';

/**
 * validate — creates a middleware that validates request.body against a Zod schema.
 * On failure returns 400 VALIDATION_ERROR. On success, typed body is attached.
 */
export function validate<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
    const firstError = result.error.issues[0];
      res.status(400).json(
        fail('VALIDATION_ERROR', firstError?.message ?? 'Invalid request body.', {
          field: firstError?.path?.join('.'),
        })
      );
      return;
    }
    req.body = result.data;
    next();
  };
}

// ============================================================
// Core schema building blocks
// ============================================================

export const TravelPaceSchema = z.enum(['RELAXED', 'BALANCED', 'FAST']);
export const CrowdPreferenceSchema = z.enum(['SEEK_QUIET', 'MODERATE', 'DONT_CARE']);
export const BudgetSchema = z.enum(['VALUE', 'COMFORTABLE', 'FLEXIBLE']);
export const RoleSchema = z.enum(['TRAVELLER', 'LOCAL_OPERATOR', 'TOURISM_ADMIN', 'SYSTEM_ADMIN']);

// Profile
export const UpdateProfileSchema = z.object({
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  travelPace: TravelPaceSchema.optional(),
  crowdPreference: CrowdPreferenceSchema.optional(),
  accessibilityNeeds: z.boolean().optional(),
  transportPreference: z.string().max(50).optional(),
  vehicleRequired: z.boolean().optional(),
  languagePreference: z.string().max(10).optional(),
});

// Decision Evaluation
export const DecisionEvaluateSchema = z.object({
  destinationName: z.string().min(2).max(200),
  travelPace: TravelPaceSchema.optional(),
  crowdPreference: CrowdPreferenceSchema.optional(),
  accessibilityNeeds: z.boolean().optional(),
  travelDates: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
});
