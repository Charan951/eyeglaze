import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/theme.dart';
import '../../widgets/lens_step_bar.dart';
import '../../widgets/lens_wizard_state.dart';
import '../../widgets/gold_button.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../cart/cart_screen.dart';

class LensPowerScreen extends StatefulWidget {
  const LensPowerScreen({super.key});

  @override
  State<LensPowerScreen> createState() => _LensPowerScreenState();
}

class _LensPowerScreenState extends State<LensPowerScreen> {
  final ImagePicker _picker = ImagePicker();
  bool _uploadingFile = false;
  bool _submitting = false;

  // Local state for prescription parameters matching the React app
  double _rSph = -1.25;
  double _rCyl = -0.50;
  int _rAxis = 180;

  double _lSph = -1.75;
  double _lCyl = -0.75;
  int _lAxis = 170;

  double _pd = 62.0;
  double _addPower = 1.00;

  final List<String> _sphValues = List.generate(81, (i) {
    final val = -10.0 + i * 0.25;
    return val > 0 ? '+${val.toStringAsFixed(2)}' : val.toStringAsFixed(2);
  });

  final List<String> _cylValues = List.generate(49, (i) {
    final val = -6.0 + i * 0.25;
    return val > 0 ? '+${val.toStringAsFixed(2)}' : val.toStringAsFixed(2);
  });

  final List<String> _axisValues = List.generate(181, (i) => i.toString());

  final List<String> _addPowerValues = [
    '+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75', '+3.00'
  ];

  @override
  void initState() {
    super.initState();
    _loadSavedPrescriptions();
  }

