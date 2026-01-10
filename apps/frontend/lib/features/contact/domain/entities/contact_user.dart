import 'package:equatable/equatable.dart';

class ContactUser extends Equatable {
  final String id;
  final String? email;
  final String displayName;
  final String? avatarUrl;

  const ContactUser({
    required this.id,
    this.email,
    required this.displayName,
    this.avatarUrl,
  });

  @override
  List<Object?> get props => [id, email, displayName, avatarUrl];
}
