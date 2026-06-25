import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../widgets/gold_button.dart';
import '../../widgets/responsive_container.dart';
import 'package:intl/intl.dart';

class PrescriptionsScreen extends StatefulWidget {
  const PrescriptionsScreen({super.key});

  @override
  State<PrescriptionsScreen> createState() => _PrescriptionsScreenState();
}

class _PrescriptionsScreenState extends State<PrescriptionsScreen> {
  List<dynamic> _prescriptions = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadPrescriptions();
  }

  Future<void> _loadPrescriptions() async {
    final authService = context.read<AuthService>();
    setState(() => _loading = true);
    try {
      final api = ApiService(authService);
      final response = await api.getPrescriptions();
      if (response['prescriptions'] != null) {
        setState(() => _prescriptions = response['prescriptions']);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load prescriptions: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showAddForm() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _AddPrescriptionForm(
        onSubmit: (data) async {
          final authService = context.read<AuthService>();
          final api = ApiService(authService);
          try {
            await api.addPrescription(
              re: data['re'],
              le: data['le'],
              pd: data['pd'],
              fileBytes: data['fileBytes'],
              fileName: data['fileName'],
              mimeType: data['mimeType'],
            );
            if (context.mounted) {
              Navigator.pop(context);
              if (mounted) {
                await _loadPrescriptions();
              }
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Prescription saved successfully'),
                    backgroundColor: AppColors.success,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              }
            }
          } catch (e) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Failed to save prescription: $e'), backgroundColor: AppColors.error),
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
        title: const Text('MY PRESCRIPTIONS', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 2)),
      ),
      body: ResponsiveContainer(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.gold))
            : _prescriptions.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.description_outlined, size: 64, color: AppColors.muted),
                        const SizedBox(height: 16),
                        const Text('No prescriptions saved', style: TextStyle(color: AppColors.muted, fontSize: 16)),
                        const SizedBox(height: 24),
                        GoldButton(
                          label: 'ADD PRESCRIPTION',
                          onPressed: _showAddForm,
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _prescriptions.length + 1,
                    itemBuilder: (context, index) {
                      if (index == _prescriptions.length) {
                        return Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: GoldButton(
                            label: 'ADD NEW PRESCRIPTION',
                            onPressed: _showAddForm,
                          ),
                        );
                      }
                      final prescription = _prescriptions[index];
                      final imageUrl = prescription['imageUrl'] ?? prescription['uploadedFile'];
                      final createdAt = prescription['createdAt'] != null
                          ? DateFormat('MMM dd, yyyy').format(DateTime.parse(prescription['createdAt']))
                          : '';

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
                                const Icon(Icons.description, color: AppColors.gold, size: 20),
                                const SizedBox(width: 8),
                                Text(
                                  'Prescription #${prescription['_id']?.substring(0, 8) ?? index + 1}',
                                  style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                ),
                                const Spacer(),
                                if (createdAt.isNotEmpty)
                                  Text(createdAt, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                              ],
                            ),
                            if (imageUrl != null && imageUrl.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: CachedNetworkImage(
                                  imageUrl: imageUrl,
                                  height: 200,
                                  width: double.infinity,
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) => Container(
                                    height: 200,
                                    color: AppColors.background,
                                    child: const Center(child: CircularProgressIndicator(color: AppColors.gold)),
                                  ),
                                  errorWidget: (context, url, error) => Container(
                                    height: 200,
                                    color: AppColors.background,
                                    child: const Center(child: Icon(Icons.broken_image, color: AppColors.muted, size: 48)),
                                  ),
                                ),
                              ),
                            ],
                            if (prescription['RE'] != null || prescription['LE'] != null || prescription['pd'] != null) ...[
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppColors.background,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  children: [
                                    if (prescription['RE'] != null)
                                      Expanded(
                                        child: _buildEyeData('RIGHT EYE', prescription['RE']),
                                      ),
                                    if (prescription['RE'] != null && prescription['LE'] != null)
                                      const SizedBox(width: 12),
                                    if (prescription['LE'] != null)
                                      Expanded(
                                        child: _buildEyeData('LEFT EYE', prescription['LE']),
                                      ),
                                  ],
                                ),
                              ),
                              if (prescription['pd'] != null) ...[
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    const Text('PD: ', style: TextStyle(color: AppColors.muted, fontSize: 13)),
                                    Text('${prescription['pd']} mm', style: const TextStyle(color: AppColors.white, fontSize: 13, fontWeight: FontWeight.w500)),
                                  ],
                                ),
                              ],
                            ],
                          ],
                        ),
                      );
                    },
                  ),
      ),
    );
  }

  Widget _buildEyeData(String label, dynamic data) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: AppColors.gold, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
        const SizedBox(height: 4),
        Text(
          'SPH: ${data['sph'] ?? '-'} • CYL: ${data['cyl'] ?? '-'} • AXIS: ${data['axis'] ?? '-'}',
          style: const TextStyle(color: AppColors.white, fontSize: 12),
        ),
      ],
    );
  }
}

class _AddPrescriptionForm extends StatefulWidget {
  final Function(Map<String, dynamic>) onSubmit;

  const _AddPrescriptionForm({required this.onSubmit});

  @override
  State<_AddPrescriptionForm> createState() => _AddPrescriptionFormState();
}

class _AddPrescriptionFormState extends State<_AddPrescriptionForm> {
  final _formKey = GlobalKey<FormState>();
  final ImagePicker _picker = ImagePicker();
  Uint8List? _selectedFile;
  String? _fileName;
  String? _mimeType;

