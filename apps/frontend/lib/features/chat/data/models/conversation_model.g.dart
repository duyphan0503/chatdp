// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'conversation_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ConversationModel _$ConversationModelFromJson(Map<String, dynamic> json) =>
    _ConversationModel(
      id: json['id'] as String,
      type: json['type'] as String,
      groupName: json['groupName'] as String?,
      groupAvatarUrl: json['groupAvatarUrl'] as String?,
      lastMessageContent: json['lastMessageContent'] as String?,
      lastMessageAt: json['lastMessageAt'] == null
          ? null
          : DateTime.parse(json['lastMessageAt'] as String),
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      participants:
          (json['participants'] as List<dynamic>?)
              ?.map((e) => ParticipantModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$ConversationModelToJson(_ConversationModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': instance.type,
      'groupName': instance.groupName,
      'groupAvatarUrl': instance.groupAvatarUrl,
      'lastMessageContent': instance.lastMessageContent,
      'lastMessageAt': instance.lastMessageAt?.toIso8601String(),
      'unreadCount': instance.unreadCount,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'participants': instance.participants,
    };

_ParticipantModel _$ParticipantModelFromJson(Map<String, dynamic> json) =>
    _ParticipantModel(
      userId: json['userId'] as String,
      displayName: json['displayName'] as String,
      avatarUrl: json['avatarUrl'] as String?,
      role: json['role'] as String?,
    );

Map<String, dynamic> _$ParticipantModelToJson(_ParticipantModel instance) =>
    <String, dynamic>{
      'userId': instance.userId,
      'displayName': instance.displayName,
      'avatarUrl': instance.avatarUrl,
      'role': instance.role,
    };
