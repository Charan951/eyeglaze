import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../../core/theme.dart';
import '../../models/reel.dart';
import '../../core/app_config.dart';

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

          if (widget.reel.title.isNotEmpty)
            Positioned(
              left: 16,
              right: 16,
              bottom: 40,
              child: Text(
                widget.reel.title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
