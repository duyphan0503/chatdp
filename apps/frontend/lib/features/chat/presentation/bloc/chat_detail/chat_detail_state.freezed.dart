// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'chat_detail_state.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ChatDetailState {

/// Current conversation ID
 String get conversationId;/// List of messages (newest at bottom)
 List<Message> get messages;/// Loading state for initial load
 bool get isLoading;/// Loading state for pagination
 bool get isLoadingMore;/// Whether there are more messages to load
 bool get hasMore;/// Cursor for pagination
 String? get cursor;/// Error message if any
 String? get errorMessage;/// Sending state
 bool get isSending;/// List of users currently typing (user IDs)
 List<String> get typingUserIds;/// Map of user ID to display name for typing users
 Map<String, String> get typingUsers;
/// Create a copy of ChatDetailState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ChatDetailStateCopyWith<ChatDetailState> get copyWith => _$ChatDetailStateCopyWithImpl<ChatDetailState>(this as ChatDetailState, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ChatDetailState&&(identical(other.conversationId, conversationId) || other.conversationId == conversationId)&&const DeepCollectionEquality().equals(other.messages, messages)&&(identical(other.isLoading, isLoading) || other.isLoading == isLoading)&&(identical(other.isLoadingMore, isLoadingMore) || other.isLoadingMore == isLoadingMore)&&(identical(other.hasMore, hasMore) || other.hasMore == hasMore)&&(identical(other.cursor, cursor) || other.cursor == cursor)&&(identical(other.errorMessage, errorMessage) || other.errorMessage == errorMessage)&&(identical(other.isSending, isSending) || other.isSending == isSending)&&const DeepCollectionEquality().equals(other.typingUserIds, typingUserIds)&&const DeepCollectionEquality().equals(other.typingUsers, typingUsers));
}


@override
int get hashCode => Object.hash(runtimeType,conversationId,const DeepCollectionEquality().hash(messages),isLoading,isLoadingMore,hasMore,cursor,errorMessage,isSending,const DeepCollectionEquality().hash(typingUserIds),const DeepCollectionEquality().hash(typingUsers));

@override
String toString() {
  return 'ChatDetailState(conversationId: $conversationId, messages: $messages, isLoading: $isLoading, isLoadingMore: $isLoadingMore, hasMore: $hasMore, cursor: $cursor, errorMessage: $errorMessage, isSending: $isSending, typingUserIds: $typingUserIds, typingUsers: $typingUsers)';
}


}

/// @nodoc
abstract mixin class $ChatDetailStateCopyWith<$Res>  {
  factory $ChatDetailStateCopyWith(ChatDetailState value, $Res Function(ChatDetailState) _then) = _$ChatDetailStateCopyWithImpl;
@useResult
$Res call({
 String conversationId, List<Message> messages, bool isLoading, bool isLoadingMore, bool hasMore, String? cursor, String? errorMessage, bool isSending, List<String> typingUserIds, Map<String, String> typingUsers
});




}
/// @nodoc
class _$ChatDetailStateCopyWithImpl<$Res>
    implements $ChatDetailStateCopyWith<$Res> {
  _$ChatDetailStateCopyWithImpl(this._self, this._then);

  final ChatDetailState _self;
  final $Res Function(ChatDetailState) _then;

/// Create a copy of ChatDetailState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? conversationId = null,Object? messages = null,Object? isLoading = null,Object? isLoadingMore = null,Object? hasMore = null,Object? cursor = freezed,Object? errorMessage = freezed,Object? isSending = null,Object? typingUserIds = null,Object? typingUsers = null,}) {
  return _then(_self.copyWith(
conversationId: null == conversationId ? _self.conversationId : conversationId // ignore: cast_nullable_to_non_nullable
as String,messages: null == messages ? _self.messages : messages // ignore: cast_nullable_to_non_nullable
as List<Message>,isLoading: null == isLoading ? _self.isLoading : isLoading // ignore: cast_nullable_to_non_nullable
as bool,isLoadingMore: null == isLoadingMore ? _self.isLoadingMore : isLoadingMore // ignore: cast_nullable_to_non_nullable
as bool,hasMore: null == hasMore ? _self.hasMore : hasMore // ignore: cast_nullable_to_non_nullable
as bool,cursor: freezed == cursor ? _self.cursor : cursor // ignore: cast_nullable_to_non_nullable
as String?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,isSending: null == isSending ? _self.isSending : isSending // ignore: cast_nullable_to_non_nullable
as bool,typingUserIds: null == typingUserIds ? _self.typingUserIds : typingUserIds // ignore: cast_nullable_to_non_nullable
as List<String>,typingUsers: null == typingUsers ? _self.typingUsers : typingUsers // ignore: cast_nullable_to_non_nullable
as Map<String, String>,
  ));
}

}


