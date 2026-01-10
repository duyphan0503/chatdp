import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/contact_user.dart';

abstract class ContactRepository {
  Future<Either<Failure, List<ContactUser>>> searchContacts(String query);
}
