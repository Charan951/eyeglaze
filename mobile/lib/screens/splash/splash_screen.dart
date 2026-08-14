import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../services/socket_service.dart';
import '../../models/user.dart';
import '../../core/staff_access.dart';
import '../../services/membership_price_provider.dart';
import '../home/home_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  bool _logoUp = false;

  @override
  void initState() {
    super.initState();
    _initAuth();
  }

  Future<void> _initAuth() async {
    final authService = context.read<AuthService>();
    final apiService = ApiService(authService);
    final membershipPrice = context.read<MembershipPriceProvider>();

    // Initial check of local token
    await authService.init();
    await membershipPrice.load(apiService);

    context.read<SocketService>().socket?.on('settings_changed', (_) {
      membershipPrice.load(apiService);
    });

    // Verify token validity with backend if a token was found locally
    var staffBlocked = false;
    String staffRole = 'admin';
    if (authService.isLoggedIn) {
      try {
        final profileRes = await apiService.getProfile();
        if (profileRes['success'] == true && profileRes['user'] != null) {
          final user = User.fromJson(profileRes['user']);
          if (user.isStaff) {
            await authService.clearToken();
            staffBlocked = true;
            staffRole = user.role;
          } else {
            authService.setUser(user);
          }
        } else {
          // Expired or invalid token, clear it
          await authService.clearToken();
        }
      } catch (_) {
        // Connection error or backend down; clear token to force re-auth
        await authService.clearToken();
      }
    }

    // Delay briefly to allow the user to see the initial screen layout
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;
    setState(() => _logoUp = true);

    // Always continue straight into the app after splash, whether or not the
    // user is logged in — login is only required later, at checkout/account actions.
    await Future.delayed(const Duration(milliseconds: 1100));
    if (!mounted) return;
    if (staffBlocked) {
      await showStaffUseWebAppDialog(context, role: staffRole);
    }
    if (!mounted) return;
    _navigateToHome();
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
      body: SafeArea(
        child: AnimatedAlign(
          alignment: _logoUp ? const Alignment(0.0, -0.9) : const Alignment(0.0, -0.15),
          duration: const Duration(milliseconds: 1000),
          curve: Curves.easeInOutCubic,
          child: Hero(
            tag: 'eyeglaze_logo',
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 1000),
              curve: Curves.easeInOutCubic,
              height: _logoUp ? 48 : 260,
              child: Image.asset(
                'assets/images/logo.png',
                fit: BoxFit.contain,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
