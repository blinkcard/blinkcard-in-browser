# Release notes

## 2.11.0

### Improvements
- Improved data extraction accuracy across all supported card types

### UI changes
- Added an error message when scanning the wrong side of the card
- Minor changes in scanning instruction messages 


## 2.10.0

### Improvements

- Adjusted thresholds for screen detection model in order to decrease FAR and FRR of existing model
- Significant improvements in photocopy detection. Both the False Rejection Rate and False Acceptance Rate are reduced by ~50% as measured on the default match level.
- Improved automatic camera selection for iOS devices
- Fixed a memory leak in Safari

## 2.9.0

### Improvements
- Included hand, photocopy, and screen detection models to achieve liveness functionality
- Added anonymization info on which side was anonymized. String data is anonymized using an asterisk instead of blanking the result. 
- Expanded the number of supported credit card types by 100%.
- Improved data extraction, including a 30% reduction in incorrect processing of CVV field.

### What's new in the BlinkCard Recognizer?
- Improved scanning performance and added support for virtually any card layout
- Improved IBAN parser which now supports more IBAN formats
- Added option `allowInvalidCardNumber` which allows reading invalid card numbers to avoid endless scanning on samples and test cards:
    - use with care as it might reduce accuracy in certain situations in production
    - for invalid card number the flag `cardNumberValid` in `BlinkCardRecognizer.Result` will be set to `false`
- Added new settings `handScaleThreshold`, `handDocumentOverlapThreshold`, `screenAnalysisMatchLevel`, `photocopyAnalysisMatchLevel`. These settings are used in combination with the new liveness features.
- Added a new callback `LivenessStatusCallback`, which is invoked when each side of a card is scanned. It is called with one parameter, a `LivenessStatus` enum. Use `BlinkCardRecognizer.setLivenessStatusCallback` method to set the callback.

### BlinkCard Recognizer Result
- Two new booleans: `firstSideAnonymized` and `secondSideAnonymized` have been added to indicate whether the first or second side of the card has been anonymized, respectively.
- New result `documentLivenessCheck` which has new liveness model results. It contains liveness information about the first and second sides of the card. Liveness information contains the results of checks performed on the card using screen detection, photocopy detection, and the presence of a live hand.

### Dynamic webassembly memory management

Depending on the device used, the SDK will allocate different amounts of memory on startup.
This is primarily used as a mitigation mechanism for iOS's memory management, which often blocks webassembly memory growth.

Although it's not recommended, this can be overridden using `WasmSDKLoadSettings.initialMemory`.

### Other fixes:
- Fixed an issue where certain iOS devices would display a zoomed in preview.
- Improved scanning of Bolivia IDs by addressing cases where the expiration date is covered by a signature, allowing the completion of the scanning process.

## 2.7.0

### Platform-related SDK changes

-   Added new `fallbackAnonymization` property to `AnonymizationSettings`. If `true`, anonymization is applied on all fields of the image if extraction is uncertain.

### Improvements

-   Improved support for diverse credit card designs.
-   Improved anonymization performance.
-   The SDK can now be used with the `wasm-unsafe-eval` content security policy.

### Bugfixes

-   We've fixed a problem with camera focus on iPhone devices that use iOS 16 or newer, most notably iPhone 14.
-   We've fixed a bug with CSS `::part()` pseudo-selector to enable safe CSS customization of nested elements like `mb-camera-toolbar`.

### Optimizing camera usage

-   We are now preventing aborting the scanning process when using the UI component until the camera is not being fully initialized due to potential issues with reusing the camera's resources.

### Environment changes

-   We've updated environment to Node v16.3.0.

## 2.6.1

-   We've fixed a problem that has caused the enormous size of WebAssembly bundles.

## 2.6.0

### Improvements

-   We've added support for 1000+ new credit card types.
-   We've decreased wrong PAN field processing by 30% for horizontal credit cards, and by 60% for vertical credit cards.
-   We've improved the Anonymization functionality for Quick Read formats on VISA credit cards, as well as general improvements for all other credit card types.

### Platform-related SDK changes

-   **[BREAKING CHANGE]** Due to security reasons, we've added a mechanism to load worker script from an external location.
    -   New property `WasmSDKLoadSettings.workerLocation` was added for this purpose and represents a path to the external worker script file.
    -   If omitted, SDK will look for the worker script in the `resources` directory.

### UI Improvements

-   We've added property `recognitionPauseTimeout` to the UI component that defines scanning pause after the first side of a document has been scanned.
    -   The purpose of this property is to give the end-user enough time to flip the document before scanning is resumed.
    -   Default value is `3800` and represents time in milliseconds.
-   We've exposed property `cameraExperienceStateDurations` on the UI component that can be used to change the default durations of UI animations.

## 2.4.3

-   We've updated Microblink logo and colors

## 2.4.2

### Platform-related SDK changes

-   We've added methods for programmatically starting camera and image scan when using the UI component.
    -   It's possible to call `startCameraScan()` and `startImageScan(File)` methods on the custom web element.
-   We've standardized error structures returned from the WebAssembly library and the UI component.
    -   See [SDKError.ts](src/MicroblinkSDK/SDKError.ts) and [ErrorTypes.ts](src/MicroblinkSDK/ErrorTypes.ts) for a complete list of possible error codes.
