import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Assign parsed values back to requests for type safety
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;
      
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
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
