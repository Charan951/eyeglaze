import 'package:flutter/material.dart';
import '../core/theme.dart';

class LensStepBar extends StatelessWidget {
  final int currentStep;

  const LensStepBar({super.key, required this.currentStep});

  @override
  Widget build(BuildContext context) {
    final steps = ['LENS TYPE', 'POWER', 'ADD-ONS', 'REVIEW & CHECKOUT'];
    return Container(
      color: AppColors.card,
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      child: Row(
        children: List.generate(steps.length, (i) {
          final isActive = i == currentStep - 1;
          final isDone = i < currentStep - 1;
          return Expanded(
            child: Column(
              children: [
                Row(
                  children: [
                    if (i > 0) Expanded(child: Container(height: 1, color: isDone ? AppColors.gold : AppColors.border)),
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDone || isActive ? AppColors.gold : AppColors.border,
                      ),
                      child: Center(
                        child: isDone
                            ? const Icon(Icons.check, color: Colors.white, size: 14)
                            : Text(
                                '${i + 1}',
                                style: const TextStyle(
                                    color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                      ),
                    ),
                    if (i < steps.length - 1)
                      Expanded(child: Container(height: 1, color: isDone ? AppColors.gold : AppColors.border)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  steps[i],
                  style: TextStyle(
                    color: isActive ? AppColors.gold : (isDone ? AppColors.gold : AppColors.muted),
                    fontSize: 9,
                    fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }),
      ),
    );
  }
}
