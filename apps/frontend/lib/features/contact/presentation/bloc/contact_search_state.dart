part of 'contact_search_bloc.dart';

sealed class ContactSearchState extends Equatable {
  const ContactSearchState();

  @override
  List<Object> get props => [];
}

final class ContactSearchInitial extends ContactSearchState {}

final class ContactSearchLoading extends ContactSearchState {}

final class ContactSearchSuccess extends ContactSearchState {
  final List<ContactUser> users;

  const ContactSearchSuccess(this.users);

  @override
  List<Object> get props => [users];
}

final class ContactSearchError extends ContactSearchState {
  final String message;

  const ContactSearchError(this.message);

  @override
  List<Object> get props => [message];
}
