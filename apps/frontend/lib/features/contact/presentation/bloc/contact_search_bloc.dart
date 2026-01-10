import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import 'package:stream_transform/stream_transform.dart';

import '../../domain/entities/contact_user.dart';
import '../../domain/usecases/search_contacts_usecase.dart';

part 'contact_search_event.dart';
part 'contact_search_state.dart';

const _debounceDuration = Duration(milliseconds: 300);

EventTransformer<E> debounce<E>(Duration duration) {
  return (events, mapper) {
    return events.debounce(duration).switchMap(mapper);
  };
}

@injectable
class ContactSearchBloc extends Bloc<ContactSearchEvent, ContactSearchState> {
  final SearchContactsUseCase _searchContactsUseCase;

  ContactSearchBloc(this._searchContactsUseCase)
    : super(ContactSearchInitial()) {
    on<ContactSearchQueryChanged>(
      _onQueryChanged,
      transformer: debounce(_debounceDuration),
    );
  }

  Future<void> _onQueryChanged(
    ContactSearchQueryChanged event,
    Emitter<ContactSearchState> emit,
  ) async {
    if (event.query.isEmpty) {
      emit(ContactSearchInitial());
      return;
    }

    emit(ContactSearchLoading());

    final result = await _searchContactsUseCase(event.query);

    result.fold(
      (failure) => emit(ContactSearchError(failure.message)),
      (users) => emit(ContactSearchSuccess(users)),
    );
  }
}
