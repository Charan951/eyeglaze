import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/app_config.dart';
import '../core/theme.dart';
import '../screens/products/products_screen.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/socket_service.dart';

void openHomepageLink(BuildContext context, String? linkUrl) {
  final raw = (linkUrl ?? '/products').trim();
  final uri = Uri.tryParse(raw.startsWith('http') ? raw : 'https://eyeglaze.local$raw');
  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (_) => ProductsScreen(
        category: uri?.queryParameters['category'],
        subCategory: uri?.queryParameters['subCategory'],
        gender: uri?.queryParameters['gender'],
      ),
    ),
  );
}

List<Map<String, dynamic>> filterHomepageSections(
  List<dynamic> all,
  String position,
) {
  final matches = all.where((raw) {
    final section = Map<String, dynamic>.from(raw as Map);
    if (section['showOnMobile'] == false) return false;
    final pos = (section['position'] ?? '').toString();
    if (pos == position) return true;
    if (pos == 'both' && (position == 'eyeglasses_landing' || position == 'footer')) {
      return true;
    }
    return false;
  }).map((raw) => Map<String, dynamic>.from(raw as Map)).toList();
  matches.sort((a, b) => ((a['displayOrder'] as num?) ?? 0).compareTo((b['displayOrder'] as num?) ?? 0));
  return matches;
}

class HomepageSectionSlot extends StatefulWidget {
  final String position;
  const HomepageSectionSlot({super.key, required this.position});

  @override
  State<HomepageSectionSlot> createState() => _HomepageSectionSlotState();
}

class _HomepageSectionSlotState extends State<HomepageSectionSlot> {
  List<Map<String, dynamic>> _sections = [];

  @override
  void initState() {
    super.initState();
    _load();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<SocketService>().socket?.on('homepage_section_changed', _onChanged);
    });
  }

  @override
  void dispose() {
    try {
      context.read<SocketService>().socket?.off('homepage_section_changed', _onChanged);
    } catch (_) {}
    super.dispose();
  }

  void _onChanged(dynamic _) {
    if (mounted) _load();
  }

  Future<void> _load() async {
    try {
      final api = ApiService(context.read<AuthService>());
      final list = await api.getHomepageSections();
      final matches = filterHomepageSections(list, widget.position);
      if (mounted) setState(() => _sections = matches);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (_sections.isEmpty) return const SizedBox.shrink();
    return HomepageSectionsGroup(sections: _sections, padded: false);
  }
}

class HomepageSectionsGroup extends StatelessWidget {
  final List<Map<String, dynamic>> sections;
  final bool padded;
  const HomepageSectionsGroup({super.key, required this.sections, this.padded = true});

  @override
  Widget build(BuildContext context) {
    if (sections.isEmpty) return const SizedBox.shrink();

    final groups = <List<Map<String, dynamic>>>[];
    for (final section in sections) {
      final type = (section['sectionType'] ?? '').toString();
      if (groups.isNotEmpty && (groups.last.first['sectionType'] ?? '').toString() == type) {
        groups.last.add(section);
      } else {
        groups.add([section]);
      }
    }

    return Column(
      children: groups.map((group) {
        final type = (group.first['sectionType'] ?? '').toString();
        if (type == 'eyeglaze_edit') {
          return _EyeGlazeEditSection(sections: group, padded: padded);
        }
        return _PromoCardCarousel(sections: group, padded: padded);
      }).toList(),
    );
  }
}

class _PromoCardCarousel extends StatefulWidget {
  final List<Map<String, dynamic>> sections;
  final bool padded;
  const _PromoCardCarousel({required this.sections, required this.padded});

  @override
  State<_PromoCardCarousel> createState() => _PromoCardCarouselState();
}

class _PromoCardCarouselState extends State<_PromoCardCarousel> {
  late final PageController _controller;
  Timer? _timer;
  int _index = 0;

  @override
  void initState() {
    super.initState();
    _controller = PageController();
    if (widget.sections.length > 1) {
      _timer = Timer.periodic(const Duration(seconds: 5), (_) {
        if (!mounted || !_controller.hasClients) return;
        final next = (_index + 1) % widget.sections.length;
        _controller.animateToPage(
          next,
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeInOut,
        );
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 4),
        SizedBox(
          height: 140,
          child: PageView.builder(
            controller: _controller,
            onPageChanged: (i) => setState(() => _index = i),
            itemCount: widget.sections.length,
            itemBuilder: (context, i) => HomepageSectionView(
              section: widget.sections[i],
              padded: false,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(widget.sections.length, (i) {
            final active = i == _index;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: active ? 14 : 5,
              height: 5,
              decoration: BoxDecoration(
                color: active ? AppColors.gold : AppColors.muted.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(3),
              ),
            );
          }),
        ),
        const SizedBox(height: 8),
      ],
    );
  }
}

class HomepageSectionView extends StatelessWidget {
  final Map<String, dynamic> section;
  final bool padded;
  const HomepageSectionView({super.key, required this.section, this.padded = true});

  @override
  Widget build(BuildContext context) {
    final type = (section['sectionType'] ?? '').toString();
    if (type == 'eyeglaze_edit') {
      return _EyeGlazeEditSection(sections: [section], padded: padded);
    }
    return _HomePromoCard(section: section, padded: padded);
  }
}

class _HomePromoCard extends StatelessWidget {
  final Map<String, dynamic> section;
  final bool padded;
  const _HomePromoCard({required this.section, this.padded = true});

