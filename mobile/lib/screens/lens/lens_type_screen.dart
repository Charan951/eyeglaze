import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme.dart';
import '../../core/app_config.dart';
import '../../widgets/lens_step_bar.dart';
import '../../widgets/lens_wizard_state.dart';
import '../../widgets/gold_button.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../models/product.dart';
import 'lens_quality_screen.dart';

class LensTypeScreen extends StatefulWidget {
  const LensTypeScreen({super.key});

  @override
  State<LensTypeScreen> createState() => _LensTypeScreenState();
}

class _LensTypeScreenState extends State<LensTypeScreen> {
  String? _selected = 'single_vision';
  bool _loading = false;
  List<dynamic> _types = [];

  final _fallbackTypes = [
    {
      'type': 'single_vision',
      'displayName': 'Single Vision',
      'description': 'Best for distance or near vision with a single power throughout the lens.',
      'startingPrice': 699,
      'isBestseller': true,
    },
    {
      'type': 'progressive',
      'displayName': 'Progressive',
      'description': 'Clear vision at all distances (near, intermediate & far) without visible lines.',
      'startingPrice': 2499,
      'isBestseller': false,
    },
    {
      'type': 'zero_power',
      'displayName': 'Zero Power (Plano)',
      'description': 'For style only without any power.',
      'startingPrice': 699,
      'isBestseller': false,
    },
    {
      'type': 'bluecut',
      'displayName': 'Blue Cut',
      'description': 'Filters harmful blue light from digital screens.',
      'startingPrice': 899,
      'isBestseller': false,
    },
    {
      'type': 'photochromic',
      'displayName': 'Photochromic',
      'description': 'Automatically adjusts to light. Darkens in sun, clear indoors.',
      'startingPrice': 1499,
      'isBestseller': false,
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadLensTypes();
  }

  Future<void> _loadLensTypes() async {
    setState(() => _loading = true);
    final wizard = context.read<LensWizardState>();
    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      final product = wizard.product;
      if (product == null) return;

      // Fetch product details (to get custom lenses & lensTypes list)
      // and general lens options in parallel
      final results = await Future.wait([
        api.getProduct(product.id),
        api.getLensOptions(),
      ]);

      final productRes = results[0] as Map<String, dynamic>;
      final lensRes = results[1] as List<dynamic>;

      final customLensesList = productRes['lenses'] as List<dynamic>? ?? [];
      final prodData = productRes['product'] ?? productRes;
      final lensTypesFromProduct = prodData['lensTypes'] as List<dynamic>? ?? [];

      // Save custom lenses in state & map lens types
      wizard.setProductAndLenses(
        p: product,
        color: wizard.selectedColor ?? 'Matte Black',
        lensesList: customLensesList,
        lensTypesFromApi: lensTypesFromProduct,
      );

      // Extract general types & filter by compatibility
      var types = lensRes.where((o) => o['kind'] == 'type' && o['subType'] == null).toList();
      if (types.isEmpty) {
        types = List.from(_fallbackTypes);
      }

      if (product.compatible != null) {
        final comp = product.compatible!;
        types = types.where((t) {
          final tName = (t['type'] ?? t['name'] ?? '').toString().toLowerCase();
          if (tName.contains('single_vision') || tName.contains('single vision')) {
            return comp.prescription;
          }
          if (tName.contains('progressive')) {
            return comp.progressive;
          }
          if (tName.contains('zero_power') || tName.contains('zero power') || tName.contains('plano')) {
            return comp.zeropower;
          }
          if (tName.contains('bluecut') || tName.contains('blue cut')) {
            return comp.bluecut;
          }
          if (tName.contains('photochromic') || tName.contains('transition')) {
            return comp.prescription;
          }
          return true;
        }).toList();
      }

      if (mounted) {
        setState(() {
          _types = types;

          final availableTypes = wizard.mappedLensTypes.isNotEmpty ? wizard.mappedLensTypes : _types;
          if (availableTypes.isNotEmpty) {
            // Find default selection (prefer single vision if available, otherwise first)
            final defaultType = availableTypes.firstWhere(
              (t) => t['type'] == 'single_vision',
              orElse: () => availableTypes.first,
            );
            _selected = defaultType['type'];
          } else {
            _selected = null;
          }
        });
      }
    } catch (e) {
      debugPrint('Failed to load dynamic lens configurations: $e');
      final product = wizard.product;
      var types = List<dynamic>.from(_fallbackTypes);
      if (product != null && product.compatible != null) {
        final comp = product.compatible!;
        types = types.where((t) {
          final tStr = t['type'] as String;
          if (tStr == 'single_vision') return comp.prescription;
          if (tStr == 'progressive') return comp.progressive;
          if (tStr == 'zero_power') return comp.zeropower;
          if (tStr == 'bluecut') return comp.bluecut;
          if (tStr == 'photochromic') return comp.prescription;
          return true;
        }).toList();
      }
      if (mounted) {
        setState(() {
          _types = types;
          if (_types.isNotEmpty) {
            final defaultType = _types.firstWhere(
              (t) => t['type'] == 'single_vision',
              orElse: () => _types.first,
            );
            _selected = defaultType['type'];
          } else {
            _selected = null;
          }
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _getLifestyleImage(String type) {
    switch (type) {
      case 'single_vision':
        return '/images/scenic_road.png';
      case 'progressive':
        return '/images/reading_book.png';
      case 'zero_power':
        return '/images/zero_power_glasses.png';
      case 'bluecut':
        return '/images/laptop_screen.png';
      case 'photochromic':
        return '/images/transition_lens.png';
      default:
        return '/images/cat_prescription.png';
    }
  }

  @override
  Widget build(BuildContext context) {
    final wizard = context.watch<LensWizardState>();
    final product = wizard.product;
    final availableTypes = wizard.mappedLensTypes.isNotEmpty ? wizard.mappedLensTypes : _types;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('Configure Lenses', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold)),
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: AppColors.white), onPressed: () => Navigator.pop(context)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.gold))
          : Column(
              children: [
                const LensStepBar(currentStep: 1),
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Mini product card
                        if (product != null)
                          _MiniProductCard(
                            product: product,
                            color: wizard.selectedColor ?? 'Matte Black',
                            size: wizard.sizeString,
                          ),
                        // Section header
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Buy With Lens', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 18)),
                              SizedBox(height: 4),
                              Text('Select lens type that suits your lifestyle', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                            ],
                          ),
                        ),
                        // Lens type list
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: availableTypes.length,
                          itemBuilder: (_, i) {
                            final lt = availableTypes[i];
                            final typeStr = lt['type'] as String;
                            final isSelected = _selected == typeStr;
                            final isBestseller = lt['isBestseller'] as bool? ?? false;

                            return GestureDetector(
                              onTap: () => setState(() => _selected = typeStr),
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppColors.card,
                                  border: Border.all(color: isSelected ? AppColors.gold : AppColors.border, width: isSelected ? 2 : 1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Stack(
                                  children: [
                                    Row(
                                      children: [
                                        // Left Diagram
                                        _LensDiagramWidget(type: typeStr),
                                        const SizedBox(width: 12),
                                        // Center Details
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  Expanded(
                                                    child: Text(
                                                      lt['displayName'] ?? lt['name'] ?? '',
                                                      style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                  if (isBestseller) ...[
                                                    const SizedBox(width: 6),
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                      decoration: BoxDecoration(
                                                        color: AppColors.gold.withValues(alpha: 0.15),
                                                        border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
                                                        borderRadius: BorderRadius.circular(4),
                                                      ),
                                                      child: const Text('BESTSELLER', style: TextStyle(color: AppColors.gold, fontSize: 8, fontWeight: FontWeight.bold)),
                                                    ),
                                                  ],
                                                ],
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                lt['description'] ?? '',
                                                style: const TextStyle(color: AppColors.muted, fontSize: 10, height: 1.3),
                                              ),
                                              const SizedBox(height: 6),
                                              Text(
                                                'Starts from ₹${(lt['startingPrice'] ?? lt['price'] ?? 699).toInt()}',
                                                style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w900, fontSize: 12),
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        // Right Thumbnail
                                        Container(
                                          width: 80,
                                          height: 52,
                                          decoration: BoxDecoration(
                                            color: AppColors.background,
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: AppColors.border.withValues(alpha: 0.6)),
                                          ),
                                          child: ClipRRect(
                                            borderRadius: BorderRadius.circular(8),
                                            child: CachedNetworkImage(
                                              imageUrl: AppConfig.resolveImageUrl(_getLifestyleImage(typeStr)),
                                              fit: BoxFit.cover,
                                              placeholder: (context, url) => const Center(
                                                child: SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: AppColors.gold, strokeWidth: 1.5)),
                                              ),
                                              errorWidget: (context, url, error) => const Icon(Icons.image_outlined, color: AppColors.muted),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (isSelected)
                                      Positioned(
                                        top: 0,
                                        right: 0,
                                        child: Container(
                                          width: 16,
                                          height: 16,
                                          decoration: const BoxDecoration(color: AppColors.gold, shape: BoxShape.circle),
                                          child: const Center(child: Icon(Icons.check, color: Colors.black, size: 10)),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                        // Trust badges strip
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                            decoration: BoxDecoration(
                              color: AppColors.card.withValues(alpha: 0.4),
                              border: Border.all(color: AppColors.border.withValues(alpha: 0.3)),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              children: [
                                _FooterBadge(icon: Icons.wb_sunny_outlined, label: '100% UV Protection'),
                                _FooterBadge(icon: Icons.verified_outlined, label: '1 Year Warranty'),
                                _FooterBadge(icon: Icons.shield_outlined, label: 'Scratch Resistant'),
                                _FooterBadge(icon: Icons.replay, label: 'Easy Return'),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 80),
                      ],
                    ),
                  ),
                ),
                // Footer & Button CTA
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: const BoxDecoration(
                    color: AppColors.card,
                    border: Border(top: BorderSide(color: AppColors.border)),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      GoldButton(
                        label: 'CONTINUE TO QUALITY →',
                        onPressed: _selected == null
                            ? null
                            : () {
                                final selectedOption = availableTypes.firstWhere((t) => t['type'] == _selected);
                                final wizard = context.read<LensWizardState>();
                                
                                wizard.setLensType(
                                  _selected!,
                                  subType: selectedOption['subType'] as String?,
                                  typeId: selectedOption['_id']?.toString(),
                                  displayName: selectedOption['displayName'] ?? selectedOption['name'] ?? '',
                                );
                                
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => ChangeNotifierProvider.value(
                                      value: wizard,
                                      child: const LensQualityScreen(),
                                    ),
                                  ),
                                );
                              },
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'All lenses are from Lenskart | Trusted quality, perfect clarity',
                        style: TextStyle(color: AppColors.muted, fontSize: 10),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}

class _MiniProductCard extends StatelessWidget {
  final Product product;
  final String color;
  final String size;

  const _MiniProductCard({required this.product, required this.color, required this.size});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 72,
            height: 52,
            decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(8)),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: product.images.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: AppConfig.resolveImageUrl(product.images.first),
                      fit: BoxFit.contain,
                      placeholder: (context, url) => const Center(
                        child: SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: AppColors.gold, strokeWidth: 1.5)),
                      ),
                      errorWidget: (context, url, error) => const Icon(Icons.broken_image_outlined, color: AppColors.muted),
                    )
                  : const Icon(Icons.visibility_outlined, color: AppColors.muted),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${product.sku} | ${product.name}', style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text('Color: $color', style: const TextStyle(color: AppColors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                Text('Size: $size', style: AppTextStyles.muted),
                const Text('Lens: Not Selected', style: TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.gold.withValues(alpha: 0.4)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('Change Frame', style: TextStyle(color: AppColors.gold, fontSize: 10, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}

class _FooterBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  const _FooterBadge({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) => Column(
        children: [
          Icon(icon, color: AppColors.gold, size: 16),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 8), textAlign: TextAlign.center),
        ],
      );
}

class _LensDiagramWidget extends StatelessWidget {
  final String type;
  const _LensDiagramWidget({required this.type});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: AppColors.background,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.border, width: 1),
      ),
      child: CustomPaint(
        painter: _LensDiagramPainter(type: type),
      ),
    );
  }
}

