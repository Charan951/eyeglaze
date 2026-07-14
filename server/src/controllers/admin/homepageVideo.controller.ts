import { Request, Response } from 'express';
import { HomepageVideo } from '../../models/HomepageVideo';
import { clearCachePattern } from '../../middleware/cache';
import { getIO } from '../../lib/socket';

export async function getAdminHomepageVideos(req: Request, res: Response) {
  try {
    const videos = await HomepageVideo.find().sort({ displayOrder: 1 });
    const proxiedVideos = videos.map(vid => {
      const vidObj = vid.toObject();
      const url = vidObj.videoUrl;
      const isS3 = url.includes('amazonaws.com') && url.includes('eyeglaze_videos');
      if (isS3) {
        const host = req.get('host') || 'localhost:5000';
        let protocol = req.protocol || 'http';
        const forwardedProto = req.headers['x-forwarded-proto'];
        if (forwardedProto) {
          protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
        } else if (host.includes('.in') || host.includes('.com')) {
          protocol = 'https';
        }
        vidObj.videoUrl = `${protocol}://${host}/api/homepage-videos/stream/${vid._id}`;
      }
      return vidObj;
    });
    return res.status(200).json(proxiedVideos);
  } catch (error) {
    console.error('Error fetching admin homepage videos:', error);
    return res.status(500).json({ error: 'Failed to fetch homepage videos' });
  }
}


export async function createHomepageVideo(req: Request, res: Response) {
  try {
    const { title, videoUrl, description, displayOrder, isActive } = req.body;
    if (!title || !videoUrl) {
      return res.status(400).json({ error: 'Title and videoUrl are required' });
    }

    const video = new HomepageVideo({
      title,
      videoUrl,
      description,
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    await video.save();
    try {
      getIO().emit('homepage_video_changed', { action: 'create', video });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    await clearCachePattern('cache:/api/homepage-videos*');
    return res.status(201).json(video);
  } catch (error) {
    console.error('Error creating homepage video:', error);
    return res.status(500).json({ error: 'Failed to create homepage video' });
  }
}

export async function updateHomepageVideo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { title, videoUrl, description, displayOrder, isActive } = req.body;

    const video = await HomepageVideo.findById(id);
    if (!video) {
      return res.status(404).json({ error: 'Homepage video not found' });
    }

    if (title !== undefined) video.title = title;
    if (videoUrl !== undefined) video.videoUrl = videoUrl;
    if (description !== undefined) video.description = description;
    if (displayOrder !== undefined) video.displayOrder = displayOrder;
    if (isActive !== undefined) video.isActive = isActive;

    await video.save();
    try {
      getIO().emit('homepage_video_changed', { action: 'update', video });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    await clearCachePattern('cache:/api/homepage-videos*');
    return res.status(200).json(video);
  } catch (error) {
    console.error('Error updating homepage video:', error);
    return res.status(500).json({ error: 'Failed to update homepage video' });
  }
}

export async function deleteHomepageVideo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const video = await HomepageVideo.findByIdAndDelete(id);
    if (!video) {
      return res.status(404).json({ error: 'Homepage video not found' });
    }
    try {
      getIO().emit('homepage_video_changed', { action: 'delete', id });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    await clearCachePattern('cache:/api/homepage-videos*');
    return res.status(200).json({ message: 'Homepage video deleted successfully' });
  } catch (error) {
    console.error('Error deleting homepage video:', error);
    return res.status(500).json({ error: 'Failed to delete homepage video' });
  }
}
