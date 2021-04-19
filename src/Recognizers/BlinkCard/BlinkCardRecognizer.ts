/**
 * Copyright (c) Microblink Ltd. All rights reserved.
 */

import
{
    ExtensionFactors,
    FullDocumentImageOptions,
    ImageResult,
    validateDpi
} from "../BlinkID/ImageOptions";

import
{
    DigitalSignature,
    DigitalSignatureOptions,
    MBDate,
    Recognizer,
    RecognizerResult,
    RecognizerSettings,
    WasmSDK
} from "../../MicroblinkSDK/DataStructures";

/**
 * Determines which data is anonymized in the returned recognizer result
 */
export enum AnonymizationMode
{
    /** No anonymization is performed in this mode. */
    None = 0,

    /**
     * Sensitive data in the document image is anonymized with black boxes covering selected sensitive data. Data
     * returned in result fields is not changed.
     */
    ImageOnly,

    /** Document image is not changed. Data returned in result fields is redacted. */
    ResultFieldsOnly,

    /**
     * Sensitive data in the image is anonymized with black boxes covering selected sensitive data. Data returned in
     * result fields is redacted.
     */
    FullResult,

    /** Number of possible anonymization modes. */
    Count
}

/**
 * Holds the settings which control card number anonymization.
 */
export class CardNumberAnonymizationSettings
{
    /** Defines the mode of card number anonymization. */
    mode: AnonymizationMode = AnonymizationMode.None;

    /** Defines how many digits at the beginning of the card number remain visible after anonymization. */
    prefixDigitsVisible = 0;

    /** Defines how many digits at the end of the card number remain visible after anonymization. */
    suffixDigitsVisible = 0;
}

export class AnonymizationSettings
{
    /** Defines the parameters of card number anonymization. */
    cardNumberAnonymizationSettings = new CardNumberAnonymizationSettings();

    /** Defines the mode of card number prefix anonymization. */
    cardNumberPrefixAnonymizationMode = AnonymizationMode.None;

    /** Defines the mode of CVV anonymization. */
    cvvAnonymizationMode              = AnonymizationMode.None;

    /** Defines the mode of IBAN anonymization. */
    ibanAnonymizationMode             = AnonymizationMode.None;

    /** Defines the mode of owner anonymization. */
    ownerAnonymizationMode            = AnonymizationMode.None;
}

/**
 * A settings object that is used for configuring the BlinkCardRecognizer.
 */
export class BlinkCardRecognizerSettings implements DigitalSignatureOptions,
                                                    FullDocumentImageOptions,
                                                    RecognizerSettings
{
    /**
     * Whether blured frames filtering is allowed
     */
    allowBlurFilter = true;

    /** Whether sensitive data should be redacted from the result */
    anonymizationSettings = new AnonymizationSettings();

    /**
     * Padding is a minimum distance from the edge of the frame and is defined
     * as a percentage of the frame width. Default value is 0.0f and in that case
     * padding edge and image edge are the same.
     * If padding edge is needed, recommended value is 0.02f.
     */
    paddingEdge = 0.0;

    // implementation od the DigitalSignatureOptions interface
    allowSignature = false;

    // Whether to return CVV in recognizer results
    extractCvv = true;

    // Whether to return expiry date in recognizer results
    extractExpiryDate = true;

    // Whether to return IBAN in recognizer results
    extractIban = true;

    // Whether to return owner in recognizer results
    extractOwner = true;

    // implementation of the FullDocumentImageOptions interface
    returnFullDocumentImage        = false;

    returnEncodedFullDocumentImage = false;

    private _fullDocumentImageDpi  = 250;

    get fullDocumentImageDpi(): number { return this._fullDocumentImageDpi; }

    set fullDocumentImageDpi( value: number )
    {
        validateDpi( value );
        this._fullDocumentImageDpi = value;
    }

    fullDocumentImageExtensionFactors = new ExtensionFactors();
}

/**
 * The result of image recognition when using the BlinkCardRecognizer.
 */
