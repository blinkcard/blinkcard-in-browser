# Release notes

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
