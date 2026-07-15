import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../models/user.dart';
import '../home/home_screen.dart';
import '../auth/login_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  // Authentication State
  bool _authChecked = false;
  bool _isLoggedIn = false;

  @override
  void initState() {
    super.initState();
    _initAuth();
  }

  Future<void> _initAuth() async {
    final authService = context.read<AuthService>();
    final apiService = ApiService(authService);

    // Initial check of local token
    await authService.init();

    // Verify token validity with backend if a token was found locally
    if (authService.isLoggedIn) {
      try {
        final profileRes = await apiService.getProfile();
        if (profileRes['success'] == true && profileRes['user'] != null) {
          authService.setUser(User.fromJson(profileRes['user']));
          _isLoggedIn = true;
        } else {
          // Expired or invalid token, clear it
          await authService.clearToken();
          _isLoggedIn = false;
        }
      } catch (_) {
        // Connection error or backend down; clear token to force re-auth
        await authService.clearToken();
        _isLoggedIn = false;
      }
    } else {
      _isLoggedIn = false;
    }

    // Delay briefly to allow the user to see the initial screen layout
    await Future.delayed(const Duration(milliseconds: 800));

    if (mounted) {
      setState(() {
        _authChecked = true;
      });

      if (_isLoggedIn) {
        // Wait for the logo slide & shrink transition to complete, then fade into HomeScreen
        await Future.delayed(const Duration(milliseconds: 1100));
        if (mounted) {
          _navigateToHome();
        }
      }
    }
  }

  void _navigateToHome() {
    Navigator.pushReplacement(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => const HomeScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
        transitionDuration: const Duration(milliseconds: 800),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Clean layout: Gold brand logo floating directly in center, GET STARTED button below it
          SafeArea(
            child: Stack(
              children: [
                // Animated brand logo
                AnimatedAlign(
                  alignment: _isLoggedIn && _authChecked
                      ? const Alignment(0.0, -0.9) // Moves to top center to align with app bar
                      : const Alignment(0.0, -0.15), // Visually centered position
                  duration: const Duration(milliseconds: 1000),
                  curve: Curves.easeInOutCubic,
                  child: Hero(
                    tag: 'eyeglaze_logo',
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 1000),
                      curve: Curves.easeInOutCubic,
                      height: _isLoggedIn && _authChecked ? 48 : 260,
                      child: Image.asset(
                        'assets/images/logo.png',
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                ),
                // Capsule GET STARTED button directly below (fades in for unauthenticated user)
                Align(
                  alignment: Alignment.bottomCenter,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 48.0, left: 24.0, right: 24.0),
                    child: AnimatedOpacity(
                      opacity: !_isLoggedIn && _authChecked ? 1.0 : 0.0,
                      duration: const Duration(milliseconds: 600),
                      curve: Curves.easeOut,
                      child: IgnorePointer(
                        ignoring: !(!_isLoggedIn && _authChecked),
                        child: SizedBox(
                          width: double.infinity,
                          height: 54,
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.pushReplacement(
                                context,
                                PageRouteBuilder(
                                  pageBuilder: (context, animation, secondaryAnimation) =>
                                      const LoginScreen(),
                                  transitionsBuilder: (context, animation, secondaryAnimation, child) {
                                    return FadeTransition(opacity: animation, child: child);
                                  },
                                  transitionDuration: const Duration(milliseconds: 800),
                                ),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.gold,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(30),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              elevation: 5,
                              shadowColor: AppColors.gold.withValues(alpha: 0.3),
                            ),
                            child: const Text(
                              'GET STARTED',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 2,
                              ),
                            ),
                          ),
                        ),
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
  }
}
