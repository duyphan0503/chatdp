import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/contact_user.dart';
import '../repositories/contact_repository.dart';

@injectable
class SearchContactsUseCase {
  final ContactRepository _repository;

  SearchContactsUseCase(this._repository);

  Future<Either<Failure, List<ContactUser>>> call(String query) {
    return _repository.searchContacts(query);
  }
}