  @override
  Widget build(BuildContext context) {
    final imageUrl = AppConfig.resolveImageUrl((section['imageUrl'] ?? '').toString());
    final tag = (section['tag'] ?? '').toString();
    final headline = (section['headline'] ?? '').toString();
    final description = (section['description'] ?? '').toString();
    final buttonText = (section['buttonText'] ?? '').toString();
    final isArrivals = (section['sectionType'] ?? '') == 'new_arrivals';

    return ClipRect(
      child: Container(
          width: double.infinity,
          height: 140,
          decoration: const BoxDecoration(
            color: AppColors.card,
            border: Border(
              top: BorderSide(color: AppColors.border),
              bottom: BorderSide(color: AppColors.border),
            ),
          ),
          child: Stack(
            children: [
              if (imageUrl.isNotEmpty)
                Positioned(
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 140,
                  child: CachedNetworkImage(
                    imageUrl: imageUrl,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => const SizedBox.shrink(),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  width: MediaQuery.of(context).size.width * 0.52,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (tag.isNotEmpty)
                        Text(
                          tag.toUpperCase(),
                          style: TextStyle(
                            color: isArrivals ? AppColors.gold : AppColors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1,
                          ),
                        ),
                      if (headline.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          headline,
                          style: TextStyle(
                            color: isArrivals ? AppColors.white : AppColors.gold,
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            height: 1.1,
                          ),
                        ),
                      ],
                      if (description.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          description,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: AppColors.muted, fontSize: 11),
                        ),
                      ],
                      const Spacer(),
                      if (buttonText.isNotEmpty)
                        GestureDetector(
                          onTap: () => openHomepageLink(context, section['linkUrl']?.toString()),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              border: Border.all(color: AppColors.gold),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              buttonText.toUpperCase(),
                              style: const TextStyle(
                                color: AppColors.gold,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                              ),
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
    );
  }
}

class _EyeGlazeEditSection extends StatelessWidget {
  final List<Map<String, dynamic>> sections;
  final bool padded;
  const _EyeGlazeEditSection({required this.sections, this.padded = true});

  List<Map<String, dynamic>> get _cards {
    final cards = <Map<String, dynamic>>[];
    for (final section in sections) {
      final nested = (section['items'] is List)
          ? List<Map<String, dynamic>>.from(
              (section['items'] as List).whereType<Map>().map((e) => Map<String, dynamic>.from(e)),
            )
          : <Map<String, dynamic>>[];
      if (nested.isNotEmpty) {
        cards.addAll(nested);
        continue;
      }
      if ((section['headline'] ?? '').toString().isEmpty && (section['imageUrl'] ?? '').toString().isEmpty) {
        continue;
      }
      cards.add({
        'title': section['headline'],
        'style': section['tag'],
        'description': section['description'],
        'imageUrl': section['imageUrl'],
        'linkUrl': section['linkUrl'],
        'buttonText': section['buttonText'],
      });
    }
    return cards;
  }

  @override
  Widget build(BuildContext context) {
    final items = _cards;
    if (items.isEmpty) return const SizedBox.shrink();

    final title = (sections
                .map((section) => (section['sectionTitle'] ?? '').toString())
                .firstWhere((value) => value.isNotEmpty, orElse: () => 'The EyeGlaze Edit: Styled by Icons'))
            .toString();
    final subtitle = sections
        .map((section) => (section['sectionSubtitle'] ?? '').toString())
        .firstWhere((value) => value.isNotEmpty, orElse: () => '');

    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              title.toUpperCase(),
              style: const TextStyle(
                color: AppColors.white,
                fontSize: 14,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.8,
              ),
            ),
          ),
          if (subtitle.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
              child: Text(
                subtitle.toUpperCase(),
                style: const TextStyle(
                  color: AppColors.muted,
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                ),
              ),
            ),
          const SizedBox(height: 12),
          SizedBox(
            height: 300,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: EdgeInsets.zero,
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, i) {
                final item = items[i];
                final imageUrl = AppConfig.resolveImageUrl((item['imageUrl'] ?? '').toString());
                return Container(
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
                          child: imageUrl.isEmpty
                              ? const SizedBox.expand()
                              : CachedNetworkImage(imageUrl: imageUrl, fit: BoxFit.cover, width: double.infinity),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if ((item['style'] ?? '').toString().isNotEmpty)
                              Text(
                                item['style'].toString().toUpperCase(),
                                style: const TextStyle(
                                  color: AppColors.gold,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.6,
                                ),
                              ),
                            if ((item['title'] ?? '').toString().isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                item['title'].toString(),
                                style: const TextStyle(
                                  color: AppColors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                            if ((item['description'] ?? '').toString().isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                item['description'].toString(),
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppColors.muted,
                                  fontSize: 10,
                                  height: 1.35,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                            const SizedBox(height: 8),
                            GestureDetector(
                              onTap: () => openHomepageLink(
                                context,
                                item['linkUrl']?.toString(),
                              ),
                              child: Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                decoration: BoxDecoration(
                                  border: Border.all(color: AppColors.border),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  ((item['buttonText'] ?? 'SHOP THE LOOK') as String)
                                      .toUpperCase(),
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: AppColors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
