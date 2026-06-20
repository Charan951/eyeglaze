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
import 'lens_checkout_screen.dart';

class LensQualityScreen extends StatefulWidget {
  const LensQualityScreen({super.key});

  @override
  State<LensQualityScreen> createState() => _LensQualityScreenState();
}

class _LensQualityScreenState extends State<LensQualityScreen> {
  String? _selectedSubtype;
  double _selectedPrice = 2499.0;
  bool _loading = false;
  List<dynamic> _options = [];

  // Fallbacks
  final _progressiveOptions = [
    {
      'subType': 'hc_progressive',
      'displayName': 'HC Progressive',
      'description': 'Wide & clear vision with enhanced comfort and less distortion.',
      'price': 2499.0,
      'features': ['Wide Vision', 'Less Distortion', 'Easy Adaptation', 'UV Protection'],
      'isBestseller': true,
    },
    {
      'subType': 'premium_progressive',
      'displayName': 'Premium Progressive',
      'description': 'High clarity with advanced lens design for better visual balance.',
      'price': 3499.0,
      'features': ['Clear Vision', 'Better Sharpness', 'Reduced Glare', 'UV Protection'],
      'isBestseller': false,
    },
    {
      'subType': 'advanced_progressive',
      'displayName': 'Advanced Progressive',
      'description': 'Smooth transitions with improved intermediate & near vision.',
      'price': 4499.0,
      'features': ['Smooth Transition', 'Wider Zones', 'Low Distortion', 'UV Protection'],
      'isBestseller': false,
    },
    {
      'subType': 'elite_progressive',
      'displayName': 'Elite Progressive',
      'description': 'Best-in-class clarity with personalized comfort for all-day use.',
      'price': 5499.0,
      'features': ['Personalized Vision', 'Maximum Clarity', 'Fast Adaptation', 'UV Protection'],
      'isBestseller': false,
    },
  ];

