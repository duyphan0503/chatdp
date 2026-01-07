// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'conversation.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$Conversation {

 String get id; ConversationType get type; String? get groupName; String? get groupAvatarUrl; String? get lastMessageContent; DateTime? get lastMessageAt; int get unreadCount; DateTime get createdAt; DateTime get updatedAt;/// Participants in this conversation
 List<ConversationParticipant> get participants;
/// Create a copy of Conversation
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ConversationCopyWith<Conversation> get copyWith => _$ConversationCopyWithImpl<Conversation>(this as Conversation, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Conversation&&(identical(other.id, id) || other.id == id)&&(identical(other.type, type) || other.type == type)&&(identical(other.groupName, groupName) || other.groupName == groupName)&&(identical(other.groupAvatarUrl, groupAvatarUrl) || other.groupAvatarUrl == groupAvatarUrl)&&(identical(other.lastMessageContent, lastMessageContent) || other.lastMessageContent == lastMessageContent)&&(identical(other.lastMessageAt, lastMessageAt) || other.lastMessageAt == lastMessageAt)&&(identical(other.unreadCount, unreadCount) || other.unreadCount == unreadCount)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&const DeepCollectionEquality().equals(other.participants, participants));
}


@override
int get hashCode => Object.hash(runtimeType,id,type,groupName,groupAvatarUrl,lastMessageContent,lastMessageAt,unreadCount,createdAt,updatedAt,const DeepCollectionEquality().hash(participants));

@override
String toString() {
  return 'Conversation(id: $id, type: $type, groupName: $groupName, groupAvatarUrl: $groupAvatarUrl, lastMessageContent: $lastMessageContent, lastMessageAt: $lastMessageAt, unreadCount: $unreadCount, createdAt: $createdAt, updatedAt: $updatedAt, participants: $participants)';
}


}

/// @nodoc
abstract mixin class $ConversationCopyWith<$Res>  {
  factory $ConversationCopyWith(Conversation value, $Res Function(Conversation) _then) = _$ConversationCopyWithImpl;
@useResult
$Res call({
 String id, ConversationType type, String? groupName, String? groupAvatarUrl, String? lastMessageContent, DateTime? lastMessageAt, int unreadCount, DateTime createdAt, DateTime updatedAt, List<ConversationParticipant> participants
});




}
/// @nodoc
class _$ConversationCopyWithImpl<$Res>
    implements $ConversationCopyWith<$Res> {
  _$ConversationCopyWithImpl(this._self, this._then);

  final Conversation _self;
  final $Res Function(Conversation) _then;

/// Create a copy of Conversation
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? type = null,Object? groupName = freezed,Object? groupAvatarUrl = freezed,Object? lastMessageContent = freezed,Object? lastMessageAt = freezed,Object? unreadCount = null,Object? createdAt = null,Object? updatedAt = null,Object? participants = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as ConversationType,groupName: freezed == groupName ? _self.groupName : groupName // ignore: cast_nullable_to_non_nullable
as String?,groupAvatarUrl: freezed == groupAvatarUrl ? _self.groupAvatarUrl : groupAvatarUrl // ignore: cast_nullable_to_non_nullable
as String?,lastMessageContent: freezed == lastMessageContent ? _self.lastMessageContent : lastMessageContent // ignore: cast_nullable_to_non_nullable
as String?,lastMessageAt: freezed == lastMessageAt ? _self.lastMessageAt : lastMessageAt // ignore: cast_nullable_to_non_nullable
as DateTime?,unreadCount: null == unreadCount ? _self.unreadCount : unreadCount // ignore: cast_nullable_to_non_nullable
as int,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,participants: null == participants ? _self.participants : participants // ignore: cast_nullable_to_non_nullable
as List<ConversationParticipant>,
  ));
}

}


/// Adds pattern-matching-related methods to [Conversation].
extension ConversationPatterns on Conversation {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Conversation value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Conversation() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Conversation value)  $default,){
final _that = this;
switch (_that) {
case _Conversation():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Conversation value)?  $default,){
final _that = this;
switch (_that) {
case _Conversation() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  ConversationType type,  String? groupName,  String? groupAvatarUrl,  String? lastMessageContent,  DateTime? lastMessageAt,  int unreadCount,  DateTime createdAt,  DateTime updatedAt,  List<ConversationParticipant> participants)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Conversation() when $default != null:
return $default(_that.id,_that.type,_that.groupName,_that.groupAvatarUrl,_that.lastMessageContent,_that.lastMessageAt,_that.unreadCount,_that.createdAt,_that.updatedAt,_that.participants);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  ConversationType type,  String? groupName,  String? groupAvatarUrl,  String? lastMessageContent,  DateTime? lastMessageAt,  int unreadCount,  DateTime createdAt,  DateTime updatedAt,  List<ConversationParticipant> participants)  $default,) {final _that = this;
switch (_that) {
case _Conversation():
return $default(_that.id,_that.type,_that.groupName,_that.groupAvatarUrl,_that.lastMessageContent,_that.lastMessageAt,_that.unreadCount,_that.createdAt,_that.updatedAt,_that.participants);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  ConversationType type,  String? groupName,  String? groupAvatarUrl,  String? lastMessageContent,  DateTime? lastMessageAt,  int unreadCount,  DateTime createdAt,  DateTime updatedAt,  List<ConversationParticipant> participants)?  $default,) {final _that = this;
switch (_that) {
case _Conversation() when $default != null:
return $default(_that.id,_that.type,_that.groupName,_that.groupAvatarUrl,_that.lastMessageContent,_that.lastMessageAt,_that.unreadCount,_that.createdAt,_that.updatedAt,_that.participants);case _:
  return null;

}
}

}