-   We've completed support for `part::` selector and added [an example](ui/README.md#customization-ui-css-part).
-   We've simplified integration of the UI component with Angular and React frameworks.
    -   [Integration guide for Angular](ui/README.md#installation-angular)
    -   [Integration guide for React](ui/README.md#installation-react)

### Bug fixes

-   We've ensured that all SDK errors can be visible from `fatalError` and `scanError` events in the UI component.
-   We've fixed a bug where a user couldn't upload an image after the camera scan failed to start.
-   We've fixed a bug where the video feed wasn't released in the scenario where the UI component was removed from the DOM.
-   We've improved memory management during the initialization of the UI component to avoid the creation of unnecessary web workers.

## 2.4.1

### Platform-related SDK changes

-   We've added a camera management UI module for the selection of connected cameras
    -   We've added `VideoRecognizer.changeCameraDevice` method that can be used to change the active camera device during the scanning session
-   We've improved accessibility of the UI component by changing background contrasts and increasing default font sizes

### Bug fixes

-   We've optimised memory usage of the SDK by fixing a problem where every refresh of the UI component would result in a new instance of web worker
-   We've fixed a bug where a user couldn't upload an image after the camera scan failed to start
-   We've fixed a bug where the video feed wasn't released in the scenario where the UI component was removed from the DOM
-   We've improved memory management during the initialization of the UI component to avoid the creation of unnecessary web workers

## 2.4.0

### New features

-   From now on, BlinkCard reads and extracts the expiry date in MM/YYYY format.

### Platform-related SDK changes

-   We've improved the performance of the SDK by adding support for WebAssembly SIMD.
    -   This increases the scanning performance on compatible browsers up to 77% and up to 94% in cases when WebAssembly threads are also supported.
    -   Keep in mind that this feature requires a compatible browser. Only `advanced` and `advanced-threads` binaries are using SIMD. In case that the browser doesn't support this feature, `basic` binary will be used.
-   We've reduced the memory fragmentation during video processing, resulting in a smaller memory footprint.

## 2.3.0

### New features

-   We've added support for vertical payment cards.
-   As of this release, BlinkCard supports the Visa Quick Read format (the one where the card number spans through four lines).
-   We've changed the threshold for "Camera too far" and "Camera too near" callbacks. From now on, the card needs to be closer to the camera.

### SDK changes

-   We've added a mechanism to automatically delete an instance of worker script in case of unsuccessful SDK initialization.
    -   New method `WasmSDK.delete()` was added for this purpose and is available on every instance of the SDK.
-   We've changed improper error handling in the `VideoRecognizer` class.
    -   From now on, it's possible to catch all errors that happen during the video recognition.

## 2.2.2

### SDK changes

-   We've exposed a couple of functions that are used by the SDK to determine which WebAssembly bundle to load and from which location
    -   Function `detectWasmType()` returns the best possible WebAssembly bundle based on the features a browser supports.
    -   Function `wasmFolder( WasmType )` returns the name of the resources subfolder of the provided WebAssembly bundle type.
    -   For more information on how to implement these functions, see [`WasmLoadUtils.ts`](src/MicroblinkSDK/WasmLoadUtils.ts) file.

### Bugfixes

-   Container width size on UI component for action label (`Scan or choose from gallery`) and action buttons (`Device camera` and `From gallery`) are now responsive on Safari.

## 2.2.1

-   We've fixed a broken `rollup.config.js` which resulted in unusable UMD development bundle

## 2.2.0

### Breaking changes

-   We've changed the way how recognizer options are set up when using the UI component
    -   You can now specify how a recognizer should behave by using the new `recognizerOptions` property.
    -   To see the full list of available recognizer options, as well as examples on how to use them, check out the [relevant source code](ui/src/components/blinkcard-in-browser/blinkcard-in-browser.tsx).

### Changes to the BlinkCardRecognizer

-   We've added support for even more horizontal card layouts
-   We've added anonymization options for string and image results:
    -   You can now hide the following fields:
        -   Card number
        -   Card number prefix
        -   CVV
        -   Owner
        -   IBAN
    -   Choose the `AnonymizationMode` for each field:
        -   `None`
        -   `ImageOnly` - Black boxes will cover chosen data
        -   `ResultFieldsOnly` - String data will be redacted from the result, images are not anonymized
        -   `FullResult` - Both images and string data will be anonymized
    -   Card number has further anonymization options available through `CardNumberAnonymizationSettings`:
        -   `prefixDigitsVisible` - Defines how many digits at the beginning of the card number remain visible after anonymization
        -   `suffixDigitsVisible` - Defines how many digits at the end of the card number remain visible after anonymization

### Performance improvements

-   We've added three different flavors of WebAssembly builds to the SDK, to provide better performance across all browsers
    -   Unless defined otherwise, the SDK will load the best possible bundle during initialization:
        -   `Basic` Same as the existing WebAssembly build, most compatible, but least performant.
        -   `Advanced` WebAssembly build that provides better performance but requires a browser with advanced features.
        -   `AdvancedWithThreads` Most performant WebAssembly build which requires a proper setup of COOP and COEP headers on the server-side.
    -   For more information about different WebAssembly builds and how to use them properly, check out the [relevant section](README.md/#deploymentGuidelines) in our official documentation

### SDK changes

-   Constructor of `VideoRecognizer` class is now public

### Bugfixes

-   We fixed the initialization problem that prevented the SDK from loading on iOS 13 and older versions

## 2.0.0

-   Initial release of the BlinkCard In-browser SDK
-   Supported recognizers:
    -   BlinkCard recognizer specialized for scanning various credit or payment cards.
