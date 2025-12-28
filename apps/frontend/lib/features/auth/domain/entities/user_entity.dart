import 'package:equatable/equatable.dart';

class UserEntity extends Equatable {
  final String id;
  final String email;
  final String displayName;
  final String? avatarUrl;
  final bool isEmailVerified;

  const UserEntity({
    required this.id,
    required this.email,
    required this.displayName,
    this.avatarUrl,
    this.isEmailVerified = false,
  });

  @override
  List<Object?> get props => [
    id,
    email,
    displayName,
    avatarUrl,
    isEmailVerified,
  ];
}