/// Adds pattern-matching-related methods to [ChatDetailState].
extension ChatDetailStatePatterns on ChatDetailState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ChatDetailState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ChatDetailState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ChatDetailState value)  $default,){
final _that = this;
switch (_that) {
case _ChatDetailState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ChatDetailState value)?  $default,){
final _that = this;
switch (_that) {
case _ChatDetailState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String conversationId,  List<Message> messages,  bool isLoading,  bool isLoadingMore,  bool hasMore,  String? cursor,  String? errorMessage,  bool isSending,  List<String> typingUserIds,  Map<String, String> typingUsers)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ChatDetailState() when $default != null:
return $default(_that.conversationId,_that.messages,_that.isLoading,_that.isLoadingMore,_that.hasMore,_that.cursor,_that.errorMessage,_that.isSending,_that.typingUserIds,_that.typingUsers);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String conversationId,  List<Message> messages,  bool isLoading,  bool isLoadingMore,  bool hasMore,  String? cursor,  String? errorMessage,  bool isSending,  List<String> typingUserIds,  Map<String, String> typingUsers)  $default,) {final _that = this;
switch (_that) {
case _ChatDetailState():
return $default(_that.conversationId,_that.messages,_that.isLoading,_that.isLoadingMore,_that.hasMore,_that.cursor,_that.errorMessage,_that.isSending,_that.typingUserIds,_that.typingUsers);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String conversationId,  List<Message> messages,  bool isLoading,  bool isLoadingMore,  bool hasMore,  String? cursor,  String? errorMessage,  bool isSending,  List<String> typingUserIds,  Map<String, String> typingUsers)?  $default,) {final _that = this;
switch (_that) {
case _ChatDetailState() when $default != null:
return $default(_that.conversationId,_that.messages,_that.isLoading,_that.isLoadingMore,_that.hasMore,_that.cursor,_that.errorMessage,_that.isSending,_that.typingUserIds,_that.typingUsers);case _:
  return null;

}
}

}

/// @nodoc


class _ChatDetailState implements ChatDetailState {
  const _ChatDetailState({required this.conversationId, final  List<Message> messages = const [], this.isLoading = false, this.isLoadingMore = false, this.hasMore = true, this.cursor, this.errorMessage, this.isSending = false, final  List<String> typingUserIds = const [], final  Map<String, String> typingUsers = const {}}): _messages = messages,_typingUserIds = typingUserIds,_typingUsers = typingUsers;
  

/// Current conversation ID
@override final  String conversationId;
/// List of messages (newest at bottom)
 final  List<Message> _messages;
/// List of messages (newest at bottom)
@override@JsonKey() List<Message> get messages {
  if (_messages is EqualUnmodifiableListView) return _messages;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_messages);
}

/// Loading state for initial load
@override@JsonKey() final  bool isLoading;
/// Loading state for pagination
@override@JsonKey() final  bool isLoadingMore;
/// Whether there are more messages to load
@override@JsonKey() final  bool hasMore;
/// Cursor for pagination
@override final  String? cursor;
/// Error message if any
@override final  String? errorMessage;
/// Sending state
@override@JsonKey() final  bool isSending;
/// List of users currently typing (user IDs)
 final  List<String> _typingUserIds;
/// List of users currently typing (user IDs)
@override@JsonKey() List<String> get typingUserIds {
  if (_typingUserIds is EqualUnmodifiableListView) return _typingUserIds;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_typingUserIds);
}

/// Map of user ID to display name for typing users
 final  Map<String, String> _typingUsers;
/// Map of user ID to display name for typing users
@override@JsonKey() Map<String, String> get typingUsers {
  if (_typingUsers is EqualUnmodifiableMapView) return _typingUsers;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_typingUsers);
}


