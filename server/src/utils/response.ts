import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  data: unknown,
  message = 'Sucesso',
  statusCode = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: any
): Response => {
  const isProd = process.env.NODE_ENV === 'production';
  
  // No ambiente de produção, não enviamos detalhes técnicos do erro (stack traces, etc)
  const sanitizedErrors = isProd ? null : errors;

  return res.status(statusCode).json({
    success: false,
    message,
    errors: sanitizedErrors,
  });
};
