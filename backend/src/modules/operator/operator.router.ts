import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../lib/auth.js';
import { prisma } from '../../lib/db.js';
import { fail, ok } from '../../lib/response.js';
import { validate } from '../../lib/validation.js';

export const operatorRouter = Router();
operatorRouter.use(requireAuth, requireRole('LOCAL_OPERATOR', 'TOURISM_ADMIN', 'SYSTEM_ADMIN'));

operatorRouter.get('/requests', async (_req, res) => {
  const [assistance, service] = await Promise.all([
    prisma.assistanceEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { trip: { select: { id: true, destinationSummary: true } } },
    }),
    prisma.serviceRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { provider: { select: { id: true, name: true } } },
    }),
  ]);
  res.json(ok([
    ...assistance.map((event) => ({
      id: event.id,
      reference: event.id,
      kind: event.type.toLowerCase(),
      status: event.status,
      detail: event.notes ?? 'Assistance request',
      destination: event.trip.destinationSummary,
      createdAt: event.createdAt.toISOString(),
      source: 'assistance',
    })),
    ...service.map((request) => ({
      id: request.id,
      reference: request.id,
      kind: request.type.toLowerCase(),
      status: request.status,
      detail: request.notes ?? `${request.provider.name} request`,
      destination: null,
      createdAt: request.createdAt.toISOString(),
      source: 'service',
    })),
  ]));
});

const StatusSchema = z.object({
  status: z.string().min(1).max(32),
});

operatorRouter.patch('/requests/:requestId', validate(StatusSchema), async (req, res) => {
  const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;
  const existing = await prisma.assistanceEvent.findUnique({ where: { id: requestId } });
  if (existing) {
    const status = z.enum(['INITIATED', 'DISPATCHED', 'EN_ROUTE', 'RESOLVED', 'CANCELLED']).parse(req.body.status);
    const updated = await prisma.assistanceEvent.update({
      where: { id: requestId },
      data: { status, resolvedAt: status === 'RESOLVED' ? new Date() : null },
    });
    await prisma.auditLog.create({
      data: {
        entity: 'AssistanceEvent',
        entityId: updated.id,
        action: 'STATUS_UPDATED',
        actorId: req.userId,
        metadata: { status, source: 'operator' },
      },
    });
    res.json(ok({ id: updated.id, status: updated.status, resolvedAt: updated.resolvedAt?.toISOString() ?? null }));
    return;
  }
  const service = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
  if (!service) {
    res.status(404).json(fail('NOT_FOUND', 'Operator request not found.'));
    return;
  }
  const status = z.enum(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).parse(req.body.status);
  const updated = await prisma.serviceRequest.update({ where: { id: requestId }, data: { status } });
  await prisma.auditLog.create({
    data: {
      entity: 'ServiceRequest',
      entityId: updated.id,
      action: 'STATUS_UPDATED',
      actorId: req.userId,
      metadata: { status, source: 'operator' },
    },
  });
  res.json(ok({ id: updated.id, status: updated.status, resolvedAt: null }));
});
