import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';

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
    const course = await prisma.course.create({ data: req.body });
    res.status(201).json(course);
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const course = await prisma.course.update({ where: { id }, data: req.body });
    res.json(course);
  } catch (error) {
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
