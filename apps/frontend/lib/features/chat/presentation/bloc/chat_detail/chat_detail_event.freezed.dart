// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'chat_detail_event.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ChatDetailEvent {





@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ChatDetailEvent);
}


@override
int get hashCode => runtimeType.hashCode;

@override
String toString() {
  return 'ChatDetailEvent()';
}


}

/// @nodoc
class $ChatDetailEventCopyWith<$Res>  {
$ChatDetailEventCopyWith(ChatDetailEvent _, $Res Function(ChatDetailEvent) __);
}


/// Adds pattern-matching-related methods to [ChatDetailEvent].
extension ChatDetailEventPatterns on ChatDetailEvent {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>({TResult Function( _LoadMessages value)?  loadMessages,TResult Function( _LoadMoreMessages value)?  loadMoreMessages,TResult Function( _SendMessage value)?  sendMessage,TResult Function( _MessageReceived value)?  messageReceived,TResult Function( _JoinConversation value)?  joinConversation,TResult Function( _LeaveConversation value)?  leaveConversation,TResult Function( _SendImage value)?  sendImage,TResult Function( _StartTyping value)?  startTyping,TResult Function( _StopTyping value)?  stopTyping,TResult Function( _UserTypingReceived value)?  userTypingReceived,TResult Function( _UserStoppedTyping value)?  userStoppedTyping,required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LoadMessages() when loadMessages != null:
return loadMessages(_that);case _LoadMoreMessages() when loadMoreMessages != null:
return loadMoreMessages(_that);case _SendMessage() when sendMessage != null:
return sendMessage(_that);case _MessageReceived() when messageReceived != null:
return messageReceived(_that);case _JoinConversation() when joinConversation != null:
return joinConversation(_that);case _LeaveConversation() when leaveConversation != null:
return leaveConversation(_that);case _SendImage() when sendImage != null:
return sendImage(_that);case _StartTyping() when startTyping != null:
return startTyping(_that);case _StopTyping() when stopTyping != null:
return stopTyping(_that);case _UserTypingReceived() when userTypingReceived != null:
return userTypingReceived(_that);case _UserStoppedTyping() when userStoppedTyping != null:
return userStoppedTyping(_that);case _:
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

@optionalTypeArgs TResult map<TResult extends Object?>({required TResult Function( _LoadMessages value)  loadMessages,required TResult Function( _LoadMoreMessages value)  loadMoreMessages,required TResult Function( _SendMessage value)  sendMessage,required TResult Function( _MessageReceived value)  messageReceived,required TResult Function( _JoinConversation value)  joinConversation,required TResult Function( _LeaveConversation value)  leaveConversation,required TResult Function( _SendImage value)  sendImage,required TResult Function( _StartTyping value)  startTyping,required TResult Function( _StopTyping value)  stopTyping,required TResult Function( _UserTypingReceived value)  userTypingReceived,required TResult Function( _UserStoppedTyping value)  userStoppedTyping,}){
final _that = this;
switch (_that) {
case _LoadMessages():
return loadMessages(_that);case _LoadMoreMessages():
return loadMoreMessages(_that);case _SendMessage():
return sendMessage(_that);case _MessageReceived():
return messageReceived(_that);case _JoinConversation():
return joinConversation(_that);case _LeaveConversation():
return leaveConversation(_that);case _SendImage():
return sendImage(_that);case _StartTyping():
return startTyping(_that);case _StopTyping():
return stopTyping(_that);case _UserTypingReceived():
return userTypingReceived(_that);case _UserStoppedTyping():
return userStoppedTyping(_that);case _:
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>({TResult? Function( _LoadMessages value)?  loadMessages,TResult? Function( _LoadMoreMessages value)?  loadMoreMessages,TResult? Function( _SendMessage value)?  sendMessage,TResult? Function( _MessageReceived value)?  messageReceived,TResult? Function( _JoinConversation value)?  joinConversation,TResult? Function( _LeaveConversation value)?  leaveConversation,TResult? Function( _SendImage value)?  sendImage,TResult? Function( _StartTyping value)?  startTyping,TResult? Function( _StopTyping value)?  stopTyping,TResult? Function( _UserTypingReceived value)?  userTypingReceived,TResult? Function( _UserStoppedTyping value)?  userStoppedTyping,}){
final _that = this;
switch (_that) {
case _LoadMessages() when loadMessages != null:
return loadMessages(_that);case _LoadMoreMessages() when loadMoreMessages != null:
return loadMoreMessages(_that);case _SendMessage() when sendMessage != null:
return sendMessage(_that);case _MessageReceived() when messageReceived != null:
return messageReceived(_that);case _JoinConversation() when joinConversation != null:
return joinConversation(_that);case _LeaveConversation() when leaveConversation != null:
return leaveConversation(_that);case _SendImage() when sendImage != null:
return sendImage(_that);case _StartTyping() when startTyping != null:
return startTyping(_that);case _StopTyping() when stopTyping != null:
return stopTyping(_that);case _UserTypingReceived() when userTypingReceived != null:
return userTypingReceived(_that);case _UserStoppedTyping() when userStoppedTyping != null:
return userStoppedTyping(_that);case _:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>({TResult Function( String conversationId)?  loadMessages,TResult Function()?  loadMoreMessages,TResult Function( String content)?  sendMessage,TResult Function( Message message)?  messageReceived,TResult Function()?  joinConversation,TResult Function()?  leaveConversation,TResult Function( File image)?  sendImage,TResult Function()?  startTyping,TResult Function()?  stopTyping,TResult Function( String userId,  String userName)?  userTypingReceived,TResult Function( String userId)?  userStoppedTyping,required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LoadMessages() when loadMessages != null:
return loadMessages(_that.conversationId);case _LoadMoreMessages() when loadMoreMessages != null:
return loadMoreMessages();case _SendMessage() when sendMessage != null:
return sendMessage(_that.content);case _MessageReceived() when messageReceived != null:
return messageReceived(_that.message);case _JoinConversation() when joinConversation != null:
return joinConversation();case _LeaveConversation() when leaveConversation != null:
return leaveConversation();case _SendImage() when sendImage != null:
return sendImage(_that.image);case _StartTyping() when startTyping != null:
return startTyping();case _StopTyping() when stopTyping != null:
return stopTyping();case _UserTypingReceived() when userTypingReceived != null:
return userTypingReceived(_that.userId,_that.userName);case _UserStoppedTyping() when userStoppedTyping != null:
return userStoppedTyping(_that.userId);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>({required TResult Function( String conversationId)  loadMessages,required TResult Function()  loadMoreMessages,required TResult Function( String content)  sendMessage,required TResult Function( Message message)  messageReceived,required TResult Function()  joinConversation,required TResult Function()  leaveConversation,required TResult Function( File image)  sendImage,required TResult Function()  startTyping,required TResult Function()  stopTyping,required TResult Function( String userId,  String userName)  userTypingReceived,required TResult Function( String userId)  userStoppedTyping,}) {final _that = this;
switch (_that) {
case _LoadMessages():
return loadMessages(_that.conversationId);case _LoadMoreMessages():
return loadMoreMessages();case _SendMessage():
return sendMessage(_that.content);case _MessageReceived():
return messageReceived(_that.message);case _JoinConversation():
return joinConversation();case _LeaveConversation():
return leaveConversation();case _SendImage():
return sendImage(_that.image);case _StartTyping():
return startTyping();case _StopTyping():
return stopTyping();case _UserTypingReceived():
return userTypingReceived(_that.userId,_that.userName);case _UserStoppedTyping():
return userStoppedTyping(_that.userId);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>({TResult? Function( String conversationId)?  loadMessages,TResult? Function()?  loadMoreMessages,TResult? Function( String content)?  sendMessage,TResult? Function( Message message)?  messageReceived,TResult? Function()?  joinConversation,TResult? Function()?  leaveConversation,TResult? Function( File image)?  sendImage,TResult? Function()?  startTyping,TResult? Function()?  stopTyping,TResult? Function( String userId,  String userName)?  userTypingReceived,TResult? Function( String userId)?  userStoppedTyping,}) {final _that = this;
switch (_that) {
case _LoadMessages() when loadMessages != null:
return loadMessages(_that.conversationId);case _LoadMoreMessages() when loadMoreMessages != null:
return loadMoreMessages();case _SendMessage() when sendMessage != null:
return sendMessage(_that.content);case _MessageReceived() when messageReceived != null:
return messageReceived(_that.message);case _JoinConversation() when joinConversation != null:
return joinConversation();case _LeaveConversation() when leaveConversation != null:
return leaveConversation();case _SendImage() when sendImage != null:
return sendImage(_that.image);case _StartTyping() when startTyping != null:
return startTyping();case _StopTyping() when stopTyping != null:
return stopTyping();case _UserTypingReceived() when userTypingReceived != null:
return userTypingReceived(_that.userId,_that.userName);case _UserStoppedTyping() when userStoppedTyping != null:
return userStoppedTyping(_that.userId);case _:
  return null;

}
}

}

/// @nodoc


class _LoadMessages implements ChatDetailEvent {
  const _LoadMessages({required this.conversationId});
  

 final  String conversationId;

/// Create a copy of ChatDetailEvent
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LoadMessagesCopyWith<_LoadMessages> get copyWith => __$LoadMessagesCopyWithImpl<_LoadMessages>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _LoadMessages&&(identical(other.conversationId, conversationId) || other.conversationId == conversationId));
}


@override
int get hashCode => Object.hash(runtimeType,conversationId);

@override
String toString() {
  return 'ChatDetailEvent.loadMessages(conversationId: $conversationId)';
}


}

/// @nodoc
abstract mixin class _$LoadMessagesCopyWith<$Res> implements $ChatDetailEventCopyWith<$Res> {
  factory _$LoadMessagesCopyWith(_LoadMessages value, $Res Function(_LoadMessages) _then) = __$LoadMessagesCopyWithImpl;
@useResult
$Res call({
 String conversationId
});




}
/// @nodoc
class __$LoadMessagesCopyWithImpl<$Res>
    implements _$LoadMessagesCopyWith<$Res> {
  __$LoadMessagesCopyWithImpl(this._self, this._then);

  final _LoadMessages _self;
  final $Res Function(_LoadMessages) _then;

/// Create a copy of ChatDetailEvent
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') $Res call({Object? conversationId = null,}) {
  return _then(_LoadMessages(
conversationId: null == conversationId ? _self.conversationId : conversationId // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

/// @nodoc


class _LoadMoreMessages implements ChatDetailEvent {
  const _LoadMoreMessages();
  






@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _LoadMoreMessages);
}


@override
int get hashCode => runtimeType.hashCode;

@override
String toString() {
  return 'ChatDetailEvent.loadMoreMessages()';
}


}




/// @nodoc


class _SendMessage implements ChatDetailEvent {
  const _SendMessage({required this.content});
  

 final  String content;

/// Create a copy of ChatDetailEvent
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SendMessageCopyWith<_SendMessage> get copyWith => __$SendMessageCopyWithImpl<_SendMessage>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SendMessage&&(identical(other.content, content) || other.content == content));
}


@override
int get hashCode => Object.hash(runtimeType,content);

@override
String toString() {
  return 'ChatDetailEvent.sendMessage(content: $content)';
}


}

/// @nodoc
abstract mixin class _$SendMessageCopyWith<$Res> implements $ChatDetailEventCopyWith<$Res> {
  factory _$SendMessageCopyWith(_SendMessage value, $Res Function(_SendMessage) _then) = __$SendMessageCopyWithImpl;
@useResult
$Res call({
 String content
});




}
/// @nodoc
class __$SendMessageCopyWithImpl<$Res>
    implements _$SendMessageCopyWith<$Res> {
  __$SendMessageCopyWithImpl(this._self, this._then);

  final _SendMessage _self;
  final $Res Function(_SendMessage) _then;

/// Create a copy of ChatDetailEvent
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') $Res call({Object? content = null,}) {
  return _then(_SendMessage(
content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

/// @nodoc


class _MessageReceived implements ChatDetailEvent {
  const _MessageReceived({required this.message});
  

 final  Message message;

/// Create a copy of ChatDetailEvent
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$MessageReceivedCopyWith<_MessageReceived> get copyWith => __$MessageReceivedCopyWithImpl<_MessageReceived>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _MessageReceived&&(identical(other.message, message) || other.message == message));
}


@override
int get hashCode => Object.hash(runtimeType,message);

@override
String toString() {
  return 'ChatDetailEvent.messageReceived(message: $message)';
}


}

/// @nodoc
abstract mixin class _$MessageReceivedCopyWith<$Res> implements $ChatDetailEventCopyWith<$Res> {
  factory _$MessageReceivedCopyWith(_MessageReceived value, $Res Function(_MessageReceived) _then) = __$MessageReceivedCopyWithImpl;
@useResult
$Res call({
 Message message
});


$MessageCopyWith<$Res> get message;

}
/// @nodoc
class __$MessageReceivedCopyWithImpl<$Res>
    implements _$MessageReceivedCopyWith<$Res> {
  __$MessageReceivedCopyWithImpl(this._self, this._then);

  final _MessageReceived _self;
  final $Res Function(_MessageReceived) _then;

/// Create a copy of ChatDetailEvent
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') $Res call({Object? message = null,}) {
  return _then(_MessageReceived(
message: null == message ? _self.message : message // ignore: cast_nullable_to_non_nullable
as Message,
  ));
}

/// Create a copy of ChatDetailEvent
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$MessageCopyWith<$Res> get message {
  
  return $MessageCopyWith<$Res>(_self.message, (value) {
    return _then(_self.copyWith(message: value));
  });
}
}

/// @nodoc


class _JoinConversation implements ChatDetailEvent {
  const _JoinConversation();
  






@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _JoinConversation);
}


@override
int get hashCode => runtimeType.hashCode;

@override
String toString() {
  return 'ChatDetailEvent.joinConversation()';
}


}




/// @nodoc


class _LeaveConversation implements ChatDetailEvent {
  const _LeaveConversation();
  






@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _LeaveConversation);
}


@override
int get hashCode => runtimeType.hashCode;

@override
String toString() {
  return 'ChatDetailEvent.leaveConversation()';
}


}




/// @nodoc


class _SendImage implements ChatDetailEvent {
  const _SendImage({required this.image});
  

 final  File image;

/// Create a copy of ChatDetailEvent
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SendImageCopyWith<_SendImage> get copyWith => __$SendImageCopyWithImpl<_SendImage>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SendImage&&(identical(other.image, image) || other.image == image));
}


@override
int get hashCode => Object.hash(runtimeType,image);

@override
String toString() {
  return 'ChatDetailEvent.sendImage(image: $image)';
}


}

/// @nodoc
abstract mixin class _$SendImageCopyWith<$Res> implements $ChatDetailEventCopyWith<$Res> {
  factory _$SendImageCopyWith(_SendImage value, $Res Function(_SendImage) _then) = __$SendImageCopyWithImpl;
@useResult
$Res call({
 File image
});




}
/// @nodoc
class __$SendImageCopyWithImpl<$Res>
    implements _$SendImageCopyWith<$Res> {
  __$SendImageCopyWithImpl(this._self, this._then);

  final _SendImage _self;
  final $Res Function(_SendImage) _then;

/// Create a copy of ChatDetailEvent
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') $Res call({Object? image = null,}) {
  return _then(_SendImage(
image: null == image ? _self.image : image // ignore: cast_nullable_to_non_nullable
as File,
  ));
}


}

