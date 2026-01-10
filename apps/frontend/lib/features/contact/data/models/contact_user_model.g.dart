// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'contact_user_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ContactUserModel _$ContactUserModelFromJson(Map<String, dynamic> json) =>
    ContactUserModel(
      id: json['id'] as String,
      email: json['email'] as String?,
      displayName: json['displayName'] as String,
      avatarUrl: json['avatarUrl'] as String?,
    );

Map<String, dynamic> _$ContactUserModelToJson(ContactUserModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'email': instance.email,
      'displayName': instance.displayName,
      'avatarUrl': instance.avatarUrl,
    };
