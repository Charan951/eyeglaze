import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../services/socket_service.dart';

class TicketDetailScreen extends StatefulWidget {
  final Map<String, dynamic> ticket;

  const TicketDetailScreen({super.key, required this.ticket});

  @override
  State<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<TicketDetailScreen> {
  late Map<String, dynamic> _ticket;

  @override
  void initState() {
    super.initState();
    _ticket = widget.ticket;
    
    // Connect socket listener for real-time ticket updates
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        final socketService = context.read<SocketService>();
        socketService.socket?.on('ticket_changed', _onTicketChanged);
      }
    });
  }

  @override
  void dispose() {
    try {
      final socketService = context.read<SocketService>();
      socketService.socket?.off('ticket_changed', _onTicketChanged);
    } catch (_) {}
    super.dispose();
  }

  void _onTicketChanged(dynamic data) {
    // If the changed ticket matches current ticket ID, reload it
    final changedTicket = data['ticket'];
    if (changedTicket != null && 
        (changedTicket['_id'] == _ticket['_id'] || changedTicket['ticketId'] == _ticket['ticketId'])) {
      _reloadTicket();
    }
  }

  Future<void> _reloadTicket() async {
    final authService = context.read<AuthService>();
    final api = ApiService(authService);
    try {
      final id = _ticket['_id'] ?? _ticket['id'];
      if (id == null) return;
      final response = await api.getTicketById(id);
      if (response['ticket'] != null && mounted) {
        setState(() {
          _ticket = response['ticket'];
        });
      }
    } catch (e) {
      debugPrint('Error reloading ticket: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final ticketId = _ticket['ticketId'] ?? 'Ticket Details';
    final category = _ticket['category'] ?? 'General';
    final subject = _ticket['subject'] ?? '';
    final orderNumber = _ticket['orderNumber'];
    final status = (_ticket['status']?.toString().toUpperCase() ?? 'OPEN');
    final isResolved = status == 'RESOLVED';
    
    final createdTime = _ticket['createdAt'] != null
        ? DateFormat('MMM dd, yyyy • hh:mm a').format(DateTime.parse(_ticket['createdAt']))
        : '';
        
    final userMessage = _ticket['message'] ?? '';
    final adminResponse = _ticket['adminResponse'];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.card,
        title: Text(
          ticketId,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
            fontSize: 16,
            letterSpacing: 0.5,
          ),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16, top: 14, bottom: 14),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: isResolved ? Colors.green.withValues(alpha: 0.15) : AppColors.gold.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isResolved ? Colors.green.withValues(alpha: 0.3) : AppColors.gold.withValues(alpha: 0.3),
              ),
            ),
            alignment: Alignment.center,
            child: Text(
              status,
              style: TextStyle(
                color: isResolved ? Colors.green : AppColors.gold,
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Ticket Info Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: AppColors.card,
                border: Border(bottom: BorderSide(color: AppColors.border, width: 0.5)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    subject,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.category_outlined, color: AppColors.muted, size: 13),
                      const SizedBox(width: 4),
                      Text(
                        'Category: $category',
                        style: const TextStyle(color: AppColors.muted, fontSize: 11),
                      ),
                      if (orderNumber != null && orderNumber.isNotEmpty) ...[
                        const SizedBox(width: 12),
                        const Icon(Icons.receipt_long_outlined, color: AppColors.muted, size: 13),
                        const SizedBox(width: 4),
                        Text(
                          'Order: $orderNumber',
                          style: const TextStyle(color: AppColors.muted, fontSize: 11),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),

            // Messages chat area
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: Colors.black26,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border, width: 0.5),
                      ),
                      child: Text(
                        'Ticket Opened on $createdTime',
                        style: const TextStyle(color: Colors.grey, fontSize: 10),
                      ),
                    ),
                  ),

                  // User message (on the right)
                  _buildChatBubble(
                    message: userMessage,
                    isSender: true,
                    name: 'You',
                    time: createdTime,
                  ),

                  const SizedBox(height: 16),

                  // Admin response (on the left)
                  if (adminResponse != null && adminResponse.isNotEmpty)
                    _buildChatBubble(
                      message: adminResponse,
                      isSender: false,
                      name: 'Support Agent',
                      time: 'Just now',
                    )
                  else
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        margin: const EdgeInsets.only(top: 20),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const SizedBox(
                              width: 12,
                              height: 12,
                              child: CircularProgressIndicator(color: AppColors.gold, strokeWidth: 1.5),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              isResolved 
                                ? 'Resolved. No response needed.' 
                                : 'Waiting for Support Agent...',
                              style: const TextStyle(color: AppColors.muted, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChatBubble({
    required String message,
    required bool isSender,
    required String name,
    required String time,
  }) {
    return Align(
      alignment: isSender ? Alignment.centerRight : Alignment.centerLeft,
      child: Column(
        crossAxisAlignment: isSender ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            child: Text(
              name,
              style: const TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold),
            ),
          ),
          Container(
            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isSender ? AppColors.gold : AppColors.card,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(16),
                topRight: const Radius.circular(16),
                bottomLeft: Radius.circular(isSender ? 16 : 0),
                bottomRight: Radius.circular(isSender ? 0 : 16),
              ),
              border: isSender ? null : Border.all(color: AppColors.border),
            ),
            child: Text(
              message,
              style: TextStyle(
                color: isSender ? Colors.black : Colors.white,
                fontSize: 13,
                height: 1.4,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            child: Text(
              time,
              style: const TextStyle(color: Colors.grey, fontSize: 8),
            ),
          ),
        ],
      ),
    );
  }
}
