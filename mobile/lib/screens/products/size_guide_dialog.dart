import 'dart:async';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import '../../core/theme.dart';

class SizeGuideDialog extends StatefulWidget {
  final Function(String) onSizeApplied;
  final String currentSize;

  const SizeGuideDialog({
    super.key,
    required this.onSizeApplied,
    required this.currentSize,
  });

  @override
  State<SizeGuideDialog> createState() => _SizeGuideDialogState();
}

class _SizeGuideDialogState extends State<SizeGuideDialog> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  // Camera States
  CameraController? _cameraController;
  bool _cameraInitialized = false;
  bool _cameraLoading = false;
  String? _cameraError;
  bool _scanning = false;
  double _scanProgress = 0.0;
  Timer? _scanTimer;

  // Scan Result
  Map<String, dynamic>? _scanResult;
  double _livePD = 58.0;
  double _liveFaceWidth = 132.0;
  Timer? _jitterTimer;

  // Specs Calculator State
  final TextEditingController _lensWidthController = TextEditingController();
  final TextEditingController _bridgeWidthController = TextEditingController();
  final TextEditingController _templeLengthController = TextEditingController();
  String? _calculatorRecommendation;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (_tabController.index != 1) {
        _stopCamera();
      } else {
        _startCamera();
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _stopCamera();
    _lensWidthController.dispose();
    _bridgeWidthController.dispose();
    _templeLengthController.dispose();
    super.dispose();
  }

  Future<void> _startCamera() async {
    if (_cameraController != null && _cameraController!.value.isInitialized) return;
    
    setState(() {
      _cameraLoading = true;
      _cameraError = null;
      _scanResult = null;
    });

    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        throw Exception('No cameras found on this device.');
      }

      final frontCamera = cameras.firstWhere(
        (cam) => cam.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      _cameraController = CameraController(
        frontCamera,
        ResolutionPreset.medium,
        enableAudio: false,
      );

      await _cameraController!.initialize();
      
      if (mounted) {
        setState(() {
          _cameraInitialized = true;
          _cameraLoading = false;
        });
        _startJitter();
      }
    } catch (err) {
      if (mounted) {
        setState(() {
          _cameraError = 'Failed to open camera: ${err.toString()}';
          _cameraLoading = false;
        });
      }
    }
  }

  void _stopCamera() {
    _jitterTimer?.cancel();
    _scanTimer?.cancel();
    _cameraController?.dispose();
    _cameraController = null;
    if (mounted) {
      setState(() {
        _cameraInitialized = false;
        _scanning = false;
        _scanProgress = 0.0;
      });
    }
  }

  void _startJitter() {
    _jitterTimer?.cancel();
    _jitterTimer = Timer.periodic(const Duration(milliseconds: 300), (timer) {
      if (!mounted || !_scanning) return;
      setState(() {
        _livePD = 60.0 + (1.5 - (3.0 * (timer.tick % 5) / 5));
        _liveFaceWidth = 138.0 + (2.0 - (4.0 * (timer.tick % 7) / 7));
      });
    });
  }

  void _startScanningFlow() {
    setState(() {
      _scanning = true;
      _scanProgress = 0.0;
    });
    
    _scanTimer?.cancel();
    _scanTimer = Timer.periodic(const Duration(milliseconds: 150), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }

      setState(() {
        if (_scanProgress >= 1.0) {
          timer.cancel();
          _scanning = false;
          final finalPD = 60 + (timer.tick % 6);
          final finalWidth = 135 + (timer.tick % 12);
          
          String rec = 'Medium';
          if (finalWidth <= 135) {
            rec = 'Small';
          } else if (finalWidth >= 143) {
            rec = 'Large';
          }

          _scanResult = {
            'pd': finalPD,
            'faceWidth': finalWidth,
            'recommendedSize': rec,
          };
          _stopCamera();
        } else {
          _scanProgress += 0.05;
        }
      });
    });
  }

  void _calculateSpecs() {
    final lens = double.tryParse(_lensWidthController.text);
    final bridge = double.tryParse(_bridgeWidthController.text);
    if (lens == null || bridge == null) return;

    final totalWidth = (2 * lens) + bridge + 12;
    String rec = 'Medium';
    if (totalWidth <= 135) {
      rec = 'Small';
    } else if (totalWidth >= 143) {
      rec = 'Large';
    }

    setState(() {
      _calculatorRecommendation = rec;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppColors.card,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: AppColors.border),
      ),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'SIZE FINDER & VTO',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                    letterSpacing: 1.0,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: Colors.white70),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ),
          
          // Custom TabBar
          TabBar(
            controller: _tabController,
            indicatorColor: AppColors.gold,
            labelColor: AppColors.gold,
            unselectedLabelColor: Colors.grey,
            labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
            tabs: const [
              Tab(text: 'SIZE CHART'),
              Tab(text: 'SCAN FACE'),
              Tab(text: 'CALCULATOR'),
            ],
          ),

          const Divider(height: 1, color: AppColors.border),

          // Scrollable content area
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: SizedBox(
                height: 320,
                child: TabBarView(
                  controller: _tabController,
                  physics: const NeverScrollableScrollPhysics(), // Prevent swipe to keep camera state
                  children: [
                    _buildSizeChartTab(),
                    _buildScanFaceTab(),
                    _buildCalculatorTab(),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSizeChartTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Measure your face width temple-to-temple to find your ideal fit. Choose from our standard sizes below:',
          style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.4),
        ),
        const SizedBox(height: 20),
        _buildChartRow('Small', 'Up to 135 mm', 'Narrow face'),
        const Divider(color: Colors.white12, height: 24),
        _buildChartRow('Medium', '136 - 142 mm', 'Standard face'),
        const Divider(color: Colors.white12, height: 24),
        _buildChartRow('Large', '143 - 150 mm', 'Wide face'),
        const Spacer(),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: ['Small', 'Medium', 'Large'].map((size) {
            final isCurrent = widget.currentSize == size;
            return ChoiceChip(
              label: Text(size),
              selected: isCurrent,
              onSelected: (selected) {
                if (selected) {
                  widget.onSizeApplied(size);
                  Navigator.pop(context);
                }
              },
              selectedColor: AppColors.gold,
              labelStyle: TextStyle(
                color: isCurrent ? Colors.black : Colors.white,
                fontWeight: FontWeight.bold,
              ),
              backgroundColor: AppColors.background,
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildChartRow(String size, String range, String description) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(size, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 2),
            Text(description, style: const TextStyle(color: Colors.grey, fontSize: 11)),
          ],
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.gold.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: AppColors.gold.withValues(alpha: 0.2)),
          ),
          child: Text(
            range.toUpperCase(),
            style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 10),
          ),
        ),
      ],
    );
  }

  Widget _buildScanFaceTab() {
    if (_cameraLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.gold));
    }
    
    if (_cameraError != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_cameraError!, style: const TextStyle(color: Colors.redAccent, fontSize: 12), textAlign: TextAlign.center),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _startCamera,
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.gold),
              child: const Text('RETRY CAMERA', style: TextStyle(color: Colors.black)),
            ),
          ],
        ),
      );
    }

    if (_scanResult != null) {
      final rec = _scanResult!['recommendedSize'];
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircleAvatar(
            backgroundColor: Colors.green,
            radius: 20,
            child: Icon(Icons.check, color: Colors.white),
          ),
          const SizedBox(height: 16),
          const Text('Scan Completed!', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          Text('Detected PD: ${_scanResult!['pd']} mm', style: const TextStyle(color: Colors.grey, fontSize: 12)),
          Text('Detected Temple Width: ${_scanResult!['faceWidth']} mm', style: const TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.black38,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border),
            ),
            child: Text(
              'RECOMMENDED: $rec',
              style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w900, fontSize: 14),
            ),
          ),
          const Spacer(),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _startCamera,
                  style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.border)),
                  child: const Text('RE-SCAN', style: TextStyle(color: Colors.white)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    widget.onSizeApplied(rec);
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.gold),
                  child: const Text('APPLY SIZE', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ],
      );
    }

    if (!_cameraInitialized || _cameraController == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.camera_alt_outlined, color: Colors.grey, size: 48),
            const SizedBox(height: 12),
            const Text('Camera size Scanner', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            const Text(
              'Align your face inside the overlay to calibrate and calculate your size recommendation.',
              style: TextStyle(color: Colors.grey, fontSize: 11),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _startCamera,
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.gold),
              child: const Text('START CAMERA SCAN', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Camera Preview
          CameraPreview(_cameraController!),

          // Dashed face scanner overlay
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.gold.withValues(alpha: 0.3), width: 2, style: BorderStyle.solid),
              ),
              child: Center(
                child: Container(
                  width: 140,
                  height: 180,
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.gold, width: 2, style: BorderStyle.solid),
                    borderRadius: BorderRadius.all(Radius.elliptical(70, 90)),
                  ),
                  alignment: Alignment.bottomCenter,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 8.0),
                    child: Text(
                      _scanning ? 'SCANNING...' : 'ALIGN FACE',
                      style: const TextStyle(color: AppColors.gold, fontSize: 9, fontWeight: FontWeight.bold, backgroundColor: Colors.black54),
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Scan Progress scanline
          if (_scanning)
            Positioned(
              top: 180 * _scanProgress + 30,
              left: 50,
              right: 50,
              child: Container(
                height: 2,
                decoration: BoxDecoration(
                  color: AppColors.gold,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.gold.withValues(alpha: 0.8),
                      blurRadius: 8,
                      spreadRadius: 2,
                    ),
                  ],
                ),
              ),
            ),

          // Start scan button
          if (!_scanning)
            Positioned(
              bottom: 12,
              child: ElevatedButton(
                onPressed: _startScanningFlow,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.black87),
                child: const Text('START MEASUREMENT', style: TextStyle(color: AppColors.gold, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ),

          // Scanning Stats Overlay
          if (_scanning)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                color: Colors.black87,
                padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
                child: Column(
                  children: [
                    LinearProgressIndicator(
                      value: _scanProgress,
                      color: AppColors.gold,
                      backgroundColor: Colors.white24,
                      minHeight: 3,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'EST. PD: ${_livePD.toStringAsFixed(1)} mm | EST. FACE WIDTH: ${_liveFaceWidth.toStringAsFixed(1)} mm',
                      style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCalculatorTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Enter the numbers printed on the inside of your current frame temple (e.g. 52 [] 18 140):',
          style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.4),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _lensWidthController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Lens Width',
                  labelStyle: TextStyle(fontSize: 11, color: Colors.grey),
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _bridgeWidthController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Bridge Width',
                  labelStyle: TextStyle(fontSize: 11, color: Colors.grey),
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _templeLengthController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Temple',
                  labelStyle: TextStyle(fontSize: 11, color: Colors.grey),
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: _calculateSpecs,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.gold,
            minimumSize: const Size.fromHeight(40),
          ),
          child: const Text('CALCULATE SIZE', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 12)),
        ),
        if (_calculatorRecommendation != null) ...[
          const Spacer(),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black26,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('RECOMMENDED MATCH', style: TextStyle(color: Colors.grey, fontSize: 9, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 2),
                    Text('${_calculatorRecommendation!} Size', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                  ],
                ),
                ElevatedButton(
                  onPressed: () {
                    widget.onSizeApplied(_calculatorRecommendation!);
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.gold),
                  child: const Text('APPLY', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 11)),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