export interface BlinkCardRecognizerResult extends RecognizerResult
{
    /**
     *  The payment card number.
     */
    readonly cardNumber: string;

    /**
     *  The payment card number prefix.
     */
    readonly cardNumberPrefix: string;

    /**
     *  The payment card number.
     */
    readonly cardNumberValid: boolean;

    /**
     *  Payment card's security code/value.
     */
    readonly cvv: string;

    /**
     *  Digital signature of the result.
     */
    readonly digitalSignature: DigitalSignature;

    /**
     *  The payment card's expiry date.
     */
    readonly expiryDate: MBDate;

    /**
     *  Wheater the first scanned side is blurred.
     */
    readonly firstSideBlurred: boolean;

    /**
     *  Full image of the payment card from first side recognition.
     */
    readonly firstSideFullDocumentImage: ImageResult;

    /**
     *  Payment card's IBAN.
     */
    readonly iban: string;

    /**
     *  Payment card's issuing network
     */
    readonly issuer: CardIssuer;

    /**
     *  Information about the payment card owner.
     */
    readonly owner: string;

    /**
     *  Status of the last recognition process.
     */
    readonly processingStatus: ProcessingStatus;

    /**
     *  Whether the scanning of the first side is finished.
     */
    readonly scanningFirstSideDone: boolean;

    /**
     *  Wheater the second scanned side is blurred.
     */
    readonly secondSideBlurred: boolean;

    /**
     *  Full image of the payment card from second side recognition.
     */
    readonly secondSideFullDocumentImage: ImageResult;
}

/**
 * The Blink Card Recognizer is used for scanning Blink Card.
 */
export interface BlinkCardRecognizer extends Recognizer
{
    /** Returns the currently applied BlinkCardRecognizerSettings. */
    currentSettings(): Promise< BlinkCardRecognizerSettings >

    /** Applies new settings to the recognizer. */
    updateSettings( newSettings: BlinkCardRecognizerSettings ): Promise< void >;

    /** Returns the current result of the recognition. */
    getResult(): Promise< BlinkCardRecognizerResult >;
}

/**
 * This function is used to create a new instance of `BlinkCardRecognizer`.
 * @param wasmSDK Instance of WasmSDK which will be used to communicate with the WebAssembly module.
 */
export async function createBlinkCardRecognizer( wasmSDK: WasmSDK ): Promise< BlinkCardRecognizer >
{
    return wasmSDK.mbWasmModule.newRecognizer( "BlinkCardRecognizer" ) as Promise< BlinkCardRecognizer >;
}

/**
 * Payment Card Issuer defines supported issuing institutions that issued the card to the card holder.
 */
export enum CardIssuer
{
    /* Unidentified Card */
    Other = 0,

    /* The American Express Company Card */
    AmericanExpress,

    /* China UnionPay Card */
    ChinaUnionPay,

    /* Diners Club International Card */
    Diners,

    /* Discover Card */
    DiscoverCard,

    /*  Elo card association */
    Elo,

    /* The JCB Company Card */
    Jcb,

    /* Maestro Debit Card */
    Maestro,

    /* Mastercard Inc. Card */
    Mastercard,

    /* RuPay */
    RuPay,

    /* Interswitch Verve Card */
    Verve,

    /* Visa Inc. Card */
    Visa,

    /* V Pay */
    VPay,

    /* Enum count */
    Count
}

/**
 * Detailed information about the recognition process.
 */
export enum ProcessingStatus
{
    /** Recognition was successful. */
    Success = 0,

    /** Detection of the document failed. */
    DetectionFailed,

    /** Preprocessing of the input image has failed. */
    ImagePreprocessingFailed,

    /** Recognizer has inconsistent results. */
    StabilityTestFailed,

    /** Wrong side of the document has been scanned. */
    ScanningWrongSide,

    /** Identification of the fields present on the card has failed. */
    FieldIdentificationFailed,

    /** Failed to return a requested image. */
    ImageReturnFailed,

    /** Payment card currently not supported by the recognizer. */
    UnsupportedCard,

    /** Number of possible processing statuses. */
    Count
}
