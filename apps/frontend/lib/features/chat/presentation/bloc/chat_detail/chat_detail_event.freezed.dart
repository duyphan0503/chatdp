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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>({TResult Function( _LoadMessages value)?  loadMessages,TResult Function( _LoadMoreMessages value)?  loadMoreMessages,TResult Function( _SendMessage value)?  sendMessage,TResult Function( _MessageReceived value)?  messageReceived,TResult Function( _JoinConversation value)?  joinConversation,TResult Function( _LeaveConversation value)?  leaveConversation,required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LoadMessages() when loadMessages != null:
return loadMessages(_that);case _LoadMoreMessages() when loadMoreMessages != null:
return loadMoreMessages(_that);case _SendMessage() when sendMessage != null:
return sendMessage(_that);case _MessageReceived() when messageReceived != null:
return messageReceived(_that);case _JoinConversation() when joinConversation != null:
return joinConversation(_that);case _LeaveConversation() when leaveConversation != null:
return leaveConversation(_that);case _:
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

@optionalTypeArgs TResult map<TResult extends Object?>({required TResult Function( _LoadMessages value)  loadMessages,required TResult Function( _LoadMoreMessages value)  loadMoreMessages,required TResult Function( _SendMessage value)  sendMessage,required TResult Function( _MessageReceived value)  messageReceived,required TResult Function( _JoinConversation value)  joinConversation,required TResult Function( _LeaveConversation value)  leaveConversation,}){
final _that = this;
switch (_that) {
case _LoadMessages():
return loadMessages(_that);case _LoadMoreMessages():
return loadMoreMessages(_that);case _SendMessage():
return sendMessage(_that);case _MessageReceived():
return messageReceived(_that);case _JoinConversation():
return joinConversation(_that);case _LeaveConversation():
return leaveConversation(_that);case _:
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>({TResult? Function( _LoadMessages value)?  loadMessages,TResult? Function( _LoadMoreMessages value)?  loadMoreMessages,TResult? Function( _SendMessage value)?  sendMessage,TResult? Function( _MessageReceived value)?  messageReceived,TResult? Function( _JoinConversation value)?  joinConversation,TResult? Function( _LeaveConversation value)?  leaveConversation,}){
final _that = this;
switch (_that) {
case _LoadMessages() when loadMessages != null:
return loadMessages(_that);case _LoadMoreMessages() when loadMoreMessages != null:
return loadMoreMessages(_that);case _SendMessage() when sendMessage != null:
return sendMessage(_that);case _MessageReceived() when messageReceived != null:
return messageReceived(_that);case _JoinConversation() when joinConversation != null:
return joinConversation(_that);case _LeaveConversation() when leaveConversation != null:
return leaveConversation(_that);case _:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>({TResult Function( String conversationId)?  loadMessages,TResult Function()?  loadMoreMessages,TResult Function( String content)?  sendMessage,TResult Function( Message message)?  messageReceived,TResult Function()?  joinConversation,TResult Function()?  leaveConversation,required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LoadMessages() when loadMessages != null:
return loadMessages(_that.conversationId);case _LoadMoreMessages() when loadMoreMessages != null:
return loadMoreMessages();case _SendMessage() when sendMessage != null:
return sendMessage(_that.content);case _MessageReceived() when messageReceived != null:
return messageReceived(_that.message);case _JoinConversation() when joinConversation != null:
return joinConversation();case _LeaveConversation() when leaveConversation != null:
return leaveConversation();case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>({required TResult Function( String conversationId)  loadMessages,required TResult Function()  loadMoreMessages,required TResult Function( String content)  sendMessage,required TResult Function( Message message)  messageReceived,required TResult Function()  joinConversation,required TResult Function()  leaveConversation,}) {final _that = this;
switch (_that) {
case _LoadMessages():
return loadMessages(_that.conversationId);case _LoadMoreMessages():
return loadMoreMessages();case _SendMessage():
return sendMessage(_that.content);case _MessageReceived():
return messageReceived(_that.message);case _JoinConversation():
return joinConversation();case _LeaveConversation():
return leaveConversation();case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>({TResult? Function( String conversationId)?  loadMessages,TResult? Function()?  loadMoreMessages,TResult? Function( String content)?  sendMessage,TResult? Function( Message message)?  messageReceived,TResult? Function()?  joinConversation,TResult? Function()?  leaveConversation,}) {final _that = this;
switch (_that) {
case _LoadMessages() when loadMessages != null:
return loadMessages(_that.conversationId);case _LoadMoreMessages() when loadMoreMessages != null:
return loadMoreMessages();case _SendMessage() when sendMessage != null:
return sendMessage(_that.content);case _MessageReceived() when messageReceived != null:
return messageReceived(_that.message);case _JoinConversation() when joinConversation != null:
return joinConversation();case _LeaveConversation() when leaveConversation != null:
return leaveConversation();case _:
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




// dart format on
