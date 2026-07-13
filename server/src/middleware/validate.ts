import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

export function validate(schema: ZodType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as any;
      
      // Assign parsed values back to requests for type safety
      req.body = parsed.body;
      if (parsed.query) {
        Object.defineProperty(req, 'query', {
          value: parsed.query,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      if (parsed.params) {
        Object.defineProperty(req, 'params', {
          value: parsed.params,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      
      return next();
    } catch (error) {
      console.error('Validation error caught in middleware:', error);
      if (error instanceof ZodError || (error as any)?.name === 'ZodError') {
        const formattedErrors = (error as any).issues.map((err: any) => ({
          field: err.path.slice(1).join('.'), // Remove 'body'/'query'/'params' prefix
          message: err.message,
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          details: formattedErrors,
        });
      }
      return res.status(500).json({ error: 'Internal validation error' });
    }
  };
}
export default validate;
