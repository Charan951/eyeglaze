import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../widgets/gold_button.dart';
import '../../widgets/responsive_container.dart';

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key});

  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _subjectCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();

  bool _submitting = false;
  bool _success = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _subjectCtrl.dispose();
    _messageCtrl.dispose();
    super.dispose();
  }

  Future<void> _submitInquiry() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);
    
    // Simulate API delay
    await Future.delayed(const Duration(milliseconds: 1500));

    setState(() {
      _submitting = false;
      _success = true;
      _nameCtrl.clear();
      _emailCtrl.clear();
      _subjectCtrl.clear();
      _messageCtrl.clear();
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Message sent successfully! We will contact you soon.'),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'CONTACT US',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w900,
            fontSize: 16,
            letterSpacing: 2,
          ),
        ),
      ),
      body: ResponsiveContainer(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              const Text(
                'CONNECT WITH US',
                style: TextStyle(color: AppColors.muted, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.5),
              ),
              const SizedBox(height: 8),
              const Text(
                'Have a question about your prescription, frame sizing, or delivery? Reach out and our optics support team will respond within 12 hours.',
                style: TextStyle(color: AppColors.white, fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 24),

              // Inquiry form container
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: _success
                    ? Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.success.withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.check_circle_outline, color: AppColors.success, size: 48),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Message Sent Successfully',
                            style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Thank you for contacting EyeGlaze! Our optometrist panel or support staff will review your message and reply via email shortly.',
                            style: TextStyle(color: AppColors.muted, fontSize: 12, height: 1.4),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 20),
                          OutlinedButton(
                            onPressed: () => setState(() => _success = false),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: AppColors.gold),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            ),
                            child: const Text(
                              'SEND ANOTHER MESSAGE',
                              style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ),
                        ],
                      )
                    : Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'SEND AN INQUIRY',
                              style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            const SizedBox(height: 16),
                            
                            // Name field
                            TextFormField(
                              controller: _nameCtrl,
                              style: const TextStyle(color: AppColors.white, fontSize: 13),
                              decoration: const InputDecoration(
                                labelText: 'Your Name *',
                                hintText: 'Enter name',
                              ),
                              validator: (val) => val == null || val.isEmpty ? 'Please enter your name' : null,
                            ),
                            const SizedBox(height: 12),

                            // Email field
                            TextFormField(
                              controller: _emailCtrl,
                              style: const TextStyle(color: AppColors.white, fontSize: 13),
                              keyboardType: TextInputType.emailAddress,
                              decoration: const InputDecoration(
                                labelText: 'Email Address *',
                                hintText: 'Enter email',
                              ),
                              validator: (val) {
                                if (val == null || val.isEmpty) return 'Please enter your email';
                                if (!val.contains('@')) return 'Enter a valid email address';
                                return null;
                              },
                            ),
                            const SizedBox(height: 12),

                            // Subject field
                            TextFormField(
                              controller: _subjectCtrl,
                              style: const TextStyle(color: AppColors.white, fontSize: 13),
                              decoration: const InputDecoration(
                                labelText: 'Subject',
                                hintText: 'e.g. Order Tracking, Lens options',
                              ),
                            ),
                            const SizedBox(height: 12),

                            // Message field
                            TextFormField(
                              controller: _messageCtrl,
                              style: const TextStyle(color: AppColors.white, fontSize: 13),
                              maxLines: 4,
                              decoration: const InputDecoration(
                                labelText: 'Your Message *',
                                hintText: 'Type message details...',
                              ),
                              validator: (val) => val == null || val.isEmpty ? 'Please enter your message' : null,
                            ),
                            const SizedBox(height: 20),

                            GoldButton(
                              label: _submitting ? 'SENDING...' : 'SEND MESSAGE',
                              onPressed: _submitting ? null : _submitInquiry,
                            ),
                          ],
                        ),
                      ),
              ),
              const SizedBox(height: 28),

              // Customer Care Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'CUSTOMER CARE',
                      style: TextStyle(
                        color: AppColors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        letterSpacing: 1.0,
                      ),
                    ),
                    const Divider(color: AppColors.border, height: 24),
                    
                    // Phone row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.phone_outlined, color: AppColors.gold, size: 20),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Toll-Free Support',
                              style: TextStyle(color: AppColors.muted, fontSize: 9, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              '1800-419-5888',
                              style: TextStyle(color: AppColors.white, fontSize: 14, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              '10:00 AM - 7:00 PM (Mon - Sat)',
                              style: TextStyle(color: AppColors.muted, fontSize: 10),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    
                    // Email row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.email_outlined, color: AppColors.gold, size: 20),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Email Inquiry',
                              style: TextStyle(color: AppColors.muted, fontSize: 9, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              'support@eyeglaze.com',
                              style: TextStyle(color: AppColors.white, fontSize: 14, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Central Lab Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'CENTRAL OPTICS LAB',
                      style: TextStyle(
                        color: AppColors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        letterSpacing: 1.0,
                      ),
                    ),
                    const Divider(color: AppColors.border, height: 24),
                    
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.location_on_outlined, color: AppColors.gold, size: 20),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text(
                              'EyeGlaze Laboratory Center',
                              style: TextStyle(color: AppColors.white, fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            SizedBox(height: 4),
                            Text(
                              '201, Outer Ring Road,\nOptical Hub Sector 3,\nGurugram, Haryana - 122001, India.',
                              style: TextStyle(color: AppColors.muted, fontSize: 12, height: 1.4),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Mock map graphic
                    Container(
                      height: 100,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Stack(
                        children: [
                          Positioned.fill(
                            child: Opacity(
                              opacity: 0.1,
                              child: GridView.count(
                                crossAxisCount: 10,
                                physics: const NeverScrollableScrollPhysics(),
                                children: List.generate(50, (i) => Container(decoration: BoxDecoration(border: Border.all(color: AppColors.muted)))),
                              ),
                            ),
                          ),
                          Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.location_on, color: AppColors.gold, size: 24),
                                const SizedBox(height: 4),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.black87,
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: AppColors.border),
                                  ),
                                  child: const Text(
                                    'LAB LOCATION LOCKED',
                                    style: TextStyle(color: AppColors.muted, fontSize: 8, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }
}