/// @nodoc


class _Conversation implements Conversation {
  const _Conversation({required this.id, required this.type, this.groupName, this.groupAvatarUrl, this.lastMessageContent, this.lastMessageAt, required this.unreadCount, required this.createdAt, required this.updatedAt, required final  List<ConversationParticipant> participants}): _participants = participants;
  

@override final  String id;
@override final  ConversationType type;
@override final  String? groupName;
@override final  String? groupAvatarUrl;
@override final  String? lastMessageContent;
@override final  DateTime? lastMessageAt;
@override final  int unreadCount;
@override final  DateTime createdAt;
@override final  DateTime updatedAt;
/// Participants in this conversation
 final  List<ConversationParticipant> _participants;
/// Participants in this conversation
@override List<ConversationParticipant> get participants {
  if (_participants is EqualUnmodifiableListView) return _participants;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_participants);
}


/// Create a copy of Conversation
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ConversationCopyWith<_Conversation> get copyWith => __$ConversationCopyWithImpl<_Conversation>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Conversation&&(identical(other.id, id) || other.id == id)&&(identical(other.type, type) || other.type == type)&&(identical(other.groupName, groupName) || other.groupName == groupName)&&(identical(other.groupAvatarUrl, groupAvatarUrl) || other.groupAvatarUrl == groupAvatarUrl)&&(identical(other.lastMessageContent, lastMessageContent) || other.lastMessageContent == lastMessageContent)&&(identical(other.lastMessageAt, lastMessageAt) || other.lastMessageAt == lastMessageAt)&&(identical(other.unreadCount, unreadCount) || other.unreadCount == unreadCount)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&const DeepCollectionEquality().equals(other._participants, _participants));
}


@override
int get hashCode => Object.hash(runtimeType,id,type,groupName,groupAvatarUrl,lastMessageContent,lastMessageAt,unreadCount,createdAt,updatedAt,const DeepCollectionEquality().hash(_participants));

@override
String toString() {
  return 'Conversation(id: $id, type: $type, groupName: $groupName, groupAvatarUrl: $groupAvatarUrl, lastMessageContent: $lastMessageContent, lastMessageAt: $lastMessageAt, unreadCount: $unreadCount, createdAt: $createdAt, updatedAt: $updatedAt, participants: $participants)';
}


}

/// @nodoc
abstract mixin class _$ConversationCopyWith<$Res> implements $ConversationCopyWith<$Res> {
  factory _$ConversationCopyWith(_Conversation value, $Res Function(_Conversation) _then) = __$ConversationCopyWithImpl;
@override @useResult
$Res call({
 String id, ConversationType type, String? groupName, String? groupAvatarUrl, String? lastMessageContent, DateTime? lastMessageAt, int unreadCount, DateTime createdAt, DateTime updatedAt, List<ConversationParticipant> participants
});




}
/// @nodoc
class __$ConversationCopyWithImpl<$Res>
    implements _$ConversationCopyWith<$Res> {
  __$ConversationCopyWithImpl(this._self, this._then);

  final _Conversation _self;
  final $Res Function(_Conversation) _then;

/// Create a copy of Conversation
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? type = null,Object? groupName = freezed,Object? groupAvatarUrl = freezed,Object? lastMessageContent = freezed,Object? lastMessageAt = freezed,Object? unreadCount = null,Object? createdAt = null,Object? updatedAt = null,Object? participants = null,}) {
  return _then(_Conversation(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as ConversationType,groupName: freezed == groupName ? _self.groupName : groupName // ignore: cast_nullable_to_non_nullable
as String?,groupAvatarUrl: freezed == groupAvatarUrl ? _self.groupAvatarUrl : groupAvatarUrl // ignore: cast_nullable_to_non_nullable
as String?,lastMessageContent: freezed == lastMessageContent ? _self.lastMessageContent : lastMessageContent // ignore: cast_nullable_to_non_nullable
as String?,lastMessageAt: freezed == lastMessageAt ? _self.lastMessageAt : lastMessageAt // ignore: cast_nullable_to_non_nullable
as DateTime?,unreadCount: null == unreadCount ? _self.unreadCount : unreadCount // ignore: cast_nullable_to_non_nullable
as int,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,participants: null == participants ? _self._participants : participants // ignore: cast_nullable_to_non_nullable
as List<ConversationParticipant>,
  ));
}


}

