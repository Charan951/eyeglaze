import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../widgets/gold_button.dart';
import '../../widgets/responsive_container.dart';
import 'package:intl/intl.dart';

class FAQItem {
  final String question;
  final String answer;
  final String category;

  const FAQItem({
    required this.question,
    required this.answer,
    required this.category,
  });
}

const List<FAQItem> _faqs = [
  FAQItem(
    category: 'General',
    question: 'What is EyeGlaze?',
    answer: 'EyeGlaze is a premium direct-to-consumer eyewear brand. We eliminate middleman markup by running our own state-of-the-art optical laboratory and shipping custom-fitted designer prescription glasses straight to you.',
  ),
  FAQItem(
    category: 'General',
    question: 'Do you have physical retail stores?',
    answer: 'To keep our prices affordable and quality premium, we operate exclusively online. However, we offer an interactive 7-day return policy to guarantee that you are fully satisfied with your fit and prescription.',
  ),
  FAQItem(
    category: 'General',
    question: 'What is Pupillary Distance (PD) and how is it measured?',
    answer: 'Pupillary Distance is the distance between your pupil centers in millimeters. It ensures your lens optical center align with your pupils. You can find this on your prescription, or measure it using a ruler and mirror, or ask our optician panel during verification.',
  ),
  FAQItem(
    category: 'Orders & Shipping',
    question: 'How long does delivery take?',
    answer: 'Standard prescription frames are fabricated, inspected, and shipped within 3 to 5 business days. Transit time is generally 2 business days. Express shipping is also available during checkout.',
  ),
  FAQItem(
    category: 'Orders & Shipping',
    question: 'Can I track my order?',
    answer: 'Yes! Once your frames leave our optics laboratory, a shipment confirmation email with a tracking number (e.g. Bluedart or Delhivery) is sent to you. You can also monitor live progress in the "My Orders" tab.',
  ),
  FAQItem(
    category: 'Orders & Shipping',
    question: 'How do I cancel or modify an order?',
    answer: 'Since prescription lenses are custom-ground to your exact parameters, we begin processing orders quickly. Please contact our support desk or email us within 2 hours of placement to request modifications or cancellations.',
  ),
  FAQItem(
    category: 'Prescriptions & Lenses',
    question: 'How do I upload my optical prescription?',
    answer: 'You can submit your prescription parameters directly during the frame customizer flow, or upload an image file of your prescription during checkout. Alternatively, select the option to "Email Later" and send a copy to rx@eyeglaze.com.',
  ),
  FAQItem(
    category: 'Prescriptions & Lenses',
    question: 'Do you support bifocal or progressive lenses?',
    answer: 'Yes! We support digital progressives and bifocals. During the lens customization wizard, select the Progressive option to configure multi-focal distances.',
  ),
  FAQItem(
    category: 'Prescriptions & Lenses',
    question: 'What lens coatings do you offer?',
    answer: 'All our custom prescription lenses come standard with Anti-Reflective, Scratch-Resistant, and UV400 Protection coatings at no extra charge. We also offer premium upgrades for Blue-Light Blocking and Photochromic (Transition) coatings.',
  ),
  FAQItem(
    category: 'Payments & Security',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards (Visa, Mastercard, American Express, RuPay), Netbanking, and popular digital wallets (Google Pay, Paytm, PhonePe).',
  ),
  FAQItem(
    category: 'Payments & Security',
    question: 'Is my payment information secure?',
    answer: 'Absolutely. We do not store your credit card CVV numbers. All financial transactions are encrypted using 256-bit SSL tokens and processed securely through PCI-DSS certified gateway networks.',
  ),
];

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  List<dynamic> _tickets = [];
  bool _loading = true;

  final _searchCtrl = TextEditingController();
  String _selectedCategory = 'All';
  static const List<String> _categories = [
    'All',
    'General',
    'Orders & Shipping',
    'Prescriptions & Lenses',
    'Payments & Security'
  ];

  @override
  void initState() {
    super.initState();
    _loadTickets();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
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
            if (context.mounted) {
              Navigator.pop(context);
              if (mounted) {
                await _loadTickets();
              }
              
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Ticket created successfully'),
                    backgroundColor: AppColors.success,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              }
            }
          } catch (e) {
            if (context.mounted) {
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
    final filteredFaqs = _faqs.where((faq) {
      final matchesCategory = _selectedCategory == 'All' || faq.category == _selectedCategory;
      final matchesSearch = faq.question.toLowerCase().contains(_searchCtrl.text.toLowerCase()) ||
          faq.answer.toLowerCase().contains(_searchCtrl.text.toLowerCase());
      return matchesCategory && matchesSearch;
    }).toList();

    return DefaultTabController(
      length: 2,
      child: Scaffold(
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
          bottom: const TabBar(
            indicatorColor: AppColors.gold,
            labelColor: AppColors.gold,
            unselectedLabelColor: AppColors.muted,
            indicatorSize: TabBarIndicatorSize.tab,
            labelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1),
            tabs: [
              Tab(text: 'FAQs'),
              Tab(text: 'TICKETS'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            // FAQs Tab
            ResponsiveContainer(
              child: Column(
                children: [
                  // Search Bar
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: TextField(
                      controller: _searchCtrl,
                      onChanged: (val) => setState(() {}),
                      style: const TextStyle(color: AppColors.white, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Search for keywords...',
                        hintStyle: const TextStyle(color: AppColors.muted, fontSize: 14),
                        prefixIcon: const Icon(Icons.search, color: AppColors.gold, size: 20),
                        suffixIcon: _searchCtrl.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, color: AppColors.muted, size: 20),
                                onPressed: () {
                                  _searchCtrl.clear();
                                  setState(() {});
                                },
                              )
                            : null,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.border),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.gold),
                        ),
                      ),
                    ),
                  ),
                  // Category chips
                  SizedBox(
                    height: 38,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _categories.length,
                      itemBuilder: (context, i) {
                        final cat = _categories[i];
                        final isSelected = _selectedCategory == cat;
                        return GestureDetector(
                          onTap: () => setState(() => _selectedCategory = cat),
                          child: Container(
                            margin: const EdgeInsets.only(right: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.gold : AppColors.card,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSelected ? AppColors.gold : AppColors.border,
                              ),
                            ),
                            child: Center(
                              child: Text(
                                cat,
                                style: TextStyle(
                                  color: isSelected ? Colors.black : AppColors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 12),
                  // FAQ items list
                  Expanded(
                    child: filteredFaqs.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(32.0),
                              child: Text(
                                'No FAQs match your search "${_searchCtrl.text}"',
                                style: const TextStyle(color: AppColors.muted, fontSize: 14),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: filteredFaqs.length,
                            itemBuilder: (context, index) {
                              final faq = filteredFaqs[index];
                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                decoration: BoxDecoration(
                                  color: AppColors.card,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppColors.border),
                                ),
                                child: Theme(
                                  data: Theme.of(context).copyWith(
                                    dividerColor: Colors.transparent,
                                  ),
                                  child: ExpansionTile(
                                    iconColor: AppColors.gold,
                                    textColor: AppColors.gold,
                                    collapsedIconColor: AppColors.muted,
                                    collapsedTextColor: AppColors.white,
                                    title: Text(
                                      faq.question,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    children: [
                                      Padding(
                                        padding: const EdgeInsets.only(
                                          left: 16,
                                          right: 16,
                                          bottom: 16,
                                        ),
                                        child: Text(
                                          faq.answer,
                                          style: const TextStyle(
                                            color: AppColors.muted,
                                            fontSize: 13,
                                            height: 1.4,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            ),
            // Tickets Tab
            ResponsiveContainer(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.gold))
                  : _tickets.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.confirmation_number_outlined, size: 64, color: AppColors.muted),
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
          ],
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
