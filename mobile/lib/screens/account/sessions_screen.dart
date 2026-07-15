import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';

class SessionsScreen extends StatefulWidget {
  const SessionsScreen({super.key});

  @override
  State<SessionsScreen> createState() => _SessionsScreenState();
}

class _SessionsScreenState extends State<SessionsScreen> {
  List<dynamic> _sessions = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadSessions();
  }

  Future<void> _loadSessions() async {
    setState(() => _loading = true);
    final authService = context.read<AuthService>();
    final api = ApiService(authService);
    try {
      final data = await api.getSessions();
      setState(() {
        _sessions = data;
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load active sessions: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _revokeSession(String sessionId) async {
    final authService = context.read<AuthService>();
    final api = ApiService(authService);
    try {
      final res = await api.revokeSession(sessionId);
      if (res['success'] == true || res['error'] == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Session revoked successfully'), backgroundColor: AppColors.success),
          );
          _loadSessions();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to revoke session: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _logoutAll() async {
    final authService = context.read<AuthService>();
    final api = ApiService(authService);
    try {
      final res = await api.logoutAllDevices();
      if (res['success'] == true || res['error'] == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Logged out other devices successfully'), backgroundColor: AppColors.success),
          );
          _loadSessions();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to logout other devices: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.card,
        title: const Text(
          'Active Login Sessions',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
            fontSize: 16,
            letterSpacing: 0.5,
          ),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.gold))
          : Column(
              children: [
                Expanded(
                  child: _sessions.isEmpty
                      ? const Center(
                          child: Text(
                            'No active sessions found',
                            style: TextStyle(color: AppColors.muted),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _sessions.length,
                          itemBuilder: (context, index) {
                            final session = _sessions[index];
                            final userAgent = session['userAgent'] ?? 'Unknown Browser / Device';
                            final ipAddress = session['ipAddress'] ?? 'Unknown IP';
                            final isCurrent = session['isCurrent'] == true;
                            final createdAt = session['createdAt'] != null
                                ? DateFormat('MMM dd, yyyy • hh:mm a').format(DateTime.parse(session['createdAt']))
                                : 'Unknown time';
                                
                            final sessionId = session['_id'] ?? session['id'] ?? '';

                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: AppColors.card,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: isCurrent ? AppColors.gold.withValues(alpha: 0.1) : Colors.white10,
                                    child: Icon(
                                      isCurrent ? Icons.phone_android : Icons.laptop_chromebook,
                                      color: isCurrent ? AppColors.gold : Colors.grey,
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(
                                                userAgent,
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 13,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                            if (isCurrent)
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: AppColors.gold.withValues(alpha: 0.15),
                                                  borderRadius: BorderRadius.circular(8),
                                                  border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
                                                ),
                                                child: const Text(
                                                  'THIS DEVICE',
                                                  style: TextStyle(color: AppColors.gold, fontSize: 8, fontWeight: FontWeight.bold),
                                                ),
                                              ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'IP: $ipAddress',
                                          style: const TextStyle(color: Colors.grey, fontSize: 11),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          'Logged in: $createdAt',
                                          style: const TextStyle(color: Colors.grey, fontSize: 10),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (!isCurrent && sessionId.isNotEmpty)
                                    IconButton(
                                      onPressed: () => _revokeSession(sessionId),
                                      icon: const Icon(Icons.delete_outline, color: AppColors.error, size: 20),
                                    ),
                                ],
                              ),
                            );
                          },
                        ),
                ),
                if (_sessions.length > 1)
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: ElevatedButton.icon(
                      onPressed: _logoutAll,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.error.withValues(alpha: 0.1),
                        side: const BorderSide(color: AppColors.error, width: 0.5),
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      icon: const Icon(Icons.logout, color: AppColors.error, size: 18),
                      label: const Text(
                        'LOGOUT ALL OTHER DEVICES',
                        style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                  ),
              ],
            ),
    );
  }
}
