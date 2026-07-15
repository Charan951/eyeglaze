class Reel {
  final String id;
  final String title;
  final String videoUrl;
  final String? description;
  final int displayOrder;
  final bool isActive;
  final DateTime? createdAt;

  Reel({
    required this.id,
    required this.title,
    required this.videoUrl,
    this.description,
    this.displayOrder = 0,
    this.isActive = true,
    this.createdAt,
  });

  factory Reel.fromJson(Map<String, dynamic> json) {
    return Reel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: json['title'] ?? '',
      videoUrl: json['videoUrl'] ?? '',
      description: json['description'],
      displayOrder: json['displayOrder'] ?? 0,
      isActive: json['isActive'] ?? true,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
    );
  }
}
