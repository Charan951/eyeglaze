class UserSession {
  final String id;
  final String? userAgent;
  final String? ipAddress;
  final bool isValid;
  final DateTime? createdAt;
  final DateTime? expiresAt;

  UserSession({
    required this.id,
    this.userAgent,
    this.ipAddress,
    this.isValid = true,
    this.createdAt,
    this.expiresAt,
  });

  factory UserSession.fromJson(Map<String, dynamic> json) {
    return UserSession(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      userAgent: json['userAgent'],
      ipAddress: json['ipAddress'],
      isValid: json['isValid'] ?? true,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      expiresAt: json['expiresAt'] != null ? DateTime.parse(json['expiresAt']) : null,
    );
  }
}
