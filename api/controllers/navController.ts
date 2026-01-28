import { Request, Response } from 'express';
import { NavModel } from '../models/navModel.js';

export const NavController = {
  async getAll(req: Request, res: Response) {
    try {
      const navigations = await NavModel.getAll();
      res.json({ categories: navigations, total: navigations.length });
    } catch (error) {
      console.error('Failed to get navigation:', error);
      res.status(500).json({ message: 'Failed to get navigation' });
    }
  },

  async update(req: Request, res: Response) {
    const { categories } = req.body;
    if (!Array.isArray(categories)) {
      console.error('Invalid categories format:', categories);
      return res.status(400).json({ message: 'Invalid data format' });
    }
    try {
      await NavModel.saveAll(categories);
      res.json({ message: 'Navigation updated successfully' });
    } catch (error) {
      console.error('Failed to save navigation:', error);
      res.status(500).json({ message: 'Failed to save navigation' });
    }
  },
};
