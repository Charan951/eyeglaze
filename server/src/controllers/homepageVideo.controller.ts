import { Request, Response } from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { HomepageVideo } from '../models/HomepageVideo';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

function getProxiedUrl(video: any, req: Request) {
  const url = video.videoUrl;
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
    return `${protocol}://${host}/api/homepage-videos/stream/${video._id}`;
  }
  return url;
}

export async function getHomepageVideos(req: Request, res: Response) {
  try {
    const videos = await HomepageVideo.find({ isActive: true }).sort({ displayOrder: 1 });
    
    // Rewrite S3 URLs to go through our streaming proxy
    const proxiedVideos = videos.map(vid => {
      const vidObj = vid.toObject();
      vidObj.videoUrl = getProxiedUrl(vid, req);
      return vidObj;
    });

    return res.status(200).json(proxiedVideos);
  } catch (error) {
    console.error('Error fetching homepage videos:', error);
    return res.status(500).json({ error: 'Failed to fetch homepage videos' });
  }
}

export async function streamVideo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const video = await HomepageVideo.findById(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const url = video.videoUrl;
    const isS3 = url.includes('amazonaws.com') && url.includes('eyeglaze_videos');

    if (isS3) {
      const bucketName = process.env.AWS_BUCKET_NAME || 'eyeglaze-bucket';
      
      // Parse key from URL (everything after amazonaws.com/)
      const s3Match = url.match(/https:\/\/[^\/]+\/(.+)/);
      if (!s3Match) {
        return res.status(400).json({ error: 'Invalid S3 URL format' });
      }
      const key = s3Match[1];

      const rangeHeader = req.headers.range;
      const s3Params: any = {
        Bucket: bucketName,
        Key: key,
      };
      
      if (rangeHeader) {
        s3Params.Range = rangeHeader;
      }

      const command = new GetObjectCommand(s3Params);
      const response = await s3Client.send(command);

      // Handle Range Requests (HTTP 206 Partial Content) for seeking/video progress
      if (rangeHeader && response.ContentRange) {
        res.status(206);
        res.setHeader('Content-Range', response.ContentRange);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', response.ContentLength || '');
      } else {
        res.status(200);
        res.setHeader('Content-Length', response.ContentLength || '');
      }

      res.setHeader('Content-Type', response.ContentType || 'video/mp4');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      if (response.Body) {
        (response.Body as any).pipe(res);
      } else {
        res.status(500).json({ error: 'No data stream returned from S3' });
      }
    } else {
      // For non-S3 URLs (YouTube/Vimeo or local file path redirects)
      return res.redirect(url);
    }
  } catch (error: any) {
    console.error('Error streaming video:', error);
    return res.status(500).json({ error: 'Streaming failed: ' + error.message });
  }
}