class _LensDiagramPainter extends CustomPainter {
  final String type;
  _LensDiagramPainter({required this.type});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    final basePaint = Paint()
      ..color = AppColors.border.withValues(alpha: 0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    final goldPaint = Paint()
      ..color = AppColors.gold
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    canvas.drawCircle(center, radius * 0.8, basePaint);

    if (type == 'single_vision') {
      canvas.drawCircle(center, radius * 0.5, goldPaint);
      canvas.drawCircle(center, radius * 0.15, goldPaint..style = PaintingStyle.fill);

      final linePaint = Paint()
        ..color = AppColors.gold.withValues(alpha: 0.5)
        ..strokeWidth = 1;
      canvas.drawLine(Offset(size.width * 0.15, center.dy), Offset(size.width * 0.35, center.dy), linePaint);
      canvas.drawLine(Offset(size.width * 0.65, center.dy), Offset(size.width * 0.85, center.dy), linePaint);
      canvas.drawLine(Offset(center.dx, size.height * 0.15), Offset(center.dx, size.height * 0.35), linePaint);
      canvas.drawLine(Offset(center.dx, size.height * 0.65), Offset(center.dx, size.height * 0.85), linePaint);
    } else if (type == 'progressive') {
      final curvePaint = Paint()
        ..color = AppColors.gold
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1;

      final pathTop = Path();
      pathTop.moveTo(size.width * 0.2, size.height * 0.35);
      pathTop.quadraticBezierTo(center.dx, size.height * 0.45, size.width * 0.8, size.height * 0.35);
      canvas.drawPath(pathTop, curvePaint);

      final pathBottom = Path();
      pathBottom.moveTo(size.width * 0.25, size.height * 0.65);
      pathBottom.quadraticBezierTo(center.dx, size.height * 0.55, size.width * 0.75, size.height * 0.65);
      canvas.drawPath(pathBottom, curvePaint);

      final textPainter = TextPainter(
        textDirection: TextDirection.ltr,
        textAlign: TextAlign.center,
      );

      _drawText(canvas, textPainter, 'FAR', Offset(center.dx, size.height * 0.18), size);
      _drawText(canvas, textPainter, 'INT', Offset(center.dx, size.height * 0.46), size, color: AppColors.gold);
      _drawText(canvas, textPainter, 'NEAR', Offset(center.dx, size.height * 0.76), size);
    } else if (type == 'bluecut') {
      final wavePaint = Paint()
        ..color = const Color(0xFF4169E1)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5;

      final pathWave1 = Path();
      pathWave1.moveTo(size.width * 0.25, size.height * 0.35);
      pathWave1.quadraticBezierTo(size.width * 0.4, size.height * 0.45, size.width * 0.5, size.height * 0.35);
      pathWave1.quadraticBezierTo(size.width * 0.6, size.height * 0.25, size.width * 0.75, size.height * 0.35);
      canvas.drawPath(pathWave1, wavePaint);

      final pathWave2 = Path();
      pathWave2.moveTo(size.width * 0.25, size.height * 0.5);
      pathWave2.quadraticBezierTo(size.width * 0.4, size.height * 0.6, size.width * 0.5, size.height * 0.5);
      pathWave2.quadraticBezierTo(size.width * 0.6, size.height * 0.4, size.width * 0.75, size.height * 0.5);
      canvas.drawPath(pathWave2, wavePaint);

      final shieldPaint = Paint()
        ..color = AppColors.gold
        ..style = PaintingStyle.fill;
      canvas.drawCircle(center, radius * 0.2, shieldPaint);

      final checkPaint = Paint()
        ..color = Colors.black
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5;
      final checkPath = Path();
      checkPath.moveTo(center.dx - 3, center.dy);
      checkPath.lineTo(center.dx - 1, center.dy + 2);
      checkPath.lineTo(center.dx + 3, center.dy - 2);
      canvas.drawPath(checkPath, checkPaint);
    } else if (type == 'photochromic') {
      final arcPaintDark = Paint()
        ..color = const Color(0xFF2E2335)
        ..style = PaintingStyle.fill;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius * 0.8),
        -1.57,
        3.14,
        true,
        arcPaintDark,
      );

