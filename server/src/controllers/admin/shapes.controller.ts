import { Request, Response } from 'express';
import { connectDB } from '../../config/mongodb';
import { Shape } from '../../models/Shape';
import { escapeRegExp } from '../../lib/regex';
import { getIO } from '../../lib/socket';

// 1. Get Shapes List
export async function getShapes(req: Request, res: Response) {
  try {
    await connectDB();
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const isDeleted = req.query.isDeleted === 'true';
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { isDeleted };

    if (search) {
      query.name = { $regex: escapeRegExp(search), $options: 'i' };
    }
    if (status) {
      query.status = status;
    }

    const [items, total] = await Promise.all([
      Shape.find(query)
        .sort({ displayOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Shape.countDocuments(query),
    ]);

    return res.status(200).json({
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('getShapes error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch shapes' });
  }
}

// 2. Get Shape Details by ID
export async function getShapeById(req: Request, res: Response) {
  try {
    await connectDB();
    const { id } = req.params;
    const shape = await Shape.findById(id).lean();
    if (!shape) {
      return res.status(404).json({ error: 'Shape not found' });
    }
    return res.status(200).json(shape);
  } catch (error: any) {
    console.error('getShapeById error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch shape details' });
  }
}

// 3. Create Shape
export async function createShape(req: Request, res: Response) {
  try {
    await connectDB();
    const { name, image, displayOrder, status } = req.body;

    if (!name || !image) {
      return res.status(400).json({ error: 'Name and Image are required' });
    }

    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await Shape.findOne({ slug: generatedSlug });
    if (existing) {
      return res.status(400).json({ error: `Shape with name "${name}" already exists` });
    }

    const newShape = new Shape({
      name,
      slug: generatedSlug,
      image,
      displayOrder: displayOrder ?? 0,
      status: status || 'Active',
    });

    await newShape.save();
    try {
      getIO().emit('shape_changed');
    } catch (e) {
      console.error('Socket emit failed:', e);
    }
    return res.status(201).json(newShape);
  } catch (error: any) {
    console.error('createShape error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create shape' });
  }
}

// 4. Update Shape
export async function updateShape(req: Request, res: Response) {
  try {
    await connectDB();
    const { id } = req.params;
    const { name, image, displayOrder, status } = req.body;

    const shape = await Shape.findById(id);
    if (!shape) {
      return res.status(404).json({ error: 'Shape not found' });
    }

    if (name !== undefined) {
      shape.name = name;
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      if (generatedSlug !== shape.slug) {
        const existing = await Shape.findOne({ slug: generatedSlug });
        if (existing) {
          return res.status(400).json({ error: `Shape with name "${name}" already exists` });
        }
        shape.slug = generatedSlug;
      }
    }

    if (image !== undefined) shape.image = image;
    if (displayOrder !== undefined) shape.displayOrder = displayOrder;
    if (status !== undefined) shape.status = status;

    await shape.save();
    try {
      getIO().emit('shape_changed');
    } catch (e) {
      console.error('Socket emit failed:', e);
    }
    return res.status(200).json(shape);
  } catch (error: any) {
    console.error('updateShape error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update shape' });
  }
}

// 5. Delete Shape (hard-delete)
export async function deleteShape(req: Request, res: Response) {
  try {
    await connectDB();
    const { id } = req.params;

    const shape = await Shape.findByIdAndDelete(id);
    if (!shape) {
      return res.status(404).json({ error: 'Shape not found' });
    }

    try {
      getIO().emit('shape_changed');
    } catch (e) {
      console.error('Socket emit failed:', e);
    }

    return res.status(200).json({ message: 'Shape deleted successfully from database' });
  } catch (error: any) {
    console.error('deleteShape error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete shape' });
  }
}

// 6. Restore Shape
export async function restoreShape(req: Request, res: Response) {
  try {
    await connectDB();
    const { id } = req.params;

    const shape = await Shape.findById(id);
    if (!shape) {
      return res.status(404).json({ error: 'Shape not found' });
    }

    shape.isDeleted = false;
    shape.deletedAt = undefined;
    await shape.save();
    try {
      getIO().emit('shape_changed');
    } catch (e) {
      console.error('Socket emit failed:', e);
    }

    return res.status(200).json(shape);
  } catch (error: any) {
    console.error('restoreShape error:', error);
    return res.status(500).json({ error: error.message || 'Failed to restore shape' });
  }
}
