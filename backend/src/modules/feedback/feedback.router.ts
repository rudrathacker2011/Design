import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../lib/auth.js';
import { prisma } from '../../lib/db.js';
import { fail, ok } from '../../lib/response.js';
import { validate } from '../../lib/validation.js';

export const feedbackRouter = Router();

const FeedbackSchema = z.object({
  tripId: z.string().uuid().optional(),
  destinationId: z.string().min(2).max(200),
  outcome: z.enum(['better', 'as-expected', 'worse', 'not-travelled']),
  actualCrowd: z.enum(['quiet', 'moderate', 'busy', 'unknown']),
  actualWeather: z.enum(['good', 'mixed', 'poor', 'unknown']),
  note: z.string().max(600),
});

feedbackRouter.post('/', requireAuth, validate(FeedbackSchema), async (req, res) => {
  const input = req.body as z.infer<typeof FeedbackSchema>;
  const trip = input.tripId
    ? await prisma.trip.findFirst({ where: { id: input.tripId, userId: req.userId! }, select: { id: true } })
    : await prisma.trip.findFirst({ where: { userId: req.userId! }, orderBy: { updatedAt: 'desc' }, select: { id: true } });

  const existing = await prisma.feedback.findFirst({
    where: { userId: req.userId!, tripId: trip?.id ?? undefined },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) {
    res.status(409).json(fail('CONFLICT', 'Feedback has already been submitted for this trip.'));
    return;
  }

  const feedback = await prisma.$transaction(async (tx) => {
    const created = await tx.feedback.create({
      data: {
        userId: req.userId!,
        tripId: trip?.id,
        actualExperience: {
          destinationId: input.destinationId,
          outcome: input.outcome,
          actualCrowd: input.actualCrowd,
          actualWeather: input.actualWeather,
        },
        differenceNotes: input.note,
      },
    });
    await tx.yatraPoint.create({
      data: { userId: req.userId!, tripId: trip?.id, points: 150, reason: 'Post-trip feedback submitted' },
    });
    return created;
  });
  res.status(201).json(ok({ id: feedback.id, pointsAwarded: 150, createdAt: feedback.createdAt.toISOString() }));
});