      final textPainter = TextPainter(
        textDirection: TextDirection.ltr,
        textAlign: TextAlign.center,
      );

      _drawText(canvas, textPainter, 'SUN', Offset(size.width * 0.3, center.dy), size, fontSize: 6);
      _drawText(canvas, textPainter, 'CLR', Offset(size.width * 0.7, center.dy), size, fontSize: 6, color: AppColors.muted);
    } else {
      final starPaint = Paint()
        ..color = AppColors.gold
        ..style = PaintingStyle.fill;

      _drawStar(canvas, center, 4, starPaint);
      _drawStar(canvas, Offset(size.width * 0.3, size.height * 0.3), 2.5, starPaint);
      _drawStar(canvas, Offset(size.width * 0.7, size.height * 0.7), 2.5, starPaint);
    }
  }

  void _drawText(Canvas canvas, TextPainter tp, String text, Offset offset, Size size, {Color color = Colors.white, double fontSize = 5.5}) {
    tp.text = TextSpan(
      text: text,
      style: TextStyle(color: color, fontSize: fontSize, fontWeight: FontWeight.bold),
    );
    tp.layout();
    tp.paint(canvas, Offset(offset.dx - tp.width / 2, offset.dy - tp.height / 2));
  }

  void _drawStar(Canvas canvas, Offset position, double size, Paint paint) {
    final path = Path();
    path.moveTo(position.dx, position.dy - size);
    path.lineTo(position.dx + size * 0.3, position.dy - size * 0.3);
    path.lineTo(position.dx + size, position.dy);
    path.lineTo(position.dx + size * 0.3, position.dy + size * 0.3);
    path.lineTo(position.dx, position.dy + size);
    path.lineTo(position.dx - size * 0.3, position.dy + size * 0.3);
    path.lineTo(position.dx - size, position.dy);
    path.lineTo(position.dx - size * 0.3, position.dy - size * 0.3);
    path.close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
