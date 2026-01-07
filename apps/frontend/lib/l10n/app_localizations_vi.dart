// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Vietnamese (`vi`).
class AppLocalizationsVi extends AppLocalizations {
  AppLocalizationsVi([String locale = 'vi']) : super(locale);

  @override
  String get appTitle => 'ChatDP';

  @override
  String get loginTitle => 'Chào mừng trở lại';

  @override
  String get email => 'Email';

  @override
  String get password => 'Mật khẩu';

  @override
  String get signIn => 'ĐĂNG NHẬP';

  @override
  String get forgotPassword => 'Quên mật khẩu?';

  @override
  String get orContinueWith => 'Hoặc tiếp tục với';

  @override
  String get dontHaveAccount => 'Chưa có tài khoản? ';

  @override
  String inputRequired(Object field) {
    return '$field là bắt buộc';
  }

  @override
  String get invalidEmail => 'Vui lòng nhập email hợp lệ';

  @override
  String get passwordTooShort => 'Mật khẩu phải có ít nhất 6 ký tự';

  @override
  String get passwordsDoNotMatch => 'Mật khẩu không khớp';

  @override
  String get nameTooShort => 'Tên phải có ít nhất 2 ký tự';

  @override
  String get otpInvalid => 'Mã OTP phải có 6 chữ số';

  @override
  String get loginSuccess => 'Đăng nhập thành công! Chào mừng trở lại.';

  @override
  String get verifyEmailToContinue =>
      'Vui lòng xác minh email của bạn để tiếp tục.';

  @override
  String get resetPasswordSuccess =>
      'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.';

  @override
  String get verificationCodeSent => 'Mã xác minh đã được gửi thành công!';

  @override
  String get otpSentSuccess => 'OTP đã được gửi thành công!';

  @override
  String get verificationSuccess => 'Xác minh thành công!';

  @override
  String get registrationSuccess => 'Đăng ký thành công!';

  @override
  String get signInToContinue => 'Đăng nhập để tiếp tục';

  @override
  String get createAccount => 'Tạo tài khoản';

  @override
  String get joinFuture => 'Tham gia tương lai của nhắn tin';

  @override
  String get fullName => 'Họ và tên';

  @override
  String get confirmPassword => 'Xác nhận mật khẩu';

  @override
  String get signUp => 'ĐĂNG KÝ';

  @override
  String get alreadyHaveAccount => 'Đã có tài khoản? ';

  @override
  String get signInAction => 'Đăng nhập';

  @override
  String get passwordRecovery => 'Khôi phục mật khẩu';

  @override
  String get verifyYourEmail => 'Xác minh Email';

  @override
  String enterOtpCodes(Object email) {
    return 'Vui lòng nhập mã 6 số đã được gửi đến\n$email';
  }

  @override
  String get otpInputHint => 'Vui lòng nhập 6 số';

  @override
  String get didntReceiveCode => 'Không nhận được mã? ';

  @override
  String get resend => 'Gửi lại';

  @override
  String resendIn(Object start) {
    return 'Gửi lại sau $start s';
  }

  @override
  String get verify => 'XÁC MINH';

  @override
  String get forgotPasswordTitle => 'Quên mật khẩu';

  @override
  String get forgotPasswordInstruction =>
      'Nhập địa chỉ email của bạn và chúng tôi sẽ gửi mã để đặt lại mật khẩu.';

  @override
  String get emailAddress => 'Địa chỉ Email';

  @override
  String get sendCode => 'GỬI MÃ';

  @override
  String get setNewPassword => 'Đặt mật khẩu mới';

  @override
  String get newPasswordInstruction =>
      'Mật khẩu mới của bạn phải khác với các mật khẩu đã sử dụng trước đó.';

  @override
  String get newPassword => 'Mật khẩu mới';

  @override
  String get resetPassword => 'ĐẶT LẠI MẬT KHẨU';

  @override
  String get google => 'Google';

  @override
  String get apple => 'Apple';

  @override
  String get comingSoon => 'Sắp ra mắt';

  @override
  String get rememberMe => 'Ghi nhớ đăng nhập';

  @override
  String get navChat => 'Trò chuyện';

  @override
  String get navSettings => 'Cài đặt';

  @override
  String get chatListTitle => 'Trò chuyện';

  @override
  String get chatListPlaceholder => 'Danh sách trò chuyện sẽ hiển thị ở đây';

  @override
  String get language => 'Ngôn ngữ';

  @override
  String get selectLanguage => 'Chọn ngôn ngữ';

  @override
  String get english => 'Tiếng Anh';

  @override
  String get vietnamese => 'Tiếng Việt';

  @override
  String get invalidCredentials => 'Email hoặc mật khẩu không chính xác';

  @override
  String get emailAlreadyRegistered =>
      'Email đã được đăng ký. Vui lòng đăng nhập';

  @override
  String get themeMode => 'Chế độ giao diện';

  @override
  String get themeLight => 'Sáng';

  @override
  String get themeDark => 'Tối';

  @override
  String get themeSystem => 'Hệ thống (mặc định)';

  @override
  String get logout => 'Đăng xuất';

  @override
  String get typeAMessage => 'Nhập tin nhắn...';

  @override
  String get failedToLoadImage => 'Không thể tải ảnh';

  @override
  String get imageUnavailable => 'Ảnh không khả dụng';

  @override
  String get unsupportedMessageType => 'Loại tin nhắn không được hỗ trợ';

  @override
  String get noMessagesYet => 'Chưa có tin nhắn nào';

  @override
  String get online => 'Trực tuyến';

  @override
  String get offline => 'Ngoại tuyến';

  @override
  String get sending => 'Đang gửi';

  @override
  String get sent => 'Đã gửi';

  @override
  String get delivered => 'Đã nhận';

  @override
  String get read => 'Đã đọc';

  @override
  String get failed => 'Thất bại';

  @override
  String get errorConnectionTimeout => 'Hết thời gian kết nối';

  @override
  String get errorNoInternet => 'Không có kết nối internet';

  @override
  String get errorAuthFailed => 'Xác thực thất bại';

  @override
  String get errorServer => 'Lỗi máy chủ';

  @override
  String get errorRequestCancelled => 'Yêu cầu bị hủy';

  @override
  String get errorUnknown => 'Lỗi không xác định';

  @override
  String get errorConvIdEmpty => 'ID cuộc trò chuyện không được để trống';

  @override
  String get errorImageFileNotExist => 'Tệp ảnh không tồn tại';

  @override
  String get errorInvalidImageFormat => 'Định dạng tệp ảnh không hợp lệ';

  @override
  String get retry => 'Thử lại';

  @override
  String get chat => 'Trò chuyện';
}
