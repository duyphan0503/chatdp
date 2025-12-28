import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

/// Global test configuration for Flutter widget tests.
///
/// Fixes google_fonts runtime errors in tests by disabling
/// runtime font fetching (which requires AssetManifest.bin).
Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  TestWidgetsFlutterBinding.ensureInitialized();
  GoogleFonts.config.allowRuntimeFetching = false;
  return testMain();
}
