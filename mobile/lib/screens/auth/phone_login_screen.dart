import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/trust_strip.dart';
import '../../widgets/eyeglaze_logo.dart';
import '../../widgets/gold_button.dart';
import 'otp_screen.dart';

class PhoneLoginScreen extends StatefulWidget {
  const PhoneLoginScreen({super.key});

  @override
  State<PhoneLoginScreen> createState() => _PhoneLoginScreenState();
}

class _PhoneLoginScreenState extends State<PhoneLoginScreen> {
  String _phone = '';
  bool _loading = false;
  String? _error;

  void _onKeyTap(String key) {
    setState(() {
      if (key == '⌫') {
        if (_phone.isNotEmpty) _phone = _phone.substring(0, _phone.length - 1);
      } else if (_phone.length < 10) {
        _phone += key;
      }
    });
  }

  Future<void> _sendOtp() async {
    if (_phone.length != 10) {
      setState(() => _error = 'Please enter a valid 10-digit number');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final authService = context.read<AuthService>();
      final apiService = ApiService(authService);
      await apiService.sendOtp(phone: _phone);
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => OtpScreen(phone: _phone, email: null),
          ),
        );
      }
    } catch (e) {
      setState(() => _error = 'Failed to send OTP. Try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Top bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: AppColors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const Expanded(child: Center(child: EyeGlazeLogo(size: 1.3))),
                  IconButton(
                    icon: const Icon(Icons.close, color: AppColors.white),
                    onPressed: () => Navigator.of(context).popUntil((r) => r.isFirst),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text('Enter Mobile Number', style: AppTextStyles.heading2),
            const SizedBox(height: 6),
            const Text('We will send you an OTP to verify', style: AppTextStyles.muted),
            const SizedBox(height: 24),
            // Phone input
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.card,
                  border: Border.all(color: AppColors.border),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                      decoration: const BoxDecoration(
                        border: Border(right: BorderSide(color: AppColors.border)),
                      ),
                      child: const Row(
                        children: [
                          Text('+91', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w600)),
                          SizedBox(width: 4),
                          Icon(Icons.keyboard_arrow_down, color: AppColors.muted, size: 18),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          _phone.isEmpty ? 'Enter mobile number' : _phone,
                          style: _phone.isEmpty ? AppTextStyles.muted : AppTextStyles.body.copyWith(fontSize: 18, letterSpacing: 2),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 12)),
              ),
            ],
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: GoldButton(
                label: _loading ? 'SENDING...' : 'SEND OTP',
                onPressed: _loading ? null : _sendOtp,
              ),
            ),
            // Divider
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12, horizontal: 20),
              child: Row(
                children: [
                  Expanded(child: Divider(color: AppColors.border)),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12),
                    child: Text('or', style: AppTextStyles.muted),
                  ),
                  Expanded(child: Divider(color: AppColors.border)),
                ],
              ),
            ),
            GestureDetector(
              onTap: () => Navigator.pop(context),
              child: const Text('Continue with Email', style: AppTextStyles.gold),
            ),
            const TrustStrip(),
            const Divider(color: AppColors.border),
            // Numpad
            Expanded(
              child: _NumPad(onKeyTap: _onKeyTap),
            ),
          ],
        ),
      ),
    );
  }
}

class _NumPad extends StatelessWidget {
  final Function(String) onKeyTap;

  const _NumPad({required this.onKeyTap});

  @override
  Widget build(BuildContext context) {
    final keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', '⌫'],
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 8),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: keys.map((row) {
          return Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: row.map((key) {
              if (key.isEmpty) return const Expanded(child: SizedBox());
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: GestureDetector(
                    onTap: () => onKeyTap(key),
                    child: Container(
                      height: 52,
                      decoration: BoxDecoration(
                        color: AppColors.card,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Center(
                        child: Text(
                          key,
                          style: const TextStyle(
                            color: AppColors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          );
        }).toList(),
      ),
    );
  }
}
