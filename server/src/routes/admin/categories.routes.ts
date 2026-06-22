import { Router } from 'express';
import {
  getCategories,
  getCategoryTree,
  getCategoryDetails,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  duplicateCategory,
  exportCategoriesToCSV,
  importCategoriesFromCSV,
  getNavigationMenu,
  updateNavigationMenu,
} from '../../controllers/admin/categories.controller';

const router = Router();

// Navigation config (Must place before parameter routes)
router.get('/navigation-menu', getNavigationMenu);
router.put('/navigation-menu', updateNavigationMenu);

// Tree View and CSV Export/Import
router.get('/tree', getCategoryTree);
router.get('/export', exportCategoriesToCSV);
router.post('/import', importCategoriesFromCSV);

// Base CRUD routes
router.get('/', getCategories);
router.post('/', createCategory);
router.get('/:type/:id', getCategoryDetails);
router.put('/:type/:id', updateCategory);
router.delete('/:type/:id', deleteCategory);
router.put('/:type/:id/restore', restoreCategory);
router.post('/:type/:id/duplicate', duplicateCategory);

export default router;
