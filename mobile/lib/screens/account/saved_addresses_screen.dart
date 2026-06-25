import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../models/user.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../widgets/gold_button.dart';
import '../../widgets/responsive_container.dart';

class SavedAddressesScreen extends StatefulWidget {
  const SavedAddressesScreen({super.key});

  @override
  State<SavedAddressesScreen> createState() => _SavedAddressesScreenState();
}

class _SavedAddressesScreenState extends State<SavedAddressesScreen> {
  List<UserAddress> _addresses = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadAddresses();
  }

  Future<void> _loadAddresses() async {
    final authService = context.read<AuthService>();
    setState(() => _loading = true);
    try {
      final api = ApiService(authService);
      final profile = await api.getProfile();
      if (profile['success'] == true && profile['user'] != null) {
        final user = User.fromJson(profile['user']);
        authService.setUser(user);
        setState(() => _addresses = user.addresses);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load addresses: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showAddressForm([UserAddress? address]) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _AddressForm(
        address: address,
        onSubmit: (data) async {
          final authService = context.read<AuthService>();
          final api = ApiService(authService);
          try {
            if (address != null) {
              await api.updateAddress(address.id, data);
            } else {
              await api.addAddress(data);
            }
            if (context.mounted) {
              Navigator.pop(context);
              if (mounted) {
                await _loadAddresses();
              }
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Address saved successfully'),
                    backgroundColor: AppColors.success,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              }
            }
          } catch (e) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Failed to save address: $e'), backgroundColor: AppColors.error),
              );
            }
          }
        },
      ),
    );
  }

  Future<void> _setDefault(String id) async {
    final authService = context.read<AuthService>();
    final api = ApiService(authService);
    try {
      await api.setDefaultAddress(id);
      await _loadAddresses();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Default address set'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to set default: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _deleteAddress(String id) async {
    final authService = context.read<AuthService>();
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.card,
        title: const Text('Delete Address', style: TextStyle(color: AppColors.white)),
        content: const Text('Are you sure you want to delete this address?', style: TextStyle(color: AppColors.muted)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: AppColors.muted)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final api = ApiService(authService);
      try {
        await api.deleteAddress(id);
        if (!mounted) return;
        await _loadAddresses();
        if (!mounted || !context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Address deleted'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
      } catch (e) {
        if (!mounted || !context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete address: $e'), backgroundColor: AppColors.error),
        );
      }
    }
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
        title: const Text('SAVED ADDRESSES', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 2)),
      ),
      body: ResponsiveContainer(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.gold))
            : _addresses.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.location_on_outlined, size: 64, color: AppColors.muted),
                        const SizedBox(height: 16),
                        const Text('No saved addresses', style: TextStyle(color: AppColors.muted, fontSize: 16)),
                        const SizedBox(height: 24),
                        GoldButton(
                          label: 'ADD ADDRESS',
                          onPressed: () => _showAddressForm(),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _addresses.length + 1,
                    itemBuilder: (context, index) {
                      if (index == _addresses.length) {
                        return Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: GoldButton(
                            label: 'ADD NEW ADDRESS',
                            onPressed: () => _showAddressForm(),
                          ),
                        );
                      }
                      final address = _addresses[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: address.isDefault ? AppColors.gold : AppColors.border),
                          boxShadow: address.isDefault
                              ? [BoxShadow(color: AppColors.gold.withValues(alpha: 0.1), blurRadius: 10)]
                              : null,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    address.fullName ?? '',
                                    style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                  ),
                                ),
                                if (address.isDefault)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: AppColors.gold.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Text(
                                      'DEFAULT',
                                      style: TextStyle(color: AppColors.gold, fontSize: 10, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(address.mobile ?? '', style: const TextStyle(color: AppColors.muted, fontSize: 14)),
                            const SizedBox(height: 8),
                            Text(
                              '${address.line1}${address.line2 != null ? ', ${address.line2}' : ''}, ${address.city}, ${address.state} - ${address.pincode}',
                              style: const TextStyle(color: AppColors.white, fontSize: 14),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                if (!address.isDefault)
                                  TextButton.icon(
                                    onPressed: () => _setDefault(address.id),
                                    icon: const Icon(Icons.check_circle_outline, size: 18, color: AppColors.gold),
                                    label: const Text('Set Default', style: TextStyle(color: AppColors.gold, fontSize: 13)),
                                  ),
                                const Spacer(),
                                IconButton(
                                  icon: const Icon(Icons.edit_outlined, color: AppColors.muted, size: 20),
                                  onPressed: () => _showAddressForm(address),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: AppColors.error, size: 20),
                                  onPressed: () => _deleteAddress(address.id),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}

class _AddressForm extends StatefulWidget {
  final UserAddress? address;
  final Function(Map<String, dynamic>) onSubmit;

  const _AddressForm({required this.address, required this.onSubmit});

  @override
  State<_AddressForm> createState() => _AddressFormState();
}

class _AddressFormState extends State<_AddressForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _fullNameCtrl;
  late TextEditingController _mobileCtrl;
  late TextEditingController _pincodeCtrl;
  late TextEditingController _line1Ctrl;
  late TextEditingController _line2Ctrl;
  late TextEditingController _cityCtrl;
  late TextEditingController _stateCtrl;
  String _type = 'Home';
  bool _isDefault = false;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _fullNameCtrl = TextEditingController(text: widget.address?.fullName);
    _mobileCtrl = TextEditingController(text: widget.address?.mobile);
    _pincodeCtrl = TextEditingController(text: widget.address?.pincode);
    _line1Ctrl = TextEditingController(text: widget.address?.line1);
    _line2Ctrl = TextEditingController(text: widget.address?.line2);
    _cityCtrl = TextEditingController(text: widget.address?.city);
    _stateCtrl = TextEditingController(text: widget.address?.state);
    _type = widget.address?.type ?? 'Home';
    _isDefault = widget.address?.isDefault ?? false;
  }

  @override
  void dispose() {
    _fullNameCtrl.dispose();
    _mobileCtrl.dispose();
    _pincodeCtrl.dispose();
    _line1Ctrl.dispose();
    _line2Ctrl.dispose();
    _cityCtrl.dispose();
    _stateCtrl.dispose();
    super.dispose();
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await widget.onSubmit({
        'fullName': _fullNameCtrl.text.trim(),
        'mobile': _mobileCtrl.text.trim(),
        'pincode': _pincodeCtrl.text.trim(),
        'line1': _line1Ctrl.text.trim(),
        'line2': _line2Ctrl.text.trim(),
        'city': _cityCtrl.text.trim(),
        'state': _stateCtrl.text.trim(),
        'type': _type,
        'isDefault': _isDefault,
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
                  Text(
                    widget.address != null ? 'Edit Address' : 'Add New Address',
                    style: const TextStyle(color: AppColors.white, fontSize: 18, fontWeight: FontWeight.w900),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: AppColors.muted, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _fullNameCtrl,
                style: const TextStyle(color: AppColors.white, fontSize: 14),
                decoration: const InputDecoration(
                  labelText: 'Full Name',
                  prefixIcon: Icon(Icons.person_outline, color: AppColors.gold, size: 18),
                ),
                validator: (val) => val?.isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _mobileCtrl,
                style: const TextStyle(color: AppColors.white, fontSize: 14),
                decoration: const InputDecoration(
                  labelText: 'Mobile Number',
                  prefixIcon: Icon(Icons.phone_iphone, color: AppColors.gold, size: 18),
                ),
                keyboardType: TextInputType.phone,
                validator: (val) => val?.isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _pincodeCtrl,
                style: const TextStyle(color: AppColors.white, fontSize: 14),
                decoration: const InputDecoration(
                  labelText: 'Pincode',
                  prefixIcon: Icon(Icons.pin_drop_outlined, color: AppColors.gold, size: 18),
                ),
                keyboardType: TextInputType.number,
                validator: (val) => val?.isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _line1Ctrl,
                style: const TextStyle(color: AppColors.white, fontSize: 14),
                decoration: const InputDecoration(
                  labelText: 'House No, Street',
                  prefixIcon: Icon(Icons.location_on_outlined, color: AppColors.gold, size: 18),
                ),
                validator: (val) => val?.isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _line2Ctrl,
                style: const TextStyle(color: AppColors.white, fontSize: 14),
                decoration: const InputDecoration(
                  labelText: 'Landmark (Optional)',
                  prefixIcon: Icon(Icons.near_me_outlined, color: AppColors.gold, size: 18),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _cityCtrl,
                      style: const TextStyle(color: AppColors.white, fontSize: 14),
                      decoration: const InputDecoration(
                        labelText: 'City',
                        prefixIcon: Icon(Icons.location_city_outlined, color: AppColors.gold, size: 18),
                      ),
                      validator: (val) => val?.isEmpty ?? true ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _stateCtrl,
                      style: const TextStyle(color: AppColors.white, fontSize: 14),
                      decoration: const InputDecoration(
                        labelText: 'State',
                        prefixIcon: Icon(Icons.map_outlined, color: AppColors.gold, size: 18),
                      ),
                      validator: (val) => val?.isEmpty ?? true ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                children: ['Home', 'Work', 'Other'].map((type) {
                  final isSelected = _type == type;
                  return FilterChip(
                    label: Text(type),
                    selected: isSelected,
                    onSelected: (selected) {
                      if (selected) setState(() => _type = type);
                    },
                    backgroundColor: AppColors.background,
                    selectedColor: AppColors.gold.withValues(alpha: 0.15),
                    checkmarkColor: AppColors.gold,
                    labelStyle: TextStyle(color: isSelected ? AppColors.gold : AppColors.muted, fontSize: 13),
                    side: BorderSide(color: isSelected ? AppColors.gold : AppColors.border),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                value: _isDefault,
                onChanged: (val) => setState(() => _isDefault = val),
                title: const Text('Set as Default Address', style: TextStyle(color: AppColors.white, fontSize: 14)),
                activeThumbColor: AppColors.gold,
                contentPadding: EdgeInsets.zero,
              ),
              const SizedBox(height: 24),
              GoldButton(
                label: widget.address != null ? 'UPDATE ADDRESS' : 'SAVE ADDRESS',
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
