import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../widgets/gold_button.dart';
import '../../widgets/responsive_container.dart';
import 'package:intl/intl.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  List<dynamic> _tickets = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadTickets();
  }

  Future<void> _loadTickets() async {
    final authService = context.read<AuthService>();
    setState(() => _loading = true);
    try {
      final api = ApiService(authService);
      final response = await api.getTickets();
      if (response['tickets'] != null) {
        setState(() => _tickets = response['tickets']);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load tickets: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showCreateTicketForm() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _CreateTicketForm(
        onSubmit: (data) async {
          final authService = context.read<AuthService>();
          final api = ApiService(authService);
          try {
            await api.createTicket(data);
            if (mounted) {
              Navigator.pop(context);
              await _loadTickets();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Ticket created successfully'),
                  backgroundColor: AppColors.success,
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Failed to create ticket: $e'), backgroundColor: AppColors.error),
              );
            }
          }
        },
      ),
    );
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
        title: const Text('HELP & SUPPORT', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 2)),
      ),
      body: ResponsiveContainer(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.gold))
            : _tickets.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.help_outline, size: 64, color: AppColors.muted),
                        const SizedBox(height: 16),
                        const Text('No support tickets yet', style: TextStyle(color: AppColors.muted, fontSize: 16)),
                        const SizedBox(height: 24),
                        GoldButton(
                          label: 'CREATE TICKET',
                          onPressed: _showCreateTicketForm,
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _tickets.length + 1,
                    itemBuilder: (context, index) {
                      if (index == _tickets.length) {
                        return Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: GoldButton(
                            label: 'CREATE NEW TICKET',
                            onPressed: _showCreateTicketForm,
                          ),
                        );
                      }
                      final ticket = _tickets[index];
                      final createdAt = ticket['createdAt'] != null
                          ? DateFormat('MMM dd, yyyy • hh:mm a').format(DateTime.parse(ticket['createdAt']))
                          : '';
                      final status = ticket['status']?.toString().toUpperCase() ?? 'OPEN';
                      final statusColor = status == 'OPEN' ? AppColors.gold : status == 'IN_PROGRESS' ? AppColors.success : AppColors.muted;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    ticket['ticketId'] ?? 'Ticket #${index + 1}',
                                    style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: statusColor.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                                  ),
                                  child: Text(
                                    status,
                                    style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(ticket['subject'] ?? '', style: const TextStyle(color: AppColors.white, fontSize: 15, fontWeight: FontWeight.w500)),
                            const SizedBox(height: 4),
                            if (ticket['category'] != null)
                              Row(
                                children: [
                                  const Icon(Icons.label_outline, color: AppColors.muted, size: 14),
                                  const SizedBox(width: 4),
                                  Text(ticket['category'], style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                                ],
                              ),
                            if (ticket['orderNumber'] != null && ticket['orderNumber']!.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(Icons.receipt_long_outlined, color: AppColors.muted, size: 14),
                                  const SizedBox(width: 4),
                                  Text('Order: ${ticket['orderNumber']}', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                                ],
                              ),
                            ],
                            const SizedBox(height: 8),
                            Text(ticket['message'] ?? '', style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                            if (createdAt.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Text(createdAt, style: const TextStyle(color: AppColors.muted, fontSize: 11)),
                            ],
                          ],
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}

class _CreateTicketForm extends StatefulWidget {
  final Function(Map<String, dynamic>) onSubmit;

  const _CreateTicketForm({required this.onSubmit});

  @override
  State<_CreateTicketForm> createState() => _CreateTicketFormState();
}

class _CreateTicketFormState extends State<_CreateTicketForm> {
  final _formKey = GlobalKey<FormState>();
  final _subjectCtrl = TextEditingController();
  final _orderNumberCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();
  String _selectedCategory = 'General';
  bool _loading = false;

  static const List<String> _categories = [
    'General',
    'Order Status',
    'Returns & Refunds',
    'Product Query',
    'Prescription Help',
    'Payment Issues',
    'Technical Support',
    'Feedback',
  ];

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _orderNumberCtrl.dispose();
    _messageCtrl.dispose();
    super.dispose();
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await widget.onSubmit({
        'category': _selectedCategory,
        'subject': _subjectCtrl.text.trim(),
        'orderNumber': _orderNumberCtrl.text.trim(),
        'message': _messageCtrl.text.trim(),
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: AppColors.border, width: 1.5)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 12,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Create Support Ticket',
                    style: TextStyle(color: AppColors.white, fontSize: 18, fontWeight: FontWeight.w900),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: AppColors.muted, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              DropdownButtonFormField<String>(
                initialValue: _selectedCategory,
                dropdownColor: AppColors.card,
                style: const TextStyle(color: AppColors.white, fontSize: 14),
                decoration: const InputDecoration(
                  labelText: 'Category',
                  prefixIcon: Icon(Icons.category_outlined, color: AppColors.gold, size: 18),
                ),
                items: _categories
                    .map((cat) => DropdownMenuItem(
                          value: cat,
                          child: Text(cat, style: const TextStyle(color: AppColors.white)),
                        ))
                    .toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedCategory = val);
                },
                validator: (val) => val?.isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _subjectCtrl,
                style: const TextStyle(color: AppColors.white, fontSize: 14),
                decoration: const InputDecoration(
                  labelText: 'Subject',
                  prefixIcon: Icon(Icons.title_outlined, color: AppColors.gold, size: 18),
                ),
                validator: (val) => val?.isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _orderNumberCtrl,
                style: const TextStyle(color: AppColors.white, fontSize: 14),
                decoration: const InputDecoration(
                  labelText: 'Order Number (Optional)',
                  prefixIcon: Icon(Icons.receipt_long_outlined, color: AppColors.gold, size: 18),
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _messageCtrl,
                style: const TextStyle(color: AppColors.white, fontSize: 14),
                decoration: const InputDecoration(
                  labelText: 'Message',
                  prefixIcon: Icon(Icons.message_outlined, color: AppColors.gold, size: 18),
                ),
                maxLines: 4,
                validator: (val) => val?.isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 24),
              GoldButton(
                label: 'SUBMIT TICKET',
                onPressed: _loading ? null : _submit,
                loading: _loading,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
