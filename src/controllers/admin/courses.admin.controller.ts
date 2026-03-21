import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';

const courseSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  tier: z.enum(['T1', 'T2', 'T3', 'T4']),
  format: z.string().max(100).optional(),
  duration: z.string().max(50).optional(),
  url: z.string().url().max(500).optional().nullable(),
  isPublished: z.boolean().optional(),
});

const courseUpdateSchema = courseSchema.partial();

export async function adminListCourses(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courses = await prisma.course.findMany({ orderBy: { title: 'asc' } });
    res.json(courses);
  } catch (error) {
    next(error);
  }
}

export async function adminCreateCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = courseSchema.parse(req.body);
    const course = await prisma.course.create({ data });
    res.status(201).json(course);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    next(error);
  }
}

export async function adminUpdateCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = courseUpdateSchema.parse(req.body);
    const course = await prisma.course.update({ where: { id }, data });
    res.json(course);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    next(error);
  }
}

export async function adminDeleteCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.course.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
