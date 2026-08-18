export function getEmbedUrl(url: string) {
  if (!url) return '';
  const ytMatch = url.match(
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  );
  if (ytMatch && ytMatch[2].length === 11) {
    return `https://www.youtube.com/embed/${ytMatch[2]}`;
  }
  const vimeoMatch = url.match(
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/
  );
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return url;
}

export function isDirectVideo(url: string) {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo.com')) {
    return false;
  }
  const ext = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
  const cleanUrl = lower.split('?')[0];
  return ext.some((e) => cleanUrl.endsWith(e)) || lower.includes('/uploads/') || lower.includes('/stream/');
}
