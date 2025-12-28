import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/features/auth/data/datasources/auth_remote_data_source.dart';
import 'package:frontend/features/auth/data/models/user_model.dart';
import 'package:mocktail/mocktail.dart';

class MockDio extends Mock implements Dio {}

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

class MockResponse extends Mock implements Response {}

void main() {
  late AuthRemoteDataSourceImpl dataSource;
  late MockDio mockDio;
  late MockFlutterSecureStorage mockStorage;

  setUp(() {
    mockDio = MockDio();
    mockStorage = MockFlutterSecureStorage();
    dataSource = AuthRemoteDataSourceImpl(mockDio, mockStorage);
  });

  group('googleLogin', () {
    const tToken = 'test_token';
    const tUserModel = UserModel(
      id: '1',
      email: 'test@example.com',
      displayName: 'Test User',
    );

    final tResponseDataWithUser = {
      'accessToken': 'access_token',
      'refreshToken': 'refresh_token',
      'user': tUserModel.toJson(),
    };

    test(
      'should return UserModel when google login is successful and returns user object',
      () async {
        // Arrange
        final response = MockResponse();
        when(() => response.data).thenReturn(tResponseDataWithUser);
        when(
          () => mockDio.post(any(), data: any(named: 'data')),
        ).thenAnswer((_) async => response);
        when(
          () => mockStorage.write(
            key: any(named: 'key'),
            value: any(named: 'value'),
          ),
        ).thenAnswer((_) async {});

        // Act
        final result = await dataSource.googleLogin(tToken);

        // Assert
        expect(result, isA<UserModel>());
        expect(result.email, tUserModel.email);
        verify(
          () => mockDio.post('/auth/google', data: {'token': tToken}),
        ).called(1);
        verify(
          () => mockStorage.write(key: 'accessToken', value: 'access_token'),
        ).called(1);
        verify(
          () => mockStorage.write(key: 'refreshToken', value: 'refresh_token'),
        ).called(1);
      },
    );

    test('should throw Exception when dio throws error', () async {
      // Arrange
      when(() => mockDio.post(any(), data: any(named: 'data'))).thenThrow(
        DioException(requestOptions: RequestOptions(path: '/auth/google')),
      );

      // Act
      final call = dataSource.googleLogin;

      // Assert
      expect(() => call(tToken), throwsA(isA<DioException>()));
    });
  });

  group('register', () {
    const tName = 'Test User';
    const tEmail = 'test@example.com';
    const tPassword = 'password';
    const tUserModel = UserModel(id: '1', email: tEmail, displayName: tName);

    final tResponseData = {
      'accessToken': 'access_token',
      'refreshToken': 'refresh_token',
      'user': tUserModel.toJson(),
    };

    test('should perform POST to /auth/signup and return UserModel', () async {
      // Arrange
      final response = MockResponse();
      when(() => response.data).thenReturn(tResponseData);
      when(
        () => mockDio.post(any(), data: any(named: 'data')),
      ).thenAnswer((_) async => response);
      when(
        () => mockStorage.write(
          key: any(named: 'key'),
          value: any(named: 'value'),
        ),
      ).thenAnswer((_) async {});

      // Act
      final result = await dataSource.register(tName, tEmail, tPassword);

      // Assert
      expect(result, isA<UserModel>());
      verify(
        () => mockDio.post(
          '/auth/signup',
          data: {'displayName': tName, 'email': tEmail, 'password': tPassword},
        ),
      ).called(1);
    });
  });

  group('verifyEmail', () {
    const tEmail = 'test@example.com';
    const tOtp = '123456';
    const tUserModel = UserModel(
      id: '1',
      email: tEmail,
      displayName: 'Test User',
      isEmailVerified: true,
    );

    test(
      'should perform POST to /auth/verify-email and then fetch profile',
      () async {
        // Arrange
        // 1. Mock verify call
        when(
          () => mockDio.post('/auth/verify-email', data: any(named: 'data')),
        ).thenAnswer((_) async => MockResponse());

        // 2. Mock getProfile call
        final profileResponse = MockResponse();
        when(() => profileResponse.data).thenReturn(tUserModel.toJson());
        when(() => mockDio.get('/me')).thenAnswer((_) async => profileResponse);

        // Act
        final result = await dataSource.verifyEmail(tEmail, tOtp);

        // Assert
        expect(result, isA<UserModel>());
        expect(result.isEmailVerified, true);
        verify(
          () => mockDio.post(
            '/auth/verify-email',
            data: {'email': tEmail, 'otp': tOtp},
          ),
        ).called(1);
        verify(() => mockDio.get('/me')).called(1);
      },
    );
  });
}
