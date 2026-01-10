import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';
import '../models/contact_user_model.dart';

abstract class ContactRemoteDataSource {
  Future<List<ContactUserModel>> searchContacts(String query);
}

@Injectable(as: ContactRemoteDataSource)
class ContactRemoteDataSourceImpl implements ContactRemoteDataSource {
  final Dio _dio;

  ContactRemoteDataSourceImpl(this._dio);

  @override
  Future<List<ContactUserModel>> searchContacts(String query) async {
    final response = await _dio.get('/users', queryParameters: {'q': query});

    return (response.data as List)
        .map((e) => ContactUserModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
