import { enhance, type UniversalHandler } from '@universal-middleware/core';
import { createLogger } from './logger';

const logger = createLogger('ClientLogs');

export const clientLogsHandler: UniversalHandler = enhance(
  async (request, _context, _runtime) => {
    try {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'content-type': 'application/json' },
        });
      }

      const logEntry = (await request.json()) as {
        timestamp: string;
        level: string;
        message: string;
        data?: unknown;
        url: string;
        userAgent: string;
      };

      logger.info(`Client ${logEntry.level}`, {
        message: logEntry.message,
        url: logEntry.url,
        data: logEntry.data,
      });

      return new Response(JSON.stringify({ status: 'OK' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    } catch (error) {
      logger.error('Failed to process client log', error as Error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
  },
  { name: 'vike-app:client-logs', path: '/api/logs', method: ['POST'], immutable: false },
);
