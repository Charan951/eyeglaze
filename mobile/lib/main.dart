import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme.dart';
import 'services/auth_service.dart';
import 'services/socket_service.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/splash/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final authService = AuthService();
  await authService.init();
  final socketService = SocketService();
  socketService.connect();
  runApp(EyeGlazeApp(authService: authService, socketService: socketService));
}

class EyeGlazeApp extends StatelessWidget {
  final AuthService authService;
  final SocketService socketService;
  const EyeGlazeApp({super.key, required this.authService, required this.socketService});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authService),
        ChangeNotifierProvider.value(value: socketService),
      ],
      child: MaterialApp(
        title: 'EyeGlaze',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        home: const SplashScreen(),
        routes: {
          '/login': (_) => const LoginScreen(),
          '/home': (_) => const HomeScreen(),
        },
      ),
    );
  }
}
