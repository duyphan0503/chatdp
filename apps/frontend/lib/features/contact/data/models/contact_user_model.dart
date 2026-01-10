import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/contact_user.dart';

part 'contact_user_model.g.dart';

@JsonSerializable()
class ContactUserModel extends ContactUser {
  const ContactUserModel({
    required super.id,
    super.email,
    required super.displayName,
    super.avatarUrl,
  });

  factory ContactUserModel.fromJson(Map<String, dynamic> json) =>
      _$ContactUserModelFromJson(json);

  Map<String, dynamic> toJson() => _$ContactUserModelToJson(this);
}
