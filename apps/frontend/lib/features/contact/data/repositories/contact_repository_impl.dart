import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/contact_user.dart';
import '../../domain/repositories/contact_repository.dart';
import '../datasources/contact_remote_data_source.dart';

@Injectable(as: ContactRepository)
class ContactRepositoryImpl implements ContactRepository {
  final ContactRemoteDataSource _remoteDataSource;

  ContactRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<ContactUser>>> searchContacts(
    String query,
  ) async {
    try {
      final models = await _remoteDataSource.searchContacts(query);
      return Right(models);
    } catch (e) {
      if (e is DioException) {
        return Left(ServerFailure(e.message ?? 'Unknown Dio Error'));
      }
      return Left(ServerFailure(e.toString()));
    }
  }
}