  final _reSphCtrl = TextEditingController();
  final _reCylCtrl = TextEditingController();
  final _reAxisCtrl = TextEditingController();
  final _leSphCtrl = TextEditingController();
  final _leCylCtrl = TextEditingController();
  final _leAxisCtrl = TextEditingController();
  final _pdCtrl = TextEditingController();
  bool _loading = false;

  Future<void> _pickFile() async {
    final XFile? file = await _picker.pickImage(source: ImageSource.gallery);
    if (file != null) {
      final bytes = await file.readAsBytes();
      setState(() {
        _selectedFile = bytes;
        _fileName = file.name;
        _mimeType = file.mimeType;
      });
    }
  }

  void _submit() async {
    if (_selectedFile == null &&
        _reSphCtrl.text.isEmpty &&
        _reCylCtrl.text.isEmpty &&
        _reAxisCtrl.text.isEmpty &&
        _leSphCtrl.text.isEmpty &&
        _leCylCtrl.text.isEmpty &&
        _leAxisCtrl.text.isEmpty &&
        _pdCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please upload an image or enter prescription details'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _loading = true);
    try {
      Map<String, dynamic>? re;
      Map<String, dynamic>? le;
      double? pd;

      if (_reSphCtrl.text.isNotEmpty || _reCylCtrl.text.isNotEmpty || _reAxisCtrl.text.isNotEmpty) {
        re = {
          'sph': _reSphCtrl.text.isNotEmpty ? double.tryParse(_reSphCtrl.text) : null,
          'cyl': _reCylCtrl.text.isNotEmpty ? double.tryParse(_reCylCtrl.text) : null,
          'axis': _reAxisCtrl.text.isNotEmpty ? int.tryParse(_reAxisCtrl.text) : null,
        };
      }

      if (_leSphCtrl.text.isNotEmpty || _leCylCtrl.text.isNotEmpty || _leAxisCtrl.text.isNotEmpty) {
        le = {
          'sph': _leSphCtrl.text.isNotEmpty ? double.tryParse(_leSphCtrl.text) : null,
          'cyl': _leCylCtrl.text.isNotEmpty ? double.tryParse(_leCylCtrl.text) : null,
          'axis': _leAxisCtrl.text.isNotEmpty ? int.tryParse(_leAxisCtrl.text) : null,
        };
      }

      if (_pdCtrl.text.isNotEmpty) {
        pd = double.tryParse(_pdCtrl.text);
      }

      await widget.onSubmit({
        're': re,
        'le': le,
        'pd': pd,
        'fileBytes': _selectedFile,
        'fileName': _fileName,
        'mimeType': _mimeType,
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _reSphCtrl.dispose();
    _reCylCtrl.dispose();
    _reAxisCtrl.dispose();
    _leSphCtrl.dispose();
    _leCylCtrl.dispose();
    _leAxisCtrl.dispose();
    _pdCtrl.dispose();
    super.dispose();
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
                    'Add Prescription',
                    style: TextStyle(color: AppColors.white, fontSize: 18, fontWeight: FontWeight.w900),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: AppColors.muted, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              GestureDetector(
                onTap: _pickFile,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: _selectedFile != null ? AppColors.gold : AppColors.border, style: BorderStyle.solid),
                  ),
                  child: _selectedFile != null
                      ? Column(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.memory(_selectedFile!, height: 150, fit: BoxFit.cover),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.check_circle, color: AppColors.gold, size: 20),
                                const SizedBox(width: 8),
                                Text(_fileName ?? 'Selected', style: const TextStyle(color: AppColors.white, fontSize: 13)),
                              ],
                            ),
                          ],
                        )
                      : const Column(
                          children: [
                            Icon(Icons.upload_file_outlined, size: 48, color: AppColors.gold),
                            SizedBox(height: 12),
                            Text('Upload Prescription Image', style: TextStyle(color: AppColors.white, fontSize: 14, fontWeight: FontWeight.w500)),
                            SizedBox(height: 4),
                            Text('Tap to select from gallery', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 20),
              const Center(child: Text('OR', style: TextStyle(color: AppColors.muted, fontSize: 14, fontWeight: FontWeight.bold))),
              const SizedBox(height: 20),
              const Text('ENTER PRESCRIPTION DETAILS', style: TextStyle(color: AppColors.gold, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1)),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _buildEyeSection('RIGHT EYE', _reSphCtrl, _reCylCtrl, _reAxisCtrl),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildEyeSection('LEFT EYE', _leSphCtrl, _leCylCtrl, _leAxisCtrl),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _pdCtrl,
                style: const TextStyle(color: AppColors.white, fontSize: 14),
                decoration: const InputDecoration(
                  labelText: 'Pupillary Distance (PD) in mm',
                  prefixIcon: Icon(Icons.remove_red_eye_outlined, color: AppColors.gold, size: 18),
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
              ),
              const SizedBox(height: 24),
              GoldButton(
                label: 'SAVE PRESCRIPTION',
                onPressed: _loading ? null : _submit,
                loading: _loading,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEyeSection(String label, TextEditingController sphCtrl, TextEditingController cylCtrl, TextEditingController axisCtrl) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: AppColors.gold, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
          const SizedBox(height: 12),
          TextFormField(
            controller: sphCtrl,
            style: const TextStyle(color: AppColors.white, fontSize: 13),
            decoration: const InputDecoration(
              labelText: 'SPH',
              isDense: true,
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
            keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: cylCtrl,
            style: const TextStyle(color: AppColors.white, fontSize: 13),
            decoration: const InputDecoration(
              labelText: 'CYL',
              isDense: true,
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
            keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: axisCtrl,
            style: const TextStyle(color: AppColors.white, fontSize: 13),
            decoration: const InputDecoration(
              labelText: 'AXIS',
              isDense: true,
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
            keyboardType: TextInputType.number,
          ),
        ],
      ),
    );
  }
}
