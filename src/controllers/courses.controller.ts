import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export async function listCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tier } = req.query;

    const where: Record<string, unknown> = {};

    if (tier && typeof tier === 'string') {
      where.tier = tier;
    }

    const courses = await prisma.course.findMany({
      where,
      orderBy: { title: 'asc' },
    });

    res.json(courses);
  } catch (error) {
    next(error);
  }
}
