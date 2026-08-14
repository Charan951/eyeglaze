import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import 'theme.dart';

String _staffRoleLabel(String role) {
  switch (role.toLowerCase()) {
    case 'store_manager':
      return 'Store manager';
    case 'support_agent':
      return 'Support';
    default:
      return 'Admin';
  }
}

/// Tells staff that admin tools live on the website, not in this app.
Future<void> showStaffUseWebAppDialog(
  BuildContext context, {
  String role = 'admin',
}) {
  final label = _staffRoleLabel(role);
  return showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (ctx) => AlertDialog(
      backgroundColor: AppColors.card,
      title: Text(
        '$label account',
        style: const TextStyle(
          color: AppColors.white,
          fontWeight: FontWeight.bold,
        ),
      ),
      content: Text(
        '$label tools aren\'t available in the mobile app. Please sign in on the EyeGlaze website to use the admin dashboard.',
        style: const TextStyle(color: AppColors.muted, height: 1.4),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text(
            'OK',
            style: TextStyle(
              color: AppColors.gold,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    ),
  );
}

/// If [user] is staff, clears any mobile session, shows the web-app dialog,
/// and returns true so the caller can abort the customer flow.
Future<bool> rejectStaffMobileLogin(
  BuildContext context,
  User user, {
  AuthService? auth,
}) async {
  if (!user.isStaff) return false;
  final authService = auth ?? context.read<AuthService>();
  await authService.clearToken();
  if (context.mounted) {
    await showStaffUseWebAppDialog(context, role: user.role);
  }
  return true;
}
