import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/eyeglaze_logo.dart';
import '../../widgets/gold_button.dart';
import '../../widgets/trust_strip.dart';
import 'otp_screen.dart';

class EmailLoginScreen extends StatefulWidget {
  const EmailLoginScreen({super.key});

  @override
  State<EmailLoginScreen> createState() => _EmailLoginScreenState();
}

class _EmailLoginScreenState extends State<EmailLoginScreen> {
  final _emailCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _sendOtp() async {
    final email = _emailCtrl.text.trim();
    if (!email.contains('@')) {
      setState(() => _error = 'Enter a valid email address');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final authService = context.read<AuthService>();
      final apiService = ApiService(authService);
      await apiService.sendOtp(email: email);
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => OtpScreen(phone: null, email: email)),
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
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
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
              const SizedBox(height: 24),
              const Text('Enter Email Address', style: AppTextStyles.heading2, textAlign: TextAlign.center),
              const SizedBox(height: 6),
              const Text('We will send you an OTP to verify', style: AppTextStyles.muted, textAlign: TextAlign.center),
              const SizedBox(height: 24),
              TextField(
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                style: const TextStyle(color: AppColors.white),
                decoration: const InputDecoration(
                  hintText: 'Enter email address',
                  prefixIcon: Icon(Icons.email_outlined, color: AppColors.muted),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 12)),
              ],
              const SizedBox(height: 20),
              GoldButton(
                label: _loading ? 'SENDING...' : 'SEND OTP',
                onPressed: _loading ? null : _sendOtp,
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
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
              Center(
                child: GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: const Text('Continue with Mobile Number', style: AppTextStyles.gold),
                ),
              ),
              const TrustStrip(),
            ],
          ),
        ),
      ),
    );
  }
}
