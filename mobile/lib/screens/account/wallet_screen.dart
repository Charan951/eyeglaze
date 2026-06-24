import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../models/user.dart';
import '../../widgets/gold_button.dart';
import '../../widgets/responsive_container.dart';

class WalletTransaction {
  final String? id;
  final String type; // Refund, Added, Paid
  final double amount;
  final DateTime date;
  final String description;

  WalletTransaction({
    this.id,
    required this.type,
    required this.amount,
    required this.date,
    required this.description,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    return WalletTransaction(
      id: json['_id'] ?? json['id'],
      type: json['type'] ?? 'Paid',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      date: json['date'] != null ? DateTime.parse(json['date']) : DateTime.now(),
      description: json['description'] ?? '',
    );
  }
}

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  bool _loading = false;
  bool _addingMoney = false;
  final _amountCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _refreshWallet();
  }

  @override
  void dispose() {
    _amountCtrl.dispose();
    super.dispose();
  }

  Future<void> _refreshWallet() async {
    setState(() => _loading = true);
    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      final res = await api.getProfile();
      if (res['user'] != null) {
        auth.setUser(User.fromJson(res['user']));
      }
    } catch (_) {
      // Handle silently
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _addMoney() async {
    if (!_formKey.currentState!.validate()) return;
    final amount = double.tryParse(_amountCtrl.text.trim());
    if (amount == null || amount <= 0) return;

    setState(() => _addingMoney = true);
    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      
      final res = await api.addWalletMoney(amount);
      if (res['success'] == true || res['user'] != null || res['walletBalance'] != null) {
        _amountCtrl.clear();
        await _refreshWallet();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Successfully added ₹${amount.toInt()} to wallet!'),
              backgroundColor: AppColors.success,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } else {
        throw Exception(res['error'] ?? 'Top-up failed');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to add money: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _addingMoney = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final user = auth.currentUser;
    final balance = user?.walletBalance ?? 0.0;
    
    // Parse transactions
    final List<WalletTransaction> txs = [];
    if (user?.transactions != null) {
      for (final dynamic t in user!.transactions!) {
        if (t is Map<String, dynamic>) {
          txs.add(WalletTransaction.fromJson(t));
        }
      }
    }
    // Sort transactions newest first
    txs.sort((a, b) => b.date.compareTo(a.date));

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
        title: const Text(
          'EYEGLAZE WALLET',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w900,
            fontSize: 16,
            letterSpacing: 2,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.white),
            onPressed: _refreshWallet,
          ),
        ],
      ),
      body: ResponsiveContainer(
        child: _loading && user == null
            ? const Center(child: CircularProgressIndicator(color: AppColors.gold))
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Premium Balance Glass Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFD4A04D), Color(0xFF7A612A)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.gold.withValues(alpha: 0.15),
                            blurRadius: 20,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                user?.name?.toUpperCase() ?? 'EYEGLAZE MEMBER',
                                style: const TextStyle(
                                  color: Colors.black54,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.5,
                                ),
                              ),
                              const Spacer(),
                              const Icon(Icons.auto_awesome, color: Colors.black54, size: 16),
                            ],
                          ),
                          const SizedBox(height: 24),
                          const Text(
                            'AVAILABLE BALANCE',
                            style: TextStyle(
                              color: Colors.black45,
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.0,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '₹${balance.toStringAsFixed(2)}',
                            style: const TextStyle(
                              color: Colors.black,
                              fontSize: 36,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              const Icon(Icons.security, color: Colors.black54, size: 14),
                              const SizedBox(width: 6),
                              const Text(
                                '100% Secure & Insured Payments',
                                style: TextStyle(
                                  color: Colors.black54,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Add Money Panel
                    const Text(
                      'ADD MONEY TO WALLET',
                      style: TextStyle(
                        color: AppColors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.card,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            TextFormField(
                              controller: _amountCtrl,
                              keyboardType: TextInputType.number,
                              style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 16),
                              decoration: const InputDecoration(
                                labelText: 'Amount to Add (₹)',
                                prefixIcon: Icon(Icons.add_card, color: AppColors.gold),
                                prefixText: '₹ ',
                                prefixStyle: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold),
                              ),
                              validator: (val) {
                                if (val == null || val.isEmpty) return 'Please enter an amount';
                                final numVal = double.tryParse(val);
                                if (numVal == null || numVal <= 0) return 'Enter a valid amount greater than 0';
                                return null;
                              },
                            ),
                            const SizedBox(height: 14),
                            // Quick values
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [500, 1000, 2000, 5000].map((amt) {
                                return Expanded(
                                  child: GestureDetector(
                                    onTap: () {
                                      _amountCtrl.text = amt.toString();
                                    },
                                    child: Container(
                                      margin: const EdgeInsets.symmetric(horizontal: 4),
                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                      decoration: BoxDecoration(
                                        color: AppColors.background,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: AppColors.border),
                                      ),
                                      child: Center(
                                        child: Text(
                                          '+₹$amt',
                                          style: const TextStyle(
                                            color: AppColors.gold,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 20),
                            GoldButton(
                              label: _addingMoney ? 'PROCESSING...' : 'TOP UP WALLET ✓',
                              onPressed: _addingMoney ? null : _addMoney,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Transaction Log
                    const Text(
                      'TRANSACTION HISTORY',
                      style: TextStyle(
                        color: AppColors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (txs.isEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 16),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          children: const [
                            Icon(Icons.history_toggle_off, color: AppColors.muted, size: 48),
                            SizedBox(height: 12),
                            Text(
                              'No transactions recorded yet',
                              style: TextStyle(color: AppColors.muted, fontSize: 13),
                            ),
                          ],
                        ),
                      )
                    else
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: txs.length,
                          itemBuilder: (context, i) {
                            final tx = txs[i];
                            final isAddition = tx.type == 'Added' || tx.type == 'Refund' || tx.amount > 0;
                            final dateFormatted = DateFormat('dd MMM yyyy • hh:mm a').format(tx.date);
                            
                            return Container(
                              decoration: BoxDecoration(
                                border: i < txs.length - 1
                                    ? const Border(bottom: BorderSide(color: AppColors.border))
                                    : null,
                              ),
                              child: ListTile(
                                leading: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: isAddition
                                        ? AppColors.success.withValues(alpha: 0.1)
                                        : AppColors.gold.withValues(alpha: 0.1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    isAddition ? Icons.arrow_downward : Icons.arrow_upward,
                                    color: isAddition ? AppColors.success : AppColors.gold,
                                    size: 16,
                                  ),
                                ),
                                title: Text(
                                  tx.description.isNotEmpty ? tx.description : (isAddition ? 'Money Added' : 'Payment Made'),
                                  style: const TextStyle(
                                    color: AppColors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                                subtitle: Text(
                                  dateFormatted,
                                  style: const TextStyle(
                                    color: AppColors.muted,
                                    fontSize: 11,
                                  ),
                                ),
                                trailing: Text(
                                  '${isAddition ? "+" : "-"}₹${tx.amount.abs().toInt()}',
                                  style: TextStyle(
                                    color: isAddition ? AppColors.success : AppColors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
      ),
    );
  }
}