/// @nodoc
mixin _$ConversationParticipant {

 String get userId; String get displayName; String? get avatarUrl; ParticipantRole? get role;
/// Create a copy of ConversationParticipant
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ConversationParticipantCopyWith<ConversationParticipant> get copyWith => _$ConversationParticipantCopyWithImpl<ConversationParticipant>(this as ConversationParticipant, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ConversationParticipant&&(identical(other.userId, userId) || other.userId == userId)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.avatarUrl, avatarUrl) || other.avatarUrl == avatarUrl)&&(identical(other.role, role) || other.role == role));
}


@override
int get hashCode => Object.hash(runtimeType,userId,displayName,avatarUrl,role);

@override
String toString() {
  return 'ConversationParticipant(userId: $userId, displayName: $displayName, avatarUrl: $avatarUrl, role: $role)';
}


}

/// @nodoc
abstract mixin class $ConversationParticipantCopyWith<$Res>  {
  factory $ConversationParticipantCopyWith(ConversationParticipant value, $Res Function(ConversationParticipant) _then) = _$ConversationParticipantCopyWithImpl;
@useResult
$Res call({
 String userId, String displayName, String? avatarUrl, ParticipantRole? role
});




}
/// @nodoc
class _$ConversationParticipantCopyWithImpl<$Res>
    implements $ConversationParticipantCopyWith<$Res> {
  _$ConversationParticipantCopyWithImpl(this._self, this._then);

  final ConversationParticipant _self;
  final $Res Function(ConversationParticipant) _then;

/// Create a copy of ConversationParticipant
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? userId = null,Object? displayName = null,Object? avatarUrl = freezed,Object? role = freezed,}) {
  return _then(_self.copyWith(
userId: null == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as String,displayName: null == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String,avatarUrl: freezed == avatarUrl ? _self.avatarUrl : avatarUrl // ignore: cast_nullable_to_non_nullable
as String?,role: freezed == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as ParticipantRole?,
  ));
}

}


/// Adds pattern-matching-related methods to [ConversationParticipant].
extension ConversationParticipantPatterns on ConversationParticipant {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ConversationParticipant value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ConversationParticipant() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ConversationParticipant value)  $default,){
final _that = this;
switch (_that) {
case _ConversationParticipant():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ConversationParticipant value)?  $default,){
final _that = this;
switch (_that) {
case _ConversationParticipant() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String userId,  String displayName,  String? avatarUrl,  ParticipantRole? role)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ConversationParticipant() when $default != null:
return $default(_that.userId,_that.displayName,_that.avatarUrl,_that.role);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String userId,  String displayName,  String? avatarUrl,  ParticipantRole? role)  $default,) {final _that = this;
switch (_that) {
case _ConversationParticipant():
return $default(_that.userId,_that.displayName,_that.avatarUrl,_that.role);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String userId,  String displayName,  String? avatarUrl,  ParticipantRole? role)?  $default,) {final _that = this;
switch (_that) {
case _ConversationParticipant() when $default != null:
return $default(_that.userId,_that.displayName,_that.avatarUrl,_that.role);case _:
  return null;

}
}

}

/// @nodoc


class _ConversationParticipant implements ConversationParticipant {
  const _ConversationParticipant({required this.userId, required this.displayName, this.avatarUrl, this.role});
  

@override final  String userId;
@override final  String displayName;
@override final  String? avatarUrl;
@override final  ParticipantRole? role;

/// Create a copy of ConversationParticipant
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ConversationParticipantCopyWith<_ConversationParticipant> get copyWith => __$ConversationParticipantCopyWithImpl<_ConversationParticipant>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ConversationParticipant&&(identical(other.userId, userId) || other.userId == userId)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.avatarUrl, avatarUrl) || other.avatarUrl == avatarUrl)&&(identical(other.role, role) || other.role == role));
}


@override
int get hashCode => Object.hash(runtimeType,userId,displayName,avatarUrl,role);

@override
String toString() {
  return 'ConversationParticipant(userId: $userId, displayName: $displayName, avatarUrl: $avatarUrl, role: $role)';
}


}

/// @nodoc
abstract mixin class _$ConversationParticipantCopyWith<$Res> implements $ConversationParticipantCopyWith<$Res> {
  factory _$ConversationParticipantCopyWith(_ConversationParticipant value, $Res Function(_ConversationParticipant) _then) = __$ConversationParticipantCopyWithImpl;
@override @useResult
$Res call({
 String userId, String displayName, String? avatarUrl, ParticipantRole? role
});




}
/// @nodoc
class __$ConversationParticipantCopyWithImpl<$Res>
    implements _$ConversationParticipantCopyWith<$Res> {
  __$ConversationParticipantCopyWithImpl(this._self, this._then);

  final _ConversationParticipant _self;
  final $Res Function(_ConversationParticipant) _then;

/// Create a copy of ConversationParticipant
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? userId = null,Object? displayName = null,Object? avatarUrl = freezed,Object? role = freezed,}) {
  return _then(_ConversationParticipant(
userId: null == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as String,displayName: null == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String,avatarUrl: freezed == avatarUrl ? _self.avatarUrl : avatarUrl // ignore: cast_nullable_to_non_nullable
as String?,role: freezed == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as ParticipantRole?,
  ));
}


}

// dart format on
