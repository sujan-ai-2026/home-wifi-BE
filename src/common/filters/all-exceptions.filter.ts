import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = (request.headers['x-correlation-id'] as string) || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'object' && res !== null && 'message' in res ? (res as any).message : res;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Sanitize any potential secrets or sensitive router details from message
    const sanitizedMessage = typeof message === 'string'
      ? message.replace(/(password|jwt|secret|key)=[^& ]+/gi, '$1=******')
      : message;

    this.logger.error(
      `[${correlationId}] ${request.method} ${request.url} - Status ${status} - Error: ${JSON.stringify(sanitizedMessage)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      message: sanitizedMessage,
    });
  }
}
