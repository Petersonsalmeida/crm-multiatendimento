import type { Request, Response } from 'express';
import { env } from '@/env';
import type { HealthResponse } from '@/modules/health/health.types';

export function getHealth(_req: Request, res: Response<HealthResponse>): void {
  res.json({
    status: 'ok',
    service: 'alianca-crm-backend',
    env: env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
