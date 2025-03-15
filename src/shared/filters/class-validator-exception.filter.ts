import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    BadRequestException,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  
  @Catch(BadRequestException)
  export class ValidationExceptionFilter implements ExceptionFilter {
    catch(exception: BadRequestException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      const status = exception.getStatus();
      const requestId = request.headers['x-request-id'];
  
      interface ValidationErrorResponse {
        statusCode: number;
        message: string[];
        error: string;
      }
  
      const extractErrorDetails = (responseBody: unknown): string[] | unknown => {
        if (
          typeof responseBody === 'object' &&
          responseBody !== null &&
          'message' in responseBody &&
          Array.isArray((responseBody as ValidationErrorResponse).message)
        ) {
          return (responseBody as ValidationErrorResponse).message;
        }
  
        if (typeof responseBody === 'object' && responseBody !== null) {
          return Object.values(responseBody).flat();
        }
  
        return responseBody;
      };
  
      const errorDetails = extractErrorDetails(exception.getResponse());
  
      response.status(status).json({
        message: errorDetails,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId,
      });
    }
  }