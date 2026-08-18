import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_player/video_player.dart';
import '../core/app_config.dart';
import '../core/theme.dart';
import '../models/reel.dart';
import '../screens/home/reels_viewer_screen.dart';
import '../screens/products/products_screen.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/socket_service.dart';

class SignatureShapesSection extends StatefulWidget {
  const SignatureShapesSection({super.key});

  @override
  State<SignatureShapesSection> createState() => _SignatureShapesSectionState();
}

class _SignatureShapesSectionState extends State<SignatureShapesSection> {
  static const _fallback = [
    {'name': 'Hexagonal', 'slug': 'hexagonal'},
    {'name': 'Rectangle', 'slug': 'rectangle'},
    {'name': 'Round', 'slug': 'round'},
    {'name': 'Aviator', 'slug': 'aviator'},
    {'name': 'Cat-Eye', 'slug': 'cateye'},
    {'name': 'Clubmaster', 'slug': 'clubmaster'},
  ];

  List<Map<String, dynamic>> _shapes = const [];

  @override
  void initState() {
    super.initState();
    _load();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<SocketService>().socket?.on('shape_changed', _onChanged);
    });
  }

  @override
  void dispose() {
    try {
      context.read<SocketService>().socket?.off('shape_changed', _onChanged);
    } catch (_) {}
    super.dispose();
  }

  void _onChanged(dynamic _) {
    if (mounted) _load();
  }

  Future<void> _load() async {
    try {
      final api = ApiService(context.read<AuthService>());
      final list = await api.getShapes();
      final mapped = list
          .whereType<Map>()
          .map((raw) => Map<String, dynamic>.from(raw))
          .where((shape) => (shape['status'] ?? 'Active') != 'Inactive')
          .toList();
      mapped.sort((a, b) =>
          ((a['displayOrder'] as num?) ?? 0).compareTo((b['displayOrder'] as num?) ?? 0));
      if (mounted) setState(() => _shapes = mapped);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final shapes = _shapes.isNotEmpty ? _shapes : _fallback;
    return _HomeSection(
      title: 'Find Your Signature Shape',
      subtitle: 'Select a geometry that highlights your face',
      child: SizedBox(
        height: 128,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: shapes.length,
          separatorBuilder: (_, _) => const SizedBox(width: 18),
          itemBuilder: (context, i) {
            final shape = shapes[i];
            final name = (shape['name'] ?? '').toString();
            final slug = (shape['slug'] ?? name).toString();
            final image = (shape['image'] ?? '').toString();
            return GestureDetector(
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ProductsScreen(shape: slug, initialTitle: name),
                ),
              ),
              child: SizedBox(
                width: 90,
                child: Column(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.card,
                        border: Border.all(color: AppColors.border),
                      ),
                      child: ClipOval(
                        child: image.isEmpty
                            ? const Icon(Icons.visibility_outlined, color: AppColors.muted)
                            : CachedNetworkImage(
                                imageUrl: AppConfig.resolveImageUrl(image),
                                fit: BoxFit.cover,
                                errorWidget: (_, _, _) => const Icon(
                                  Icons.visibility_outlined,
                                  color: AppColors.muted,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      name.toUpperCase(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: AppColors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class HowToBuySection extends StatefulWidget {
  const HowToBuySection({super.key});

  @override
  State<HowToBuySection> createState() => _HowToBuySectionState();
}

class _HowToBuySectionState extends State<HowToBuySection> {
  List<Map<String, dynamic>> _videos = const [];

  @override
  void initState() {
    super.initState();
    _load();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<SocketService>().socket?.on('homepage_video_changed', _onChanged);
    });
  }

  @override
  void dispose() {
    try {
      context.read<SocketService>().socket?.off('homepage_video_changed', _onChanged);
    } catch (_) {}
    super.dispose();
  }

  void _onChanged(dynamic _) {
    if (mounted) _load();
  }

  Future<void> _load() async {
    try {
      final api = ApiService(context.read<AuthService>());
      final list = await api.getHomepageVideos();
      final mapped = list
          .whereType<Map>()
          .map((raw) => Map<String, dynamic>.from(raw))
          .where((video) => video['isActive'] != false)
          .toList();
      mapped.sort((a, b) =>
          ((a['displayOrder'] as num?) ?? 0).compareTo((b['displayOrder'] as num?) ?? 0));
      if (mounted) setState(() => _videos = mapped);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return _HomeSection(
      title: 'How to Buy Your Glasses',
      subtitle: 'Explore our journey and customer stories',
      child: _videos.isEmpty
          ? Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.videocam_outlined, color: AppColors.muted, size: 28),
                    SizedBox(height: 8),
                    Text(
                      'Videos will appear here once activated by admin.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.muted, fontSize: 12),
                    ),
                  ],
                ),
              ),
            )
          : SizedBox(
              height: 268,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _videos.length,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (context, i) {
                  final video = _videos[i];
                  final title = (video['title'] ?? '').toString();
                  final description = (video['description'] ?? '').toString();
                  final url = (video['videoUrl'] ?? '').toString();
                  return GestureDetector(
                    onTap: () => openMediaUrl(context, url, title),
                    child: Container(
                      width: MediaQuery.of(context).size.width * 0.72,
                      decoration: BoxDecoration(
                        color: AppColors.card,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: ClipRRect(
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                              child: Stack(
                                fit: StackFit.expand,
                                children: [
                                  _VideoThumb(url: url),
                                  Container(color: Colors.black.withValues(alpha: 0.25)),
                                  const Center(
                                    child: CircleAvatar(
                                      radius: 18,
                                      backgroundColor: Color(0x99000000),
                                      child: Icon(Icons.play_arrow, color: Colors.white, size: 22),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'CUSTOMER STORY',
                                  style: TextStyle(
                                    color: AppColors.gold,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  title,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: AppColors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                if (description.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    description,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: AppColors.muted, fontSize: 10, height: 1.35),
                                  ),
                                ],
                                const SizedBox(height: 10),
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: AppColors.border),
                                  ),
                                  child: const Text(
                                    'WATCH SHOWCASE',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      color: AppColors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.8,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}

class HomeFaqSection extends StatefulWidget {
  const HomeFaqSection({super.key});

  @override
  State<HomeFaqSection> createState() => _HomeFaqSectionState();
}

class _HomeFaqSectionState extends State<HomeFaqSection> {
  static const _faqs = [
    (
      q: 'How do I find my frame size?',
      a: 'We offer an interactive Frame Size Guide directly on this home page! You can also check the inside temple of your current glasses for numbers like 52-18-140 (lens width, bridge width, temple length) to match your size.',
    ),
    (
      q: 'Can I buy frames with prescription lenses?',
      a: 'Absolutely! You can choose "Buy with Lens" on any product page. We custom-grind single-vision, bifocal, or progressive lenses in our digital labs with anti-glare, blue-light block, or photochromic coatings.',
    ),
    (
      q: 'How does the Free Home Eye Test work?',
      a: 'Simply click "Book Free Home Eye Test" below, choose your preferred date, time, and address. Our certified optometrist will visit with advanced mobile testing equipment and a collection of 150+ frames to try on!',
    ),
    (
      q: 'What is your return and warranty policy?',
      a: 'We offer a 7-day no-questions-asked return policy and a 1-year warranty on all frames and lenses against manufacturing defects. Shipping and returns are completely free!',
    ),
  ];

  int? _open;

  @override
  Widget build(BuildContext context) {
    return _HomeSection(
      title: 'Frequently Asked Questions',
      subtitle: 'Everything you need to know about buying glasses online',
      paddedChild: true,
      centered: true,
      child: Column(
        children: List.generate(_faqs.length, (i) {
          final faq = _faqs[i];
          final open = _open == i;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  InkWell(
                    onTap: () => setState(() => _open = open ? null : i),
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              faq.q.toUpperCase(),
                              style: const TextStyle(
                                color: AppColors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.3,
                              ),
                            ),
                          ),
                          AnimatedRotation(
                            turns: open ? 0.5 : 0,
                            duration: const Duration(milliseconds: 200),
                            child: const Icon(Icons.keyboard_arrow_down, color: AppColors.gold, size: 20),
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (open)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
                      child: Text(
                        faq.a,
                        style: const TextStyle(color: AppColors.muted, fontSize: 12, height: 1.45),
                      ),
                    ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}

class HomeReelsSection extends StatefulWidget {
  const HomeReelsSection({super.key});

  @override
  State<HomeReelsSection> createState() => _HomeReelsSectionState();
}

class _HomeReelsSectionState extends State<HomeReelsSection> {
  List<Reel> _reels = const [];

  @override
  void initState() {
    super.initState();
    _load();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<SocketService>().socket?.on('reel_changed', _onChanged);
    });
  }

  @override
  void dispose() {
    try {
      context.read<SocketService>().socket?.off('reel_changed', _onChanged);
    } catch (_) {}
    super.dispose();
  }

  void _onChanged(dynamic _) {
    if (mounted) _load();
  }

  Future<void> _load() async {
    try {
      final api = ApiService(context.read<AuthService>());
      final list = await api.getReels();
      final reels = list
          .whereType<Map>()
          .map((raw) => Reel.fromJson(Map<String, dynamic>.from(raw)))
          .where((reel) => reel.isActive && reel.videoUrl.isNotEmpty)
          .toList();
      reels.sort((a, b) => a.displayOrder.compareTo(b.displayOrder));
      if (mounted) setState(() => _reels = reels);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (_reels.isEmpty) return const SizedBox.shrink();
    return _HomeSection(
      title: 'EyeGlaze Reels',
      subtitle: 'Trending styles, lookbooks and details',
      child: SizedBox(
        height: 280,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: _reels.length,
          separatorBuilder: (_, _) => const SizedBox(width: 12),
          itemBuilder: (context, i) {
            final reel = _reels[i];
            return GestureDetector(
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ReelsViewerScreen(reels: _reels, initialIndex: i),
                ),
              ),
              child: Container(
                width: 160,
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    _VideoThumb(url: reel.videoUrl),
                    const DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Colors.transparent, Colors.black87],
                        ),
                      ),
                    ),
                    const Center(
                      child: CircleAvatar(
                        radius: 18,
                        backgroundColor: Color(0x99000000),
                        child: Icon(Icons.play_arrow, color: Colors.white, size: 22),
                      ),
                    ),
                    Positioned(
                      left: 10,
                      right: 10,
                      bottom: 12,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            reel.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppColors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          if ((reel.description ?? '').isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              reel.description!,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: AppColors.muted, fontSize: 10),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _HomeSection extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget child;
  final bool paddedChild;
  final bool centered;

  const _HomeSection({
    required this.title,
    required this.subtitle,
    required this.child,
    this.paddedChild = false,
    this.centered = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 16),
      child: Column(
        crossAxisAlignment: centered ? CrossAxisAlignment.center : CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Column(
              crossAxisAlignment: centered ? CrossAxisAlignment.center : CrossAxisAlignment.start,
              children: [
                Text(
                  title.toUpperCase(),
                  textAlign: centered ? TextAlign.center : TextAlign.left,
                  style: const TextStyle(
                    color: AppColors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle.toUpperCase(),
                  textAlign: centered ? TextAlign.center : TextAlign.left,
                  style: const TextStyle(
                    color: AppColors.muted,
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.9,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          paddedChild ? Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: child) : child,
        ],
      ),
    );
  }
}

class _VideoThumb extends StatelessWidget {
  final String url;
  const _VideoThumb({required this.url});

  @override
  Widget build(BuildContext context) {
    final resolved = AppConfig.resolveImageUrl(url);
    final thumb = youtubeThumb(url);
    if (thumb != null) {
      return CachedNetworkImage(
        imageUrl: thumb,
        fit: BoxFit.cover,
        errorWidget: (_, _, _) => const ColoredBox(color: Color(0xFF131314)),
      );
    }
    if (isImageUrl(url)) {
      return CachedNetworkImage(
        imageUrl: resolved,
        fit: BoxFit.cover,
        errorWidget: (_, _, _) => const ColoredBox(color: Color(0xFF131314)),
      );
    }
    if (isDirectVideo(url)) {
      return _MutedVideoPreview(url: resolved);
    }
    return CachedNetworkImage(
      imageUrl: resolved,
      fit: BoxFit.cover,
      errorWidget: (_, _, _) => _MutedVideoPreview(url: resolved),
    );
  }
}

class _MutedVideoPreview extends StatefulWidget {
  final String url;
  const _MutedVideoPreview({required this.url});

  @override
  State<_MutedVideoPreview> createState() => _MutedVideoPreviewState();
}

class _MutedVideoPreviewState extends State<_MutedVideoPreview> {
  VideoPlayerController? _controller;
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.url))
      ..setVolume(0)
      ..initialize().then((_) {
        if (!mounted) return;
        _controller?.pause();
        setState(() => _ready = true);
      }).catchError((_) {});
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_ready || _controller == null || _controller!.value.size.width == 0) {
      return const ColoredBox(color: Color(0xFF131314));
    }
    return ClipRect(
      child: SizedBox.expand(
        child: FittedBox(
          fit: BoxFit.cover,
          child: SizedBox(
            width: _controller!.value.size.width,
            height: _controller!.value.size.height,
            child: VideoPlayer(_controller!),
          ),
        ),
      ),
    );
  }
}

String? youtubeId(String url) {
  final match = RegExp(
    r'(?:youtu\.be/|youtube\.com/(?:embed/|v/|watch\?v=|watch\?.+&v=))([^#&?]{11})',
    caseSensitive: false,
  ).firstMatch(url);
  return match?.group(1);
}

String? youtubeThumb(String url) {
  final id = youtubeId(url);
  if (id == null) return null;
  return 'https://img.youtube.com/vi/$id/hqdefault.jpg';
}

bool isImageUrl(String url) {
  final clean = url.toLowerCase().split('?').first;
  const exts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
  return exts.any(clean.endsWith);
}

bool isDirectVideo(String url) {
  final lower = url.toLowerCase();
  if (lower.contains('youtube.com') || lower.contains('youtu.be') || lower.contains('vimeo.com')) {
    return false;
  }
  if (isImageUrl(url)) return false;
  final clean = lower.split('?').first;
  const exts = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
  return exts.any(clean.endsWith) || lower.contains('/uploads/') || lower.contains('/stream/');
}

Future<void> openMediaUrl(BuildContext context, String url, String title) async {
  if (url.isEmpty) return;
  if (isDirectVideo(url)) {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => _DirectVideoPage(url: url, title: title)),
    );
    return;
  }
  final uri = Uri.tryParse(url);
  if (uri == null) return;
  final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!launched && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Unable to open this video.'), backgroundColor: AppColors.error),
    );
  }
}

class _DirectVideoPage extends StatefulWidget {
  final String url;
  final String title;
  const _DirectVideoPage({required this.url, required this.title});

  @override
  State<_DirectVideoPage> createState() => _DirectVideoPageState();
}

class _DirectVideoPageState extends State<_DirectVideoPage> {
  VideoPlayerController? _controller;
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    final resolved = AppConfig.resolveImageUrl(widget.url);
    _controller = VideoPlayerController.networkUrl(Uri.parse(resolved))
      ..initialize().then((_) {
        if (!mounted) return;
        setState(() => _ready = true);
        _controller?.setLooping(true);
        _controller?.play();
      }).catchError((_) {});
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text(widget.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
      ),
      body: Center(
        child: _ready && _controller != null
            ? AspectRatio(
                aspectRatio: _controller!.value.aspectRatio == 0 ? 16 / 9 : _controller!.value.aspectRatio,
                child: GestureDetector(
                  onTap: () {
                    final playing = _controller!.value.isPlaying;
                    setState(() => playing ? _controller!.pause() : _controller!.play());
                  },
                  child: VideoPlayer(_controller!),
                ),
              )
            : const CircularProgressIndicator(color: AppColors.gold),
      ),
    );
  }
}
