import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../widgets/eyeglaze_logo.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../models/user.dart';
import '../splash/splash_screen.dart';
import '../home/home_screen.dart';
import 'forgot_password_screen.dart';
import 'otp_screen.dart';
import '../cart/checkout_screen.dart';

bool _looksLikeEmail(String value) => value.contains('@');

bool _looksLikePhone(String value) {
  final digitsOnly = value.replaceAll(RegExp(r'[^0-9]'), '');
  return digitsOnly.length == 10 && digitsOnly == value.replaceAll(RegExp(r'\s'), '');
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  // 'login' or 'register' — switched only via the link at the bottom, no tabs.
  String _activeTab = 'login';

  // Step 1: identifier (email or mobile number)
  bool _identifierConfirmed = false;

  // Text Controllers
  final _identifierCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  bool _showPassword = false;
  bool _loading = false;
  String? _error;
  String? _successMsg;

  @override
  void dispose() {
    _identifierCtrl.dispose();
    _nameCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  void _resetIdentifierStep() {
    setState(() {
      _identifierConfirmed = false;
      _error = null;
      _successMsg = null;
      _passwordCtrl.clear();
    });
  }

  void _toggleMode() {
    setState(() {
      _activeTab = _activeTab == 'login' ? 'register' : 'login';
      _identifierConfirmed = false;
      _error = null;
      _successMsg = null;
      _passwordCtrl.clear();
      _nameCtrl.clear();
    });
  }

  Future<void> _handleContinue() async {
    final identifier = _identifierCtrl.text.trim();
    setState(() => _error = null);

    if (identifier.isEmpty) {
      setState(() => _error = 'Enter your email or mobile number');
      return;
    }

    if (_looksLikeEmail(identifier)) {
      // Email path: reveal password (+ name, for sign up) on this same screen.
      setState(() {
        _identifierConfirmed = true;
      });
      return;
    }

    if (_looksLikePhone(identifier)) {
      // Mobile path: send OTP and move to the verification screen.
      setState(() => _loading = true);
      try {
        final authService = context.read<AuthService>();
        final apiService = ApiService(authService);
        final digitsOnly = identifier.replaceAll(RegExp(r'[^0-9]'), '');
        await apiService.sendOtp(phone: digitsOnly);
        if (mounted) {
          final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
          final redirectTo = args?['redirectTo'] as String?;
          await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => OtpScreen(phone: digitsOnly, email: null),
              settings: RouteSettings(arguments: redirectTo != null ? {'redirectTo': redirectTo} : null),
            ),
          );
        }
      } catch (e) {
        setState(() => _error = 'Failed to send OTP. Try again.');
      } finally {
        if (mounted) setState(() => _loading = false);
      }
      return;
    }

    setState(() => _error = 'Enter a valid email address or 10-digit mobile number');
  }

  Future<void> _handleSubmit() async {
    final email = _identifierCtrl.text.trim();
    final name = _nameCtrl.text.trim();
    final password = _passwordCtrl.text.trim();

    setState(() {
      _error = null;
      _successMsg = null;
      _loading = true;
    });

    try {
      final authService = context.read<AuthService>();
      final apiService = ApiService(authService);

      if (_activeTab == 'register') {
        if (name.isEmpty || email.isEmpty || password.isEmpty) {
          throw Exception('All fields are required');
        }
        final res = await apiService.register(name: name, email: email, password: password);
        if (res['success'] == true) {
          final token = res['token'] as String;
          final userJson = res['user'] as Map<String, dynamic>;
          final user = User.fromJson(userJson);

          await authService.saveToken(token, user: user);
          setState(() {
            _successMsg = 'Registration successful!';
          });
          _goToHome();
        } else {
          throw Exception(res['error'] ?? 'Registration failed');
        }
      } else {
        if (email.isEmpty || password.isEmpty) {
          throw Exception('Email and password are required');
        }
        final res = await apiService.login(email: email, password: password);
        if (res['success'] == true) {
          final token = res['token'] as String;
          final userJson = res['user'] as Map<String, dynamic>;
          final user = User.fromJson(userJson);

          await authService.saveToken(token, user: user);
          _goToHome();
        } else {
          throw Exception(res['error'] ?? 'Invalid email or password');
        }
      }
    } catch (err) {
      setState(() {
        _error = err.toString().replaceAll('Exception: ', '');
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  void _goToHome() {
    if (mounted) {
      final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      final redirectTo = args?['redirectTo'] as String?;
      if (redirectTo == '/checkout') {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const CheckoutScreen()),
        );
      } else {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const HomeScreen()),
        );
      }
    }
  }

  InputDecoration _fieldDecoration({required String hint, required IconData icon, Widget? suffixIcon}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: AppColors.muted, fontSize: 14),
      prefixIcon: Icon(icon, color: AppColors.gold, size: 20),
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: AppColors.card,
      contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 4),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.gold, width: 1.5),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isRegister = _activeTab == 'register';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Stack(
          children: [
            // Top Bar — pinned to the top
            Positioned(
              top: 0,
              left: 20,
              right: 20,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: AppColors.white),
                    onPressed: () {
                      if (_identifierConfirmed) {
                        _resetIdentifierStep();
                        return;
                      }
                      Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(builder: (_) => const SplashScreen()),
                      );
                    },
                  ),
                  TextButton(
                    onPressed: () {
                      if (Navigator.canPop(context)) {
                        Navigator.pop(context);
                      } else {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(builder: (_) => const HomeScreen()),
                        );
                      }
                    },
                    child: const Text(
                      'SKIP',
                      style: TextStyle(
                        color: AppColors.gold,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Form group — pinned toward the bottom of the screen
            Align(
              alignment: Alignment.bottomCenter,
              child: SingleChildScrollView(
                reverse: true,
                padding: const EdgeInsets.fromLTRB(20, 60, 20, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
              // Logo
              const Center(
                child: EyeGlazeLogo(size: 2.0),
              ),
              const SizedBox(height: 28),

              // Headline
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: Column(
                  key: ValueKey('$isRegister-$_identifierConfirmed'),
                  children: [
                    Text(
                      isRegister ? 'Create Your Account' : 'Welcome Back',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: AppColors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      isRegister
                          ? 'Sign up with your email to get started'
                          : 'Sign in to continue shopping',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppColors.muted, fontSize: 13),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // Card containing the form
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.card.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (!_identifierConfirmed) ...[
                      // Step 1: single identifier field — email or mobile number
                      TextField(
                        controller: _identifierCtrl,
                        keyboardType: TextInputType.emailAddress,
                        style: const TextStyle(color: AppColors.white, fontSize: 15),
                        decoration: _fieldDecoration(
                          hint: 'Email or 10-digit mobile number',
                          icon: Icons.alternate_email,
                        ),
                        onSubmitted: (_) => _handleContinue(),
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'Use a mobile number for OTP sign-in, or an email address to continue with a password.',
                        style: TextStyle(color: AppColors.muted, fontSize: 12, height: 1.4),
                      ),
                    ] else ...[
                      // Step 2 (email path only): name (sign up) + password
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.email_outlined, color: AppColors.gold, size: 18),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                _identifierCtrl.text.trim(),
                                style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w600, fontSize: 14),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            GestureDetector(
                              onTap: _resetIdentifierStep,
                              child: const Text(
                                'CHANGE',
                                style: TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      if (isRegister) ...[
                        TextField(
                          controller: _nameCtrl,
                          style: const TextStyle(color: AppColors.white, fontSize: 15),
                          decoration: _fieldDecoration(hint: 'Full name', icon: Icons.person_outline),
                        ),
                        const SizedBox(height: 12),
                      ],
                      TextField(
                        controller: _passwordCtrl,
                        obscureText: !_showPassword,
                        style: const TextStyle(color: AppColors.white, fontSize: 15),
                        decoration: _fieldDecoration(
                          hint: 'Password',
                          icon: Icons.lock_outline,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                              color: AppColors.muted,
                              size: 19,
                            ),
                            onPressed: () => setState(() => _showPassword = !_showPassword),
                          ),
                        ),
                        onSubmitted: (_) => _handleSubmit(),
                      ),
                      if (!isRegister) ...[
                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerRight,
                          child: GestureDetector(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const ForgotPasswordScreen()),
                              );
                            },
                            child: const Text(
                              'Forgot Password?',
                              style: TextStyle(
                                color: AppColors.gold,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],

                    // Error / success banners
                    if (_error != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.error.withValues(alpha: 0.1),
                          border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: AppColors.error, fontSize: 12, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                    if (_successMsg != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.success.withValues(alpha: 0.1),
                          border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _successMsg!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: AppColors.success, fontSize: 12, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],

                    const SizedBox(height: 20),

                    // Submit Button
                    SizedBox(
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _loading ? null : (_identifierConfirmed ? _handleSubmit : _handleContinue),
                        style: ElevatedButton.styleFrom(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: _loading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(color: AppColors.white, strokeWidth: 2),
                              )
                            : Text(
                                _identifierConfirmed
                                    ? (isRegister ? 'CREATE ACCOUNT' : 'SIGN IN')
                                    : 'CONTINUE',
                                style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: 0.5),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Switch between Sign In / Sign Up — the single entry point for registration.
              Center(
                child: GestureDetector(
                  onTap: _toggleMode,
                  child: RichText(
                    text: TextSpan(
                      style: const TextStyle(color: AppColors.muted, fontSize: 13),
                      children: [
                        TextSpan(
                          text: isRegister ? 'Already have an account? ' : "New to EyeGlaze? ",
                        ),
                        TextSpan(
                          text: isRegister ? 'Sign In' : 'Create one',
                          style: const TextStyle(
                            color: AppColors.gold,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Footer
              RichText(
                textAlign: TextAlign.center,
                text: const TextSpan(
                  style: TextStyle(color: AppColors.muted, fontSize: 12),
                  children: [
                    TextSpan(text: 'By continuing, you agree to our '),
                    TextSpan(
                      text: 'Terms of Use',
                      style: TextStyle(color: AppColors.gold, decoration: TextDecoration.underline),
                    ),
                    TextSpan(text: ' and '),
                    TextSpan(
                      text: 'Privacy Policy',
                      style: TextStyle(color: AppColors.gold, decoration: TextDecoration.underline),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
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
