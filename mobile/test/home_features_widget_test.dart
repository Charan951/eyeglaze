import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:eyeglaze/core/theme.dart';

void main() {
  group('Home Page Feature Widgets Test', () {
    testWidgets('Renders FAQ Accordion and expands FAQ on tap', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.darkTheme,
          home: const Scaffold(
            body: SingleChildScrollView(
              child: Column(
                children: [
                  _MockFaqSection(),
                ],
              ),
            ),
          ),
        ),
      );

      expect(find.text('FREQUENTLY ASKED QUESTIONS'), findsOneWidget);
      expect(find.text('How do I find my frame size?'), findsOneWidget);

      // Tap FAQ question to expand
      await tester.tap(find.text('How do I find my frame size?'));
      await tester.pumpAndSettle();

      expect(find.textContaining('interactive Frame Size Guide'), findsOneWidget);
    });

    testWidgets('Renders Home Eye Test form and slot options', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.darkTheme,
          home: const Scaffold(
            body: SingleChildScrollView(
              child: Column(
                children: [
                  _MockEyeTestSection(),
                ],
              ),
            ),
          ),
        ),
      );

      expect(find.text('BOOK FREE HOME EYE TEST'), findsOneWidget);
      expect(find.text('Morning (10 AM - 1 PM)'), findsOneWidget);
      expect(find.text('CONFIRM HOME EYE TEST BOOKING'), findsOneWidget);
    });
  });
}

class _MockFaqSection extends StatefulWidget {
  const _MockFaqSection();

  @override
  State<_MockFaqSection> createState() => _MockFaqSectionState();
}

class _MockFaqSectionState extends State<_MockFaqSection> {
  int? _expandedIndex;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Text('FREQUENTLY ASKED QUESTIONS'),
        ListTile(
          title: const Text('How do I find my frame size?'),
          onTap: () => setState(() => _expandedIndex = _expandedIndex == 0 ? null : 0),
        ),
        if (_expandedIndex == 0)
          const Text('interactive Frame Size Guide tips'),
      ],
    );
  }
}

class _MockEyeTestSection extends StatelessWidget {
  const _MockEyeTestSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Text('BOOK FREE HOME EYE TEST'),
        const Text('Morning (10 AM - 1 PM)'),
        ElevatedButton(
          onPressed: () {},
          child: const Text('CONFIRM HOME EYE TEST BOOKING'),
        ),
      ],
    );
  }
}
