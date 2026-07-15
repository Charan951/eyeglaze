import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../../core/theme.dart';
import '../../models/reel.dart';
import '../../core/app_config.dart';
import '../products/products_screen.dart';

class ReelsViewerScreen extends StatefulWidget {
  final List<Reel> reels;
  final int initialIndex;

  const ReelsViewerScreen({
    super.key,
    required this.reels,
    this.initialIndex = 0,
  });

  @override
  State<ReelsViewerScreen> createState() => _ReelsViewerScreenState();
}

class _ReelsViewerScreenState extends State<ReelsViewerScreen> {
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.reels.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
        ),
        body: const Center(
          child: Text(
            'No Reels available',
            style: TextStyle(color: AppColors.muted),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          PageView.builder(
            scrollDirection: Axis.vertical,
            controller: _pageController,
            itemCount: widget.reels.length,
            itemBuilder: (context, index) {
              return _ReelPageItem(reel: widget.reels[index]);
            },
          ),
          // Close button at top left
          Positioned(
            top: MediaQuery.of(context).padding.top + 12,
            left: 16,
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Colors.black54,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.arrow_back,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ReelPageItem extends StatefulWidget {
  final Reel reel;
  const _ReelPageItem({required this.reel});

  @override
  State<_ReelPageItem> createState() => _ReelPageItemState();
}

class _ReelPageItemState extends State<_ReelPageItem> {
  VideoPlayerController? _controller;
  bool _initialized = false;
  bool _isPlaying = true;

  @override
  void initState() {
    super.initState();
    _initVideo();
  }

  void _initVideo() {
    final videoUrl = AppConfig.resolveImageUrl(widget.reel.videoUrl);
    _controller = VideoPlayerController.networkUrl(Uri.parse(videoUrl))
      ..initialize().then((_) {
        if (mounted) {
          setState(() {
            _initialized = true;
          });
          _controller?.setLooping(true);
          _controller?.play();
        }
      }).catchError((err) {
        debugPrint('Error loading reel video: $err');
      });
  }

  @override
  void dispose() {
    _controller?.pause();
    _controller?.dispose();
    super.dispose();
  }

  void _togglePlay() {
    if (_controller == null || !_controller!.value.isInitialized) return;
    setState(() {
      if (_isPlaying) {
        _controller?.pause();
        _isPlaying = false;
      } else {
        _controller?.play();
        _isPlaying = true;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _togglePlay,
      behavior: HitTestBehavior.opaque,
      child: Stack(
        children: [
          // Video background
          if (_initialized && _controller != null)
            SizedBox.expand(
              child: FittedBox(
                fit: BoxFit.cover,
                child: SizedBox(
                  width: _controller!.value.size.width,
                  height: _controller!.value.size.height,
                  child: VideoPlayer(_controller!),
                ),
              ),
            )
          else
            const Center(
              child: CircularProgressIndicator(color: AppColors.gold),
            ),

          // Play icon indicator when paused
          if (!_isPlaying)
            const Center(
              child: Icon(
                Icons.play_arrow,
                color: Colors.white70,
                size: 72,
              ),
            ),

          // Dark gradient overlay on bottom
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    Colors.transparent,
                    Colors.black54,
                    Colors.black87,
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),

          // Text details overlay
          Positioned(
            bottom: 40,
            left: 16,
            right: 16,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.reel.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (widget.reel.description != null && widget.reel.description!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    widget.reel.description!,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 13,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 16),
                // Premium look gold accented card representing product
                GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ProductsScreen()),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.shopping_bag_outlined, color: AppColors.gold, size: 20),
                        const SizedBox(width: 8),
                        const Expanded(
                          child: Text(
                            'View Featured Frame',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.gold,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'VIEW',
                            style: TextStyle(
                              color: Colors.black,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