  final _qualityOptions = [
    {
      'subType': 'hmc_bluecut',
      'displayName': 'HMC + Blue Cut',
      'description': 'Clear & comfortable vision with essential protection.',
      'price': 999.0,
      'features': ['Anti-Reflective', 'Blue Light Protection', 'Water & Dust Repellant'],
      'isRecommended': true,
    },
    {
      'subType': 'hmc',
      'displayName': 'HMC',
      'description': 'Anti-reflective coating for clear & comfortable vision.',
      'price': 699.0,
      'features': ['Anti-Reflective', 'Scratch Resistant'],
      'isRecommended': false,
    },
    {
      'subType': 'bluecut_quality',
      'displayName': 'Blue Cut',
      'description': 'Filters harmful blue light from digital screens.',
      'price': 899.0,
      'features': ['Blue Light Protection'],
      'isRecommended': false,
    },
    {
      'subType': 'hc',
      'displayName': 'HC (Hard Coated)',
      'description': 'Scratch resistant coating for durable lenses.',
      'price': 799.0,
      'features': ['Scratch Resistant'],
      'isRecommended': false,
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadOptions();
  }

  dynamic _getDefaultOption(List<dynamic> options, bool isProgressive) {
    if (options.isEmpty) return null;
    final key = isProgressive ? 'isBestseller' : 'isRecommended';
    for (final o in options) {
      if (o is Map && o[key] == true) {
        return o;
      }
    }
    return options.first;
  }

  Future<void> _loadOptions() async {
    setState(() => _loading = true);
    final wizard = context.read<LensWizardState>();
    final isProgressive = wizard.lensType == 'progressive';

    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      final list = await api.getLensOptions();

      if (isProgressive) {
        final prog = list.where((o) => o['kind'] == 'type' && o['type'] == 'progressive' && o['subType'] != null).toList();
        if (mounted) {
          setState(() {
            _options = prog.isNotEmpty ? prog : _progressiveOptions;
            final defaultOpt = _getDefaultOption(_options, true);
            _selectedSubtype = defaultOpt != null ? (defaultOpt['subType'] ?? defaultOpt['_id']) : null;
            _selectedPrice = defaultOpt != null ? ((defaultOpt['price'] as num?)?.toDouble() ?? 2499.0) : 2499.0;
          });
        }
      } else {
        final qual = list.where((o) => o['kind'] == 'quality').toList();
        if (mounted) {
          setState(() {
            _options = qual.isNotEmpty ? qual : _qualityOptions;
            final defaultOpt = _getDefaultOption(_options, false);
            _selectedSubtype = defaultOpt != null ? (defaultOpt['subType'] ?? defaultOpt['_id']) : null;
            _selectedPrice = defaultOpt != null ? ((defaultOpt['price'] as num?)?.toDouble() ?? 699.0) : 699.0;
          });
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _options = isProgressive ? _progressiveOptions : _qualityOptions;
          final defaultOpt = _getDefaultOption(_options, isProgressive);
          _selectedSubtype = defaultOpt != null ? (defaultOpt['subType'] ?? defaultOpt['_id']) : null;
          _selectedPrice = defaultOpt != null ? ((defaultOpt['price'] as num?)?.toDouble() ?? (isProgressive ? 2499.0 : 699.0)) : (isProgressive ? 2499.0 : 699.0);
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _getSelectedOptionName() {
    if (_selectedSubtype == null || _options.isEmpty) return 'None';
    for (final o in _options) {
      if ((o['subType'] ?? o['_id']) == _selectedSubtype) {
        return o['displayName'] ?? o['name'] ?? '';
      }
    }
    return 'None';
  }

  IconData _getFeatureIcon(String feature) {
    final val = feature.toLowerCase();
    if (val.contains('anti-reflective') || val.contains('hmc') || val.contains('reflective')) {
      return Icons.remove_red_eye_outlined;
    } else if (val.contains('blue') || val.contains('protection')) {
      return Icons.wb_iridescent_outlined;
    } else if (val.contains('scratch') || val.contains('durable')) {
      return Icons.verified_outlined;
    } else if (val.contains('water') || val.contains('dust') || val.contains('repellent')) {
      return Icons.opacity;
    } else if (val.contains('adaptation') || val.contains('transition')) {
      return Icons.autorenew;
    } else {
      return Icons.check_circle_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    final wizard = context.watch<LensWizardState>();
    final product = wizard.product;
    final isProgressive = wizard.lensType == 'progressive';

    final selectedName = _getSelectedOptionName();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: Text(isProgressive ? 'Configure Progressive' : 'Select Quality', style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold)),
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: AppColors.white), onPressed: () => Navigator.pop(context)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.gold))
          : Column(
              children: [
                const LensStepBar(currentStep: 3),
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Condensed product summary card
                        if (product != null)
                          _CondensedProductCard(
                            product: product,
                            color: wizard.selectedColor ?? 'Matte Black',
                            lensTypeFormatted: isProgressive ? 'Progressive ($selectedName)' : '${wizard.lensType} ($selectedName)',
                            onEditLensType: () {
                              // Pop twice to get back to LensTypeScreen (from QualityScreen -> PowerScreen -> TypeScreen)
                              Navigator.pop(context);
                              Navigator.pop(context);
                            },
                          ),

                        // Section header
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isProgressive ? 'PROGRESSIVE LENSES' : 'CHOOSE LENS QUALITY',
                                style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: 1),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                isProgressive
                                    ? 'One lens for all distances - near, intermediate and far. Learn more (i)'
                                    : 'Choose the quality and features for your lenses. All lenses come with 100% UV Protection.',
                                style: const TextStyle(color: AppColors.muted, fontSize: 11, height: 1.3),
                              ),
                            ],
                          ),
                        ),

                        // Options list
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _options.length,
                          itemBuilder: (_, i) {
                            final opt = _options[i];
                            final id = opt['subType'] ?? opt['_id'];
                            final isSelected = _selectedSubtype == id;
                            final isBestseller = opt['isBestseller'] as bool? ?? false;
                            final isRec = opt['isRecommended'] as bool? ?? false;

                            return GestureDetector(
                              onTap: () => setState(() {
                                _selectedSubtype = id;
                                _selectedPrice = (opt['price'] as num).toDouble();
                              }),
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: AppColors.card,
                                  border: Border.all(color: isSelected ? AppColors.gold : AppColors.border, width: isSelected ? 2 : 1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Left Diagram
                                        _ProgressiveMiniDiagram(),
                                        const SizedBox(width: 12),
                                        // Details
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  Text(
                                                    opt['displayName'] ?? opt['name'] ?? '',
                                                    style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                                  ),
                                                  if (isBestseller || isRec) ...[
                                                    const SizedBox(width: 8),
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                      decoration: BoxDecoration(
                                                        color: AppColors.gold,
                                                        borderRadius: BorderRadius.circular(4),
                                                      ),
                                                      child: Text(
                                                        isBestseller ? 'BESTSELLER' : 'RECOMMENDED',
                                                        style: const TextStyle(color: Colors.black, fontSize: 8, fontWeight: FontWeight.bold),
                                                      ),
                                                    ),
                                                  ],
                                                ],
                                              ),
                                              const SizedBox(height: 4),
                                              Text(opt['description'] ?? '', style: const TextStyle(color: AppColors.muted, fontSize: 11, height: 1.35)),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: 10),
                                        // Selection Radio circle
                                        Container(
                                          width: 18,
                                          height: 18,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            border: Border.all(color: isSelected ? AppColors.gold : AppColors.border, width: 2),
                                            color: isSelected ? AppColors.gold : Colors.transparent,
                                          ),
                                          child: isSelected
                                              ? const Icon(Icons.check, color: Colors.black, size: 10)
                                              : null,
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    const Divider(color: AppColors.border, height: 1),
                                    const SizedBox(height: 10),
                                    Row(
                                      children: [
                                        // Features Wrap
                                        Expanded(
                                          child: Wrap(
                                            spacing: 12,
                                            runSpacing: 4,
                                            children: (opt['features'] as List? ?? []).map((feat) {
                                              return Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Icon(_getFeatureIcon(feat), color: AppColors.gold, size: 12),
                                                  const SizedBox(width: 4),
                                                  Text(feat, style: const TextStyle(color: AppColors.muted, fontSize: 9, fontWeight: FontWeight.bold)),
                                                ],
                                              );
                                            }).toList(),
                                          ),
                                        ),
                                        // Price
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            Text('₹${(opt['price'] as num).toInt()}', style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 14)),
                                            const Text('/ pair', style: TextStyle(color: AppColors.muted, fontSize: 8, fontWeight: FontWeight.bold)),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),

                        // If progressive, render "How Progressive Lenses Work"
                        if (isProgressive)
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            child: _ProgressiveExplanationCard(),
                          ),

                        const SizedBox(height: 80),
                      ],
                    ),
                  ),
                ),
                // Sticky bottom bar
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: const BoxDecoration(
                    color: AppColors.card,
                    border: Border(top: BorderSide(color: AppColors.border)),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Text('Selected Lens: ', style: TextStyle(color: AppColors.muted, fontSize: 11)),
                                    Expanded(
                                      child: Text(selectedName, style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    Text('₹${_selectedPrice.toInt()}', style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w900, fontSize: 16)),
                                    const Text(' / pair', style: TextStyle(color: AppColors.muted, fontSize: 10)),
                                    const SizedBox(width: 10),
                                    GestureDetector(
                                      onTap: () {
                                        // edit lens
                                        Navigator.pop(context);
                                        Navigator.pop(context);
                                      },
                                      child: const Text('Change', style: TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.bold, decoration: TextDecoration.underline)),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          SizedBox(
                            width: 180,
                            child: GoldButton(
                              label: 'CONTINUE →',
                              onPressed: _selectedSubtype == null
                                  ? null
                                  : () {
                                      context.read<LensWizardState>().setLensQuality(selectedName, _selectedPrice);
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => ChangeNotifierProvider.value(
                                            value: context.read<LensWizardState>(),
                                            child: const LensCheckoutScreen(),
                                          ),
                                        ),
                                      );
                                    },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.lock_outline, color: AppColors.muted, size: 12),
                          SizedBox(width: 4),
                          Text('Your order is 100% secure', style: TextStyle(color: AppColors.muted, fontSize: 10)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}

class _CondensedProductCard extends StatelessWidget {
  final Product product;
  final String color;
  final String lensTypeFormatted;
  final VoidCallback onEditLensType;

  const _CondensedProductCard({
    required this.product,
    required this.color,
    required this.lensTypeFormatted,
    required this.onEditLensType,
  });

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
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 64,
                height: 48,
                decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(8)),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: product.images.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: AppConfig.resolveImageUrl(product.images.first),
                          fit: BoxFit.contain,
                          placeholder: (context, url) => const Center(
                            child: SizedBox(width: 12, height: 12, child: CircularProgressIndicator(color: AppColors.gold, strokeWidth: 1)),
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
                    Text(product.sku, style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 14)),
                    Text(product.name, style: const TextStyle(color: AppColors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                    Text(color, style: const TextStyle(color: AppColors.muted, fontSize: 11)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Divider(color: AppColors.border, height: 1),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Text('Lens Type: ', style: TextStyle(color: AppColors.muted, fontSize: 11)),
                  Text(lensTypeFormatted, style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 11)),
                ],
              ),
              GestureDetector(
                onTap: onEditLensType,
                child: const Text('Edit', style: TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.bold, decoration: TextDecoration.underline)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProgressiveMiniDiagram extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: AppColors.background,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.border),
      ),
      child: CustomPaint(
        painter: _ProgressiveMiniPainter(),
      ),
    );
  }
}

