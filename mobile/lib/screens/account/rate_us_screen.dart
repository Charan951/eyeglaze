import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/theme.dart';
import '../../widgets/gold_button.dart';

class RateUsScreen extends StatefulWidget {
  const RateUsScreen({super.key});

  @override
  State<RateUsScreen> createState() => _RateUsScreenState();
}

class _RateUsScreenState extends State<RateUsScreen> {
  int _selectedRating = 0;
  final _commentCtrl = TextEditingController();
  bool _submitting = false;
  Map<String, dynamic>? _myRating;

  final Map<int, String> _ratingPhrases = {
    1: 'Extremely unsatisfied. We apologize for the poor experience.',
    2: 'Unsatisfied. Please let us know how we can improve.',
    3: 'Average. We will work to make it better next time.',
    4: 'Satisfied! Thank you for the positive review.',
    5: 'Excellent! We are thrilled to hear that!',
  };

  @override
  void initState() {
    super.initState();
    _loadLocalRating();
  }

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadLocalRating() async {
    final prefs = await SharedPreferences.getInstance();
    final local = prefs.getString('eyeglaze_my_rating');
    if (local != null) {
      setState(() {
        _myRating = jsonDecode(local);
        if (_myRating != null) {
          _selectedRating = _myRating!['rating'] ?? 0;
          _commentCtrl.text = _myRating!['comment'] ?? '';
        }
      });
    }
  }

  Future<void> _submitFeedback() async {
    if (_selectedRating == 0) return;
    setState(() => _submitting = true);

    await Future.delayed(const Duration(milliseconds: 1200));

    final data = {
      'rating': _selectedRating,
      'comment': _commentCtrl.text.trim(),
      'createdAt': DateTime.now().toIso8601String(),
    };

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('eyeglaze_my_rating', jsonEncode(data));

    if (mounted) {
      setState(() {
        _myRating = data;
        _submitting = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Feedback submitted successfully'), backgroundColor: AppColors.success),
      );
    }
  }

  Future<void> _clearFeedback() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.card,
        title: const Text('Reset Feedback?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text('Do you want to submit a new rating? This will clear your current feedback.', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('CANCEL', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('RESET'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('eyeglaze_my_rating');
      setState(() {
        _myRating = null;
        _selectedRating = 0;
        _commentCtrl.clear();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.card,
        title: const Text(
          'Rate Us',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
            fontSize: 16,
            letterSpacing: 0.5,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Your feedback shapes our optics processing lab. Tell us about your frame quality, sizing, and prescription clarity.',
              style: TextStyle(color: Colors.grey, fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 20),

            if (_myRating != null) ...[
              // Submitted feedback card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    const CircleAvatar(
                      backgroundColor: Colors.amber,
                      radius: 24,
                      child: Icon(Icons.star, color: Colors.black, size: 28),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Thank You For Your Feedback!',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        return Icon(
                          index < _myRating!['rating'] ? Icons.star : Icons.star_border,
                          color: Colors.amber,
                          size: 20,
                        );
                      }),
                    ),
                    if (_myRating!['comment'].toString().isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Text(
                        '"${_myRating!['comment']}"',
                        style: const TextStyle(color: Colors.white70, fontStyle: FontStyle.italic, fontSize: 13),
                        textAlign: TextAlign.center,
                      ),
                    ],
                    const SizedBox(height: 20),
                    OutlinedButton.icon(
                      onPressed: _clearFeedback,
                      style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.border)),
                      icon: const Icon(Icons.edit_note, color: AppColors.gold, size: 18),
                      label: const Text('SUBMIT NEW RATING', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ] else ...[
              // Feedback submission card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('RATE YOUR EXPERIENCE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        final starRating = index + 1;
                        return IconButton(
                          onPressed: () => setState(() => _selectedRating = starRating),
                          icon: Icon(
                            starRating <= _selectedRating ? Icons.star : Icons.star_border,
                            color: Colors.amber,
                            size: 32,
                          ),
                        );
                      }),
                    ),
                    if (_selectedRating > 0) ...[
                      Center(
                        child: Text(
                          _ratingPhrases[_selectedRating] ?? '',
                          style: const TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.bold),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    const Text('WRITE COMMENTS (OPTIONAL)', style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _commentCtrl,
                      maxLines: 4,
                      decoration: InputDecoration(
                        hintText: 'Share details of your experience...',
                        hintStyle: const TextStyle(color: Colors.grey, fontSize: 12),
                        fillColor: AppColors.background,
                        filled: true,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      ),
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                    ),
                    const SizedBox(height: 16),
                    _submitting
                        ? const Center(child: CircularProgressIndicator(color: AppColors.gold))
                        : GoldButton(
                            label: 'SUBMIT FEEDBACK',
                            onPressed: _selectedRating > 0 ? _submitFeedback : null,
                          ),
                  ],
                ),
              ),
            ],
            
            const SizedBox(height: 24),
            
            // Web style distribution statistics
            const Text('CUSTOMER REVIEWS RATING', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 16),
            Row(
              children: [
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('4.85', style: TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.w900)),
                    Row(
                      children: [
                        Icon(Icons.star, color: Colors.amber, size: 14),
                        Icon(Icons.star, color: Colors.amber, size: 14),
                        Icon(Icons.star, color: Colors.amber, size: 14),
                        Icon(Icons.star, color: Colors.amber, size: 14),
                        Icon(Icons.star_half, color: Colors.amber, size: 14),
                      ],
                    ),
                    SizedBox(height: 4),
                    Text('1,842 total reviews', style: TextStyle(color: Colors.grey, fontSize: 10)),
                  ],
                ),
                const SizedBox(width: 24),
                Expanded(
                  child: Column(
                    children: [
                      _buildDistributionRow(5, 82),
                      _buildDistributionRow(4, 12),
                      _buildDistributionRow(3, 4),
                      _buildDistributionRow(2, 1),
                      _buildDistributionRow(1, 1),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDistributionRow(int stars, int pct) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Row(
        children: [
          Text('$stars ★', style: const TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
          const SizedBox(width: 8),
          Expanded(
            child: Container(
              height: 6,
              decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(3)),
              alignment: Alignment.centerLeft,
              child: FractionallySizedBox(
                widthFactor: pct / 100,
                child: Container(
                  decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(3)),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text('$pct%', style: const TextStyle(color: Colors.grey, fontSize: 10)),
        ],
      ),
    );
  }
}