/// @nodoc


class _StartTyping implements ChatDetailEvent {
  const _StartTyping();
  






@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _StartTyping);
}


@override
int get hashCode => runtimeType.hashCode;

@override
String toString() {
  return 'ChatDetailEvent.startTyping()';
}


}




/// @nodoc


class _StopTyping implements ChatDetailEvent {
  const _StopTyping();
  






@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _StopTyping);
}


@override
int get hashCode => runtimeType.hashCode;

@override
String toString() {
  return 'ChatDetailEvent.stopTyping()';
}


}




/// @nodoc


class _UserTypingReceived implements ChatDetailEvent {
  const _UserTypingReceived({required this.userId, required this.userName});
  

 final  String userId;
 final  String userName;

/// Create a copy of ChatDetailEvent
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$UserTypingReceivedCopyWith<_UserTypingReceived> get copyWith => __$UserTypingReceivedCopyWithImpl<_UserTypingReceived>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _UserTypingReceived&&(identical(other.userId, userId) || other.userId == userId)&&(identical(other.userName, userName) || other.userName == userName));
}


@override
int get hashCode => Object.hash(runtimeType,userId,userName);

@override
String toString() {
  return 'ChatDetailEvent.userTypingReceived(userId: $userId, userName: $userName)';
}


}

/// @nodoc
abstract mixin class _$UserTypingReceivedCopyWith<$Res> implements $ChatDetailEventCopyWith<$Res> {
  factory _$UserTypingReceivedCopyWith(_UserTypingReceived value, $Res Function(_UserTypingReceived) _then) = __$UserTypingReceivedCopyWithImpl;
@useResult
$Res call({
 String userId, String userName
});




}
/// @nodoc
class __$UserTypingReceivedCopyWithImpl<$Res>
    implements _$UserTypingReceivedCopyWith<$Res> {
  __$UserTypingReceivedCopyWithImpl(this._self, this._then);

  final _UserTypingReceived _self;
  final $Res Function(_UserTypingReceived) _then;

/// Create a copy of ChatDetailEvent
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') $Res call({Object? userId = null,Object? userName = null,}) {
  return _then(_UserTypingReceived(
userId: null == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as String,userName: null == userName ? _self.userName : userName // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

/// @nodoc


class _UserStoppedTyping implements ChatDetailEvent {
  const _UserStoppedTyping({required this.userId});
  

 final  String userId;

/// Create a copy of ChatDetailEvent
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$UserStoppedTypingCopyWith<_UserStoppedTyping> get copyWith => __$UserStoppedTypingCopyWithImpl<_UserStoppedTyping>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _UserStoppedTyping&&(identical(other.userId, userId) || other.userId == userId));
}


@override
int get hashCode => Object.hash(runtimeType,userId);

@override
String toString() {
  return 'ChatDetailEvent.userStoppedTyping(userId: $userId)';
}


}

/// @nodoc
abstract mixin class _$UserStoppedTypingCopyWith<$Res> implements $ChatDetailEventCopyWith<$Res> {
  factory _$UserStoppedTypingCopyWith(_UserStoppedTyping value, $Res Function(_UserStoppedTyping) _then) = __$UserStoppedTypingCopyWithImpl;
@useResult
$Res call({
 String userId
});




}
/// @nodoc
class __$UserStoppedTypingCopyWithImpl<$Res>
    implements _$UserStoppedTypingCopyWith<$Res> {
  __$UserStoppedTypingCopyWithImpl(this._self, this._then);

  final _UserStoppedTyping _self;
  final $Res Function(_UserStoppedTyping) _then;

/// Create a copy of ChatDetailEvent
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') $Res call({Object? userId = null,}) {
  return _then(_UserStoppedTyping(
userId: null == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
