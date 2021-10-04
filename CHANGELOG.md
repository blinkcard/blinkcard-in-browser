# Release notes

## 2.4.1

### Platform-related SDK changes

* We've added a camera management UI module for the selection of connected cameras
    * We've added `VideoRecognizer.changeCameraDevice` method that can be used to change the active camera device during the scanning session
* We've improved accessibility of the UI component by changing background contrasts and increasing default font sizes

### Bug fixes

* We've optimised memory usage of the SDK by fixing a problem where every refresh of the UI component would result in a new instance of web worker

## 2.4.0

### New features

* From now on, BlinkCard reads and extracts the expiry date in MM/YYYY format.

### Platform-related SDK changes

* We've improved the performance of the SDK by adding support for WebAssembly SIMD.
    * This increases the scanning performance on compatible browsers up to 77% and up to 94% in cases when WebAssembly threads are also supported.
    * Keep in mind that this feature requires a compatible browser. Only `advanced` and `advanced-threads` binaries are using SIMD. In case that the browser doesn't support this feature, `basic` binary will be used.
* We've reduced the memory fragmentation during video processing, resulting in a smaller memory footprint.

## 2.3.0

### New features

* We've added support for vertical payment cards.
* As of this release, BlinkCard supports the Visa Quick Read format (the one where the card number spans through four lines).
* We've changed the threshold for "Camera too far" and "Camera too near" callbacks. From now on, the card needs to be closer to the camera.

### SDK changes

* We've added a mechanism to automatically delete an instance of worker script in case of unsuccessful SDK initialization.
    * New method `WasmSDK.delete()` was added for this purpose and is available on every instance of the SDK.
* We've changed improper error handling in the `VideoRecognizer` class.
    * From now on, it's possible to catch all errors that happen during the video recognition.

## 2.2.2

### SDK changes

* We've exposed a couple of functions that are used by the SDK to determine which WebAssembly bundle to load and from which location
    * Function `detectWasmType()` returns the best possible WebAssembly bundle based on the features a browser supports.
    * Function `wasmFolder( WasmType )` returns the name of the resources subfolder of the provided WebAssembly bundle type.
    * For more information on how to implement these functions, see [`WasmLoadUtils.ts`](src/MicroblinkSDK/WasmLoadUtils.ts) file.

### Bugfixes

* Container width size on UI component for action label (`Scan or choose from gallery`) and action buttons (`Device camera` and `From gallery`) are now responsive on Safari.

## 2.2.1

* We've fixed a broken `rollup.config.js` which resulted in unusable UMD development bundle

## 2.2.0

### Breaking changes

* We've changed the way how recognizer options are set up when using the UI component
    * You can now specify how a recognizer should behave by using the new `recognizerOptions` property.
    * To see the full list of available recognizer options, as well as examples on how to use them, check out the [relevant source code](ui/src/components/blinkcard-in-browser/blinkcard-in-browser.tsx).

### Changes to the BlinkCardRecognizer

* We've added support for even more horizontal card layouts
* We've added anonymization options for string and image results:
    * You can now hide the following fields:
        * Card number
        * Card number prefix
        * CVV
        * Owner
        * IBAN
    * Choose the `AnonymizationMode` for each field:
        * `None`
        * `ImageOnly` - Black boxes will cover chosen data
        * `ResultFieldsOnly` - String data will be redacted from the result, images are not anonymized
        * `FullResult` - Both images and string data will be anonymized
    * Card number has further anonymization options available through `CardNumberAnonymizationSettings`:
        * `prefixDigitsVisible` - Defines how many digits at the beginning of the card number remain visible after anonymization
        * `suffixDigitsVisible` - Defines how many digits at the end of the card number remain visible after anonymization

### Performance improvements

* We've added three different flavors of WebAssembly builds to the SDK, to provide better performance across all browsers
    * Unless defined otherwise, the SDK will load the best possible bundle during initialization:
        * `Basic` Same as the existing WebAssembly build, most compatible, but least performant.
        * `Advanced` WebAssembly build that provides better performance but requires a browser with advanced features.
        * `AdvancedWithThreads` Most performant WebAssembly build which requires a proper setup of COOP and COEP headers on the server-side.
    * For more information about different WebAssembly builds and how to use them properly, check out the [relevant section](README.md/#deploymentGuidelines) in our official documentation

### SDK changes

* Constructor of `VideoRecognizer` class is now public

### Bugfixes

* We fixed the initialization problem that prevented the SDK from loading on iOS 13 and older versions

## 2.0.0

* Initial release of the BlinkCard In-browser SDK
* Supported recognizers:
    * BlinkCard recognizer specialized for scanning various credit or payment cards.
