import 'package:flutter/material.dart';
import '../../core/theme.dart';

class BlogArticle {
  final String title;
  final String excerpt;
  final String content;
  final String image;
  final String date;
  final String readTime;
  final String tag;

  const BlogArticle({
    required this.title,
    required this.excerpt,
    required this.content,
    required this.image,
    required this.date,
    required this.readTime,
    required this.tag,
  });
}

class BlogsScreen extends StatelessWidget {
  const BlogsScreen({super.key});

  static const List<BlogArticle> _articles = [
    BlogArticle(
      title: 'How to Choose the Perfect Frame for Your Face Shape',
      excerpt: 'Struggling to find frames that fit? Learn the secrets of matching rectangular, round, and geometric frames to oval, square, and heart-shaped faces.',
      content: 'Choosing the right eyeglasses depends heavily on your face shape. The general rule of thumb is to select frames that contrast your face features:\n\n'
          '1. Oval Face: Lucky you! Almost any frame style suits your proportions. Try square or rectangular geometric frames to add contrast.\n'
          '2. Round Face: Square or rectangular frames will contrast round curves, making your face appear thinner and longer.\n'
          '3. Square Face: Round or oval glasses soften sharp angles and strong jawlines.\n'
          '4. Heart Face: Frames that are wider at the bottom (like aviators or cat-eye shapes) help balance out a wider forehead and narrow chin.\n\n'
          'Remember, comfortable fit and confidence are just as important as aesthetics. Always measure your face temple width to get the correct frame sizing.',
      image: 'assets/images/logo.png', // Fallback or placeholder local asset
      date: 'June 15, 2026',
      readTime: '4 min read',
      tag: 'Styling Guide',
    ),
    BlogArticle(
      title: 'What is Blue Light and Do You Really Need Blocking Lenses?',
      excerpt: 'With screen times at an all-time high, digital eye strain is a growing concern. Learn how blue cut lenses work and if they are worth the upgrade.',
      content: 'Blue light is a high-energy visible (HEV) light wavelength emitted by electronic devices like smartphones, tablets, and computers.\n\n'
          'Extended screen exposure can lead to Digital Eye Strain (headaches, dry eyes, blurred vision) and disrupt your circadian rhythm (sleep quality) by suppressing melatonin secretion.\n\n'
          'Blue Light Blocking Lenses have specialized filter coatings designed to block harmful HEV wavelengths while letting safe visible light pass. If you spend more than 4 hours a day looking at screens, blue light protection offers significant comfort and improves sleep quality.',
      image: 'assets/images/logo.png',
      date: 'May 28, 2026',
      readTime: '6 min read',
      tag: 'Eye Health',
    ),
    BlogArticle(
      title: 'Understanding Lens Index: From Standard to Ultra-Thin',
      excerpt: 'Having a high prescription does not mean you need thick lenses. Compare 1.56, 1.61, and 1.67 lens indexes to find the perfect thin profile.',
      content: 'Lens Index refers to the refractive index of the lens material. A higher index bends light more efficiently, allowing the lens to be thinner and lighter for the same prescription:\n\n'
          '1. 1.56 Index (Standard): Best for low prescriptions (spherical correction +/- 2.00 or lower).\n'
          '2. 1.61 Index (Thin): Up to 20% thinner than standard. Recommended for mild-to-moderate prescriptions (+/- 2.00 to +/- 4.00).\n'
          '3. 1.67 Index (Ultra-Thin): Up to 35% thinner. Highly recommended for strong prescriptions (+/- 4.00 and above) to avoid the "coke-bottle lens" effect.\n\n'
          'Selecting a higher index lens makes your glasses lighter on your nose bridge and ensures your eyes do not look artificially magnified.',
      image: 'assets/images/logo.png',
      date: 'April 12, 2026',
      readTime: '5 min read',
      tag: 'Lens Tech',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.card,
        title: const Text(
          'Blogs & Insights',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
            fontSize: 16,
            letterSpacing: 0.5,
          ),
        ),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _articles.length,
        itemBuilder: (context, index) {
          final article = _articles[index];
          return GestureDetector(
            onTap: () => _openArticleReader(context, article),
            child: Container(
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              clipBehavior: Clip.antiAlias,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Tag & Read info
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.gold.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.gold.withValues(alpha: 0.25)),
                          ),
                          child: Text(
                            article.tag.toUpperCase(),
                            style: const TextStyle(color: AppColors.gold, fontSize: 8, fontWeight: FontWeight.bold),
                          ),
                        ),
                        Text(
                          '${article.date} • ${article.readTime}',
                          style: const TextStyle(color: Colors.grey, fontSize: 10),
                        ),
                      ],
                    ),
                  ),

                  // Title
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      article.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),

                  // Excerpt
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 6, 16, 16),
                    child: Text(
                      article.excerpt,
                      style: const TextStyle(color: Colors.white70, fontSize: 12, height: 1.4),
                    ),
                  ),

                  // Read Link
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: const BoxDecoration(
                      color: Colors.black12,
                      border: Border(top: BorderSide(color: AppColors.border, width: 0.5)),
                    ),
                    child: const Row(
                      children: [
                        Text(
                          'READ FULL ARTICLE',
                          style: TextStyle(color: AppColors.gold, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                        SizedBox(width: 4),
                        Icon(Icons.arrow_forward, color: AppColors.gold, size: 12),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _openArticleReader(BuildContext context, BlogArticle article) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: const BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.gold.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.gold.withValues(alpha: 0.25)),
                  ),
                  child: Text(
                    article.tag.toUpperCase(),
                    style: const TextStyle(color: AppColors.gold, fontSize: 8, fontWeight: FontWeight.bold),
                  ),
                ),
                Text(
                  '${article.date} • ${article.readTime}',
                  style: const TextStyle(color: Colors.grey, fontSize: 10),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              article.title,
              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
            ),
            const Divider(color: AppColors.border, height: 24),
            Expanded(
              child: SingleChildScrollView(
                child: Text(
                  article.content,
                  style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.6),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