/// Create a copy of ChatDetailState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ChatDetailStateCopyWith<_ChatDetailState> get copyWith => __$ChatDetailStateCopyWithImpl<_ChatDetailState>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ChatDetailState&&(identical(other.conversationId, conversationId) || other.conversationId == conversationId)&&const DeepCollectionEquality().equals(other._messages, _messages)&&(identical(other.isLoading, isLoading) || other.isLoading == isLoading)&&(identical(other.isLoadingMore, isLoadingMore) || other.isLoadingMore == isLoadingMore)&&(identical(other.hasMore, hasMore) || other.hasMore == hasMore)&&(identical(other.cursor, cursor) || other.cursor == cursor)&&(identical(other.errorMessage, errorMessage) || other.errorMessage == errorMessage)&&(identical(other.isSending, isSending) || other.isSending == isSending)&&const DeepCollectionEquality().equals(other._typingUserIds, _typingUserIds)&&const DeepCollectionEquality().equals(other._typingUsers, _typingUsers));
}


@override
int get hashCode => Object.hash(runtimeType,conversationId,const DeepCollectionEquality().hash(_messages),isLoading,isLoadingMore,hasMore,cursor,errorMessage,isSending,const DeepCollectionEquality().hash(_typingUserIds),const DeepCollectionEquality().hash(_typingUsers));

@override
String toString() {
  return 'ChatDetailState(conversationId: $conversationId, messages: $messages, isLoading: $isLoading, isLoadingMore: $isLoadingMore, hasMore: $hasMore, cursor: $cursor, errorMessage: $errorMessage, isSending: $isSending, typingUserIds: $typingUserIds, typingUsers: $typingUsers)';
}


}

/// @nodoc
abstract mixin class _$ChatDetailStateCopyWith<$Res> implements $ChatDetailStateCopyWith<$Res> {
  factory _$ChatDetailStateCopyWith(_ChatDetailState value, $Res Function(_ChatDetailState) _then) = __$ChatDetailStateCopyWithImpl;
@override @useResult
$Res call({
 String conversationId, List<Message> messages, bool isLoading, bool isLoadingMore, bool hasMore, String? cursor, String? errorMessage, bool isSending, List<String> typingUserIds, Map<String, String> typingUsers
});




}
/// @nodoc
class __$ChatDetailStateCopyWithImpl<$Res>
    implements _$ChatDetailStateCopyWith<$Res> {
  __$ChatDetailStateCopyWithImpl(this._self, this._then);

  final _ChatDetailState _self;
  final $Res Function(_ChatDetailState) _then;

/// Create a copy of ChatDetailState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? conversationId = null,Object? messages = null,Object? isLoading = null,Object? isLoadingMore = null,Object? hasMore = null,Object? cursor = freezed,Object? errorMessage = freezed,Object? isSending = null,Object? typingUserIds = null,Object? typingUsers = null,}) {
  return _then(_ChatDetailState(
conversationId: null == conversationId ? _self.conversationId : conversationId // ignore: cast_nullable_to_non_nullable
as String,messages: null == messages ? _self._messages : messages // ignore: cast_nullable_to_non_nullable
as List<Message>,isLoading: null == isLoading ? _self.isLoading : isLoading // ignore: cast_nullable_to_non_nullable
as bool,isLoadingMore: null == isLoadingMore ? _self.isLoadingMore : isLoadingMore // ignore: cast_nullable_to_non_nullable
as bool,hasMore: null == hasMore ? _self.hasMore : hasMore // ignore: cast_nullable_to_non_nullable
as bool,cursor: freezed == cursor ? _self.cursor : cursor // ignore: cast_nullable_to_non_nullable
as String?,errorMessage: freezed == errorMessage ? _self.errorMessage : errorMessage // ignore: cast_nullable_to_non_nullable
as String?,isSending: null == isSending ? _self.isSending : isSending // ignore: cast_nullable_to_non_nullable
as bool,typingUserIds: null == typingUserIds ? _self._typingUserIds : typingUserIds // ignore: cast_nullable_to_non_nullable
as List<String>,typingUsers: null == typingUsers ? _self._typingUsers : typingUsers // ignore: cast_nullable_to_non_nullable
as Map<String, String>,
  ));
}


}

// dart format on