  Future<void> _loadSavedPrescriptions() async {
    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      final res = await api.getPrescriptions();
      final list = res['prescriptions'] as List<dynamic>? ?? [];
      if (mounted) {
        context.read<LensWizardState>().setSavedPrescriptions(list);
      }
    } catch (e) {
      debugPrint('Failed to load saved prescriptions: $e');
    }
  }

  String _formatOptionLabel(Map<String, dynamic> pr) {
    final name = pr['name']?.toString() ?? '';
    final dateStr = pr['createdAt'] != null
        ? DateTime.parse(pr['createdAt'].toString()).toLocal().toString().split(' ')[0]
        : '';
    
    if (pr['uploadedFile'] != null || pr['imageUrl'] != null) {
      return name.isNotEmpty
          ? '📄 $name ($dateStr)'
          : '📄 Prescription ($dateStr)';
    }

    final re = pr['RE'] is Map ? pr['RE'] : null;
    final le = pr['LE'] is Map ? pr['LE'] : null;
    final reSph = re != null ? (re['sph'] as num?)?.toDouble() ?? 0.0 : 0.0;
    final leSph = le != null ? (le['sph'] as num?)?.toDouble() ?? 0.0 : 0.0;
    
    final reStr = 'R: ${reSph > 0 ? '+$reSph' : reSph}';
    final leStr = 'L: ${leSph > 0 ? '+$leSph' : leSph}';

    return name.isNotEmpty
        ? '👓 $name - $reStr | $leStr'
        : '👓 Power - $reStr | $leStr';
  }

  Future<void> _selectSavedPrescription(String id, LensWizardState wizard) async {
    wizard.setSelectedPrescriptionId(id);
    if (id.isEmpty) {
      return;
    }

    final pr = wizard.savedPrescriptions.firstWhere((p) => p['_id'] == id, orElse: () => null);
    if (pr != null) {
      wizard.setPrescriptionName(pr['name']?.toString());
      if (pr['uploadedFile'] != null || pr['imageUrl'] != null) {
        wizard.setPrescriptionMode('upload');
        wizard.setUploadedFile(pr['uploadedFile'] ?? pr['imageUrl'], 'Saved Document');
      } else {
        wizard.setPrescriptionMode('enter');
        final re = pr['RE'] is Map ? pr['RE'] : null;
        final le = pr['LE'] is Map ? pr['LE'] : null;
        final pdVal = (pr['pd'] as num?)?.toDouble() ?? 62.0;

        setState(() {
          _rSph = (re?['sph'] as num?)?.toDouble() ?? -1.25;
          _rCyl = (re?['cyl'] as num?)?.toDouble() ?? -0.50;
          _rAxis = (re?['axis'] as num?)?.toInt() ?? 180;

          _lSph = (le?['sph'] as num?)?.toDouble() ?? -1.75;
          _lCyl = (le?['cyl'] as num?)?.toDouble() ?? -0.75;
          _lAxis = (le?['axis'] as num?)?.toInt() ?? 170;

          _pd = pdVal;
        });
      }
    }
  }

  Future<void> _pickPrescriptionImage(LensWizardState wizard) async {
    final messenger = ScaffoldMessenger.of(context);
    final auth = context.read<AuthService>();
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
      if (image == null) return;

      setState(() => _uploadingFile = true);

      final api = ApiService(auth);
      final bytes = await image.readAsBytes();

      final res = await api.addPrescription(
        fileBytes: bytes,
        fileName: image.name,
        mimeType: 'image/jpeg',
      );

      final prescriptionData = res['prescription'] as Map?;
      final String? fileUrl = prescriptionData?['uploadedFile'] ?? prescriptionData?['imageUrl'];

      if (fileUrl != null) {
        wizard.setUploadedFile(fileUrl, image.name);
        messenger.showSnackBar(
          const SnackBar(content: Text('Prescription uploaded successfully!'), backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(content: Text('Upload failed: $e'), backgroundColor: AppColors.error),
      );
    } finally {
      if (mounted) setState(() => _uploadingFile = false);
    }
  }

  Future<void> _handleCheckout(LensWizardState wizard) async {
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    if (wizard.prescriptionMode == 'upload' && wizard.uploadedFileUrl == null) {
      messenger.showSnackBar(
        const SnackBar(content: Text('Please upload a prescription image first.'), backgroundColor: AppColors.error),
      );
      return;
    }

    if (wizard.prescriptionMode == 'enter') {
      final hasAstigmatismRE = _rCyl != 0.0;
      final hasAstigmatismLE = _lCyl != 0.0;
      if ((hasAstigmatismRE && _rAxis == 0) || (hasAstigmatismLE && _lAxis == 0)) {
        messenger.showSnackBar(
          const SnackBar(content: Text('Please select AXIS for astigmatism (when CYL is not 0)'), backgroundColor: AppColors.error),
        );
        return;
      }
    }

    setState(() => _submitting = true);
    try {
      final authService = context.read<AuthService>();
      final api = ApiService(authService);
      final p = wizard.product;
      if (p == null) return;

      // Save manually entered prescription to server if custom name entered
      if (wizard.prescriptionMode == 'enter' && wizard.selectedPrescriptionId == null) {
        try {
          await api.addPrescription(
            re: {'sph': _rSph, 'cyl': _rCyl, 'axis': _rAxis},
            le: {'sph': _lSph, 'cyl': _lCyl, 'axis': _lAxis},
            pd: _pd,
          );
        } catch (e) {
          debugPrint('Failed to save manual prescription: $e');
        }
      }

      // Dynamic cart payload mapping
      final lensConfig = {
        'lensType': wizard.selectedTypeDisplayName ?? wizard.lensType,
        'lensSubType': wizard.lensSubType,
        'lensQuality': wizard.lensQuality,
        'lensPrice': wizard.lensPrice,
        'power': wizard.prescriptionMode == 'enter'
            ? {
                'RE': {'sph': _rSph, 'cyl': _rCyl, 'axis': _rAxis},
                'LE': {'sph': _lSph, 'cyl': _lCyl, 'axis': _lAxis},
                'pd': _pd,
                'addPower': (wizard.lensType == 'progressive' || wizard.lensType == 'reading_power')
                    ? _addPower
                    : null,
              }
            : {
                'uploadLater': true,
                'uploadedFileUrl': wizard.uploadedFileUrl,
              },
      };

      await api.addToCart({
        'productId': p.id,
        'qty': 1,
        'color': wizard.selectedColor,
        'lens': lensConfig,
      });

      messenger.showSnackBar(
        const SnackBar(content: Text('Configuration added to cart!'), backgroundColor: AppColors.success),
      );
      
      navigator.pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const CartScreen()),
        (route) => route.isFirst,
      );
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(content: Text('Checkout failed: $e'), backgroundColor: AppColors.error),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _showPdInstructionDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Pupillary Distance (PD)', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold)),
        content: const Text(
          '1. Hold a ruler horizontally against your forehead.\n'
          '2. Align the 0mm mark directly under the pupil of one eye.\n'
          '3. Look straight ahead and read the millimeter mark under the pupil of your other eye.\n'
          '4. Average values are 58mm - 68mm.',
          style: TextStyle(color: AppColors.muted, fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('GOT IT', style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final wizard = context.watch<LensWizardState>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: const Text('Enter Your Power', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold)),
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: AppColors.white), onPressed: () => Navigator.pop(context)),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const LensStepBar(currentStep: 3),
            
            // Header text
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('ENTER YOUR POWER', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: 1)),
                  SizedBox(height: 4),
                  Text('All fields are required', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                ],
              ),
            ),

            // Form container
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Saved prescriptions dropdown
                    if (wizard.savedPrescriptions.isNotEmpty) ...[
                      const Text(
                        '📂 ADD SAVED POWER',
                        style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 0.5),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: wizard.selectedPrescriptionId,
                            dropdownColor: AppColors.card,
                            isExpanded: true,
                            hint: const Text('Select from Saved Powers', style: TextStyle(color: AppColors.muted, fontSize: 13)),
                            style: const TextStyle(color: AppColors.white, fontSize: 13),
                            items: [
                              const DropdownMenuItem(
                                value: null,
                                child: Text('-- Clear Selection --'),
                              ),
                              ...wizard.savedPrescriptions.map((pr) {
                                final map = pr as Map<String, dynamic>;
                                return DropdownMenuItem<String>(
                                  value: map['_id'].toString(),
                                  child: Text(_formatOptionLabel(map)),
                                );
                              }),
                            ],
                            onChanged: (val) {
                              _selectSavedPrescription(val ?? '', wizard);
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Mode Selection Tabs
                    Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () => wizard.setPrescriptionMode('enter'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: wizard.prescriptionMode == 'enter' ? AppColors.gold : AppColors.background,
                                borderRadius: const BorderRadius.horizontal(left: Radius.circular(10)),
                                border: Border.all(color: AppColors.border),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                'ENTER MANUALLY',
                                style: TextStyle(
                                  color: wizard.prescriptionMode == 'enter' ? Colors.black : AppColors.muted,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () => wizard.setPrescriptionMode('upload'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: wizard.prescriptionMode == 'upload' ? AppColors.gold : AppColors.background,
                                borderRadius: const BorderRadius.horizontal(right: Radius.circular(10)),
                                border: Border.all(color: AppColors.border),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                'UPLOAD PRESCRIPTION',
                                style: TextStyle(
                                  color: wizard.prescriptionMode == 'upload' ? Colors.black : AppColors.muted,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Content based on Mode
                    if (wizard.prescriptionMode == 'enter') ...[
                      // Manual Form
                      // Header Row
                      Row(
                        children: const [
                          SizedBox(width: 32),
                          Expanded(child: Text('SPH', style: TextStyle(color: AppColors.muted, fontWeight: FontWeight.bold, fontSize: 10), textAlign: TextAlign.center)),
                          Expanded(child: Text('CYL', style: TextStyle(color: AppColors.muted, fontWeight: FontWeight.bold, fontSize: 10), textAlign: TextAlign.center)),
                          Expanded(child: Text('AXIS', style: TextStyle(color: AppColors.muted, fontWeight: FontWeight.bold, fontSize: 10), textAlign: TextAlign.center)),
                        ],
                      ),
                      const SizedBox(height: 8),

                      // Right Eye Row
                      Row(
                        children: [
                          const SizedBox(
                            width: 32,
                            child: Text('R', style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 14)),
                          ),
                          Expanded(
                            child: _DropdownCell(
                              value: _rSph > 0 ? '+${_rSph.toStringAsFixed(2)}' : _rSph.toStringAsFixed(2),
                              items: _sphValues,
                              onChanged: (v) => setState(() => _rSph = double.parse(v)),
                            ),
                          ),
                          Expanded(
                            child: _DropdownCell(
                              value: _rCyl > 0 ? '+${_rCyl.toStringAsFixed(2)}' : _rCyl.toStringAsFixed(2),
                              items: _cylValues,
                              onChanged: (v) => setState(() => _rCyl = double.parse(v)),
                            ),
                          ),
                          Expanded(
                            child: _DropdownCell(
                              value: _rAxis.toString(),
                              items: _axisValues,
                              onChanged: (v) => setState(() => _rAxis = int.parse(v)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Left Eye Row
                      Row(
                        children: [
                          const SizedBox(
                            width: 32,
                            child: Text('L', style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 14)),
                          ),
                          Expanded(
                            child: _DropdownCell(
                              value: _lSph > 0 ? '+${_lSph.toStringAsFixed(2)}' : _lSph.toStringAsFixed(2),
                              items: _sphValues,
                              onChanged: (v) => setState(() => _lSph = double.parse(v)),
                            ),
                          ),
                          Expanded(
                            child: _DropdownCell(
                              value: _lCyl > 0 ? '+${_lCyl.toStringAsFixed(2)}' : _lCyl.toStringAsFixed(2),
                              items: _cylValues,
                              onChanged: (v) => setState(() => _lCyl = double.parse(v)),
                            ),
                          ),
                          Expanded(
                            child: _DropdownCell(
                              value: _lAxis.toString(),
                              items: _axisValues,
                              onChanged: (v) => setState(() => _lAxis = int.parse(v)),
                            ),
                          ),
                        ],
                      ),

                      // Progressive Add Power
                      if (wizard.lensType == 'progressive' || wizard.lensType == 'reading_power') ...[
                        const SizedBox(height: 20),
                        const Divider(color: AppColors.border),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Add Power (Reading)',
                              style: TextStyle(color: AppColors.muted, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                            SizedBox(
                              width: 100,
                              child: _DropdownCell(
                                value: _addPower > 0 ? '+${_addPower.toStringAsFixed(2)}' : _addPower.toStringAsFixed(2),
                                items: _addPowerValues,
                                onChanged: (v) => setState(() => _addPower = double.parse(v.replaceAll('+', ''))),
                              ),
                            ),
                          ],
                        ),
                      ],

                      // Pupillary Distance Row
                      const SizedBox(height: 20),
                      const Divider(color: AppColors.border),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'PD (Pupillary Distance)',
                            style: TextStyle(color: AppColors.muted, fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.background,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: AppColors.border),
                                ),
                                child: Row(
                                  children: [
                                    SizedBox(
                                      width: 44,
                                      child: TextField(
                                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                        style: const TextStyle(color: AppColors.white, fontSize: 13, fontWeight: FontWeight.bold),
                                        textAlign: TextAlign.center,
                                        controller: TextEditingController(text: _pd.toStringAsFixed(1))..selection = TextSelection.fromPosition(TextPosition(offset: _pd.toStringAsFixed(1).length)),
                                        onChanged: (v) {
                                          final parsed = double.tryParse(v);
                                          if (parsed != null) setState(() => _pd = parsed);
                                        },
                                        decoration: const InputDecoration(
                                          isDense: true,
                                          contentPadding: EdgeInsets.zero,
                                          filled: false,
                                          border: InputBorder.none,
                                        ),
                                      ),
                                    ),
                                    const Text('mm', style: TextStyle(color: AppColors.muted, fontSize: 11)),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              GestureDetector(
                                onTap: _showPdInstructionDialog,
                                child: const Text(
                                  'Measure PD',
                                  style: TextStyle(color: AppColors.gold, fontSize: 11, decoration: TextDecoration.underline, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ] else ...[
                      // Upload Prescription Form
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          children: [
                            const Icon(Icons.cloud_upload_outlined, color: AppColors.gold, size: 36),
                            const SizedBox(height: 12),
                            const Text('Upload Prescription Photo', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                            const SizedBox(height: 4),
                            const Text('Drag & drop or click below to upload prescription.', style: TextStyle(color: AppColors.muted, fontSize: 10), textAlign: TextAlign.center),
                            const SizedBox(height: 16),
                            _uploadingFile
                                ? const CircularProgressIndicator(color: AppColors.gold)
                                : ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.gold,
                                      minimumSize: const Size(120, 36),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    ),
                                    onPressed: () => _pickPrescriptionImage(wizard),
                                    child: const Text('Browse File', style: TextStyle(color: Colors.black, fontSize: 11, fontWeight: FontWeight.bold)),
                                  ),
                            if (wizard.uploadedFileName != null) ...[
                              const SizedBox(height: 12),
                              Text(
                                '✓ Selected: ${wizard.uploadedFileName}',
                                style: const TextStyle(color: AppColors.success, fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 40),
            
            // Continue CTA Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _submitting
                  ? const Center(child: CircularProgressIndicator(color: AppColors.gold))
                  : GoldButton(
                      label: 'CONTINUE TO CART →',
                      onPressed: () => _handleCheckout(wizard),
                    ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

class _DropdownCell extends StatelessWidget {
  final String value;
  final List<String> items;
  final ValueChanged<String> onChanged;

  const _DropdownCell({required this.value, required this.items, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(8),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: items.contains(value) ? value : items.first,
          dropdownColor: AppColors.card,
          isExpanded: true,
          style: const TextStyle(color: AppColors.white, fontSize: 13, fontWeight: FontWeight.w600),
          items: items.map((v) {
            return DropdownMenuItem<String>(
              value: v,
              child: Text(v, textAlign: TextAlign.center),
            );
          }).toList(),
          onChanged: (val) {
            if (val != null) onChanged(val);
          },
        ),
      ),
    );
  }
}
