part of 'contact_search_bloc.dart';

sealed class ContactSearchEvent extends Equatable {
  const ContactSearchEvent();

  @override
  List<Object> get props => [];
}

final class ContactSearchQueryChanged extends ContactSearchEvent {
  final String query;

  const ContactSearchQueryChanged(this.query);

  @override
  List<Object> get props => [query];
}
