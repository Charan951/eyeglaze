class UserAddress {
  final String id;
  final String? fullName;
  final String? mobile;
  final String? pincode;
  final String? line1;
  final String? line2;
  final String? city;
  final String? state;
  final String? type;
  final bool isDefault;

  UserAddress({
    required this.id,
    this.fullName,
    this.mobile,
    this.pincode,
    this.line1,
    this.line2,
    this.city,
    this.state,
    this.type = 'Home',
    this.isDefault = false,
  });

  factory UserAddress.fromJson(Map<String, dynamic> json) {
    return UserAddress(
      id: json['_id'] ?? json['id'] ?? '',
      fullName: json['fullName'],
      mobile: json['mobile'],
      pincode: json['pincode'],
      line1: json['line1'],
      line2: json['line2'],
      city: json['city'],
      state: json['state'],
      type: json['type'] ?? 'Home',
      isDefault: json['isDefault'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'fullName': fullName,
        'mobile': mobile,
        'pincode': pincode,
        'line1': line1,
        'line2': line2,
        'city': city,
        'state': state,
        'type': type,
        'isDefault': isDefault,
      };
}

class User {
  final String id;
  final String? name;
  final String? phone;
  final String? email;
  final String role;
  final double walletBalance;
  final bool membershipActive;
  final List<dynamic>? transactions;
  final List<UserAddress> addresses;

  User({
    required this.id,
    this.name,
    this.phone,
    this.email,
    this.role = 'user',
    this.walletBalance = 0.0,
    this.membershipActive = false,
    this.transactions,
    this.addresses = const [],
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'],
      phone: json['phone'],
      email: json['email'],
      role: json['role'] ?? 'user',
      walletBalance: (json['walletBalance'] as num?)?.toDouble() ?? 0.0,
      membershipActive: json['membershipActive'] as bool? ?? false,
      transactions: json['transactions'] as List?,
      addresses: (json['addresses'] as List?)
              ?.map((a) => UserAddress.fromJson(a as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'name': name,
        'phone': phone,
        'email': email,
        'role': role,
        'walletBalance': walletBalance,
        'membershipActive': membershipActive,
        'transactions': transactions,
        'addresses': addresses.map((a) => a.toJson()).toList(),
      };
}