class _ProgressiveMiniPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    final linePaint = Paint()
      ..color = AppColors.border.withValues(alpha: 0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    final goldPaint = Paint()
      ..color = AppColors.gold
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    canvas.drawCircle(center, radius * 0.8, linePaint);

    final pathTop = Path();
    pathTop.moveTo(size.width * 0.2, size.height * 0.35);
    pathTop.quadraticBezierTo(center.dx, size.height * 0.45, size.width * 0.8, size.height * 0.35);
    canvas.drawPath(pathTop, goldPaint);

    final pathBottom = Path();
    pathBottom.moveTo(size.width * 0.25, size.height * 0.65);
    pathBottom.quadraticBezierTo(center.dx, size.height * 0.55, size.width * 0.75, size.height * 0.65);
    canvas.drawPath(pathBottom, goldPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _ProgressiveExplanationCard extends StatelessWidget {
  const _ProgressiveExplanationCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card.withValues(alpha: 0.5),
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('How Progressive Lenses Work', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                width: 90,
                height: 60,
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(color: AppColors.border),
                ),
                child: CustomPaint(
                  painter: _ProgressiveLensPainter(),
                ),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Text(
                  'Seamless vision at all distances (far, intermediate, near) without changing glasses.',
                  style: TextStyle(color: AppColors.muted, fontSize: 11, height: 1.4),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProgressiveLensPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);

    final linePaint = Paint()
      ..color = AppColors.gold.withValues(alpha: 0.4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    final path1 = Path();
    path1.moveTo(size.width * 0.15, size.height * 0.35);
    path1.quadraticBezierTo(center.dx, size.height * 0.45, size.width * 0.85, size.height * 0.35);
    canvas.drawPath(path1, linePaint);

    final path2 = Path();
    path2.moveTo(size.width * 0.2, size.height * 0.65);
    path2.quadraticBezierTo(center.dx, size.height * 0.55, size.width * 0.8, size.height * 0.65);
    canvas.drawPath(path2, linePaint);

    final tp = TextPainter(textDirection: TextDirection.ltr, textAlign: TextAlign.center);
    _drawText(canvas, tp, 'Far', Offset(center.dx, size.height * 0.2));
    _drawText(canvas, tp, 'Intermediate', Offset(center.dx, size.height * 0.5), color: AppColors.gold);
    _drawText(canvas, tp, 'Near', Offset(center.dx, size.height * 0.8));
  }

  void _drawText(Canvas canvas, TextPainter tp, String text, Offset offset, {Color color = Colors.white}) {
    tp.text = TextSpan(
      text: text,
      style: TextStyle(color: color, fontSize: 7.5, fontWeight: FontWeight.bold),
    );
    tp.layout();
    tp.paint(canvas, Offset(offset.dx - tp.width / 2, offset.dy - tp.height / 2));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
