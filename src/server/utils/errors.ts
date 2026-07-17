import { Response } from 'express';

/**
 * Standardizes error responses across server routes.
 * 
 * @param res Express response object
 * @param status HTTP status code
 * @param code Machine-readable error code (e.g., 'BAD_REQUEST')
 * @param message Human-readable error message
 * @param extra Optional additional fields (e.g., spreadsheetId)
 */
export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  extra?: Record<string, any>
) {
  return res.status(status).json({
    error: code,
    message,
    ...extra
  });
}
