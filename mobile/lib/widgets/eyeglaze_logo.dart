import 'package:flutter/material.dart';

class EyeGlazeLogo extends StatelessWidget {
  final double size;
  const EyeGlazeLogo({super.key, this.size = 1.0});

  @override
  Widget build(BuildContext context) {
    return Hero(
      tag: 'eyeglaze_logo',
      child: Image.asset(
        'assets/images/logo.png',
        height: 48 * size,
        fit: BoxFit.contain,
      ),
    );
  }
}

