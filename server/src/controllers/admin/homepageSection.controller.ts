import { Request, Response } from 'express';
import { HomepageSection, ensureDefaultHomepageSections } from '../../models/HomepageSection';
import { clearCachePattern } from '../../middleware/cache';
import { getIO } from '../../lib/socket';

const SECTION_TYPES = ['special_promo', 'new_arrivals', 'eyeglaze_edit'] as const;

function emitChanged(payload: Record<string, unknown>) {
  try {
    getIO().emit('homepage_section_changed', payload);
  } catch (err) {
    console.error('Socket emit error:', err);
  }
}

function normalizeItems(items: unknown) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item === 'object')
    .map((item: any) => ({
      title: String(item.title || ''),
      style: String(item.style || ''),
      description: String(item.description || ''),
      imageUrl: String(item.imageUrl || ''),
      linkUrl: String(item.linkUrl || ''),
      buttonText: String(item.buttonText || 'SHOP THE LOOK'),
    }));
}

function applyFields(section: any, body: any) {
  const {
    sectionType,
    position,
    displayOrder,
    isActive,
    showOnMobile,
    tag,
    headline,
    description,
    buttonText,
    linkUrl,
    imageUrl,
    sectionTitle,
    sectionSubtitle,
    items,
  } = body || {};

  if (sectionType !== undefined) {
    if (!SECTION_TYPES.includes(sectionType)) {
      return 'Invalid section type.';
    }
    section.sectionType = sectionType;
  }
  if (position !== undefined) section.position = position;
  if (displayOrder !== undefined) section.displayOrder = Number(displayOrder) || 0;
  if (isActive !== undefined) section.isActive = !!isActive;
  if (showOnMobile !== undefined) section.showOnMobile = !!showOnMobile;
  if (tag !== undefined) section.tag = tag;
  if (headline !== undefined) section.headline = headline;
  if (description !== undefined) section.description = description;
  if (buttonText !== undefined) section.buttonText = buttonText;
  if (linkUrl !== undefined) section.linkUrl = linkUrl;
  if (imageUrl !== undefined) section.imageUrl = imageUrl;
  if (sectionTitle !== undefined) section.sectionTitle = sectionTitle;
  if (sectionSubtitle !== undefined) section.sectionSubtitle = sectionSubtitle;
  if (items !== undefined) section.items = normalizeItems(items);
  return null;
}

export async function getAdminHomepageSections(req: Request, res: Response) {
  try {
    const changed = await ensureDefaultHomepageSections();
    if (changed) {
      await clearCachePattern('cache:/api/homepage-sections*');
    }
    const sections = await HomepageSection.find().sort({ displayOrder: 1 });
    return res.status(200).json(sections);
  } catch (error) {
    console.error('Error fetching admin homepage sections:', error);
    return res.status(500).json({ error: 'Failed to fetch homepage sections' });
  }
}

export async function getAdminHomepageSection(req: Request, res: Response) {
  try {
    const section = await HomepageSection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ error: 'Homepage section not found' });
    }
    return res.status(200).json(section);
  } catch (error) {
    console.error('Error fetching homepage section:', error);
    return res.status(500).json({ error: 'Failed to fetch homepage section' });
  }
}

export async function createHomepageSection(req: Request, res: Response) {
  try {
    const sectionType = req.body?.sectionType;
    if (!SECTION_TYPES.includes(sectionType)) {
      return res.status(400).json({ error: 'sectionType is required.' });
    }

    const section = new HomepageSection({
      sectionType,
      position: req.body?.position || 'after_featured',
      displayOrder: req.body?.displayOrder || 0,
      isActive: req.body?.isActive !== undefined ? !!req.body.isActive : true,
      showOnMobile: req.body?.showOnMobile !== undefined ? !!req.body.showOnMobile : true,
    });
    const error = applyFields(section, req.body);
    if (error) return res.status(400).json({ error });

    await section.save();
    emitChanged({ action: 'create', section });
    await clearCachePattern('cache:/api/homepage-sections*');
    return res.status(201).json(section);
  } catch (error) {
    console.error('Error creating homepage section:', error);
    return res.status(500).json({ error: 'Failed to create homepage section' });
  }
}

export async function updateHomepageSection(req: Request, res: Response) {
  try {
    const section = await HomepageSection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ error: 'Homepage section not found' });
    }

    const error = applyFields(section, req.body);
    if (error) return res.status(400).json({ error });

    await section.save();
    emitChanged({ action: 'update', section });
    await clearCachePattern('cache:/api/homepage-sections*');
    return res.status(200).json(section);
  } catch (error) {
    console.error('Error updating homepage section:', error);
    return res.status(500).json({ error: 'Failed to update homepage section' });
  }
}

export async function updateHomepageSectionTypePosition(req: Request, res: Response) {
  try {
    const sectionType = req.body?.sectionType;
    const position = String(req.body?.position || '').trim();
    if (!SECTION_TYPES.includes(sectionType)) {
      return res.status(400).json({ error: 'sectionType is required.' });
    }
    if (!position) {
      return res.status(400).json({ error: 'position is required.' });
    }

    const result = await HomepageSection.updateMany(
      { sectionType },
      { $set: { position } }
    );
    emitChanged({ action: 'position', sectionType, position });
    await clearCachePattern('cache:/api/homepage-sections*');
    return res.status(200).json({
      message: 'Position updated.',
      matched: result.matchedCount,
      modified: result.modifiedCount,
      position,
    });
  } catch (error) {
    console.error('Error updating homepage section position:', error);
    return res.status(500).json({ error: 'Failed to update position' });
  }
}

export async function deleteHomepageSection(req: Request, res: Response) {
  try {
    const section = await HomepageSection.findByIdAndDelete(req.params.id);
    if (!section) {
      return res.status(404).json({ error: 'Homepage section not found' });
    }
    emitChanged({ action: 'delete', id: req.params.id });
    await clearCachePattern('cache:/api/homepage-sections*');
    return res.status(200).json({ message: 'Homepage section deleted successfully' });
  } catch (error) {
    console.error('Error deleting homepage section:', error);
    return res.status(500).json({ error: 'Failed to delete homepage section' });
  }
}
