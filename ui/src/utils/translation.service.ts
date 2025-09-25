/**
 * Copyright (c) Microblink Ltd. All rights reserved.
 */

/* eslint-disable max-len */
export const defaultTranslations: { [key: string]: string|Array<string> } = {
    /* Help Screens */
    "help-button-lobby-tooltip": "Need help?",
    "help-button-back": "Back",
    "help-button-next": "Next",
    "help-button-done": "Done",
    "help-button-start-scanning": "Start Scanning",
    "help-doc-valid-title": "Scan the card number first",
    "help-doc-valid-description": "Card number is usually a 16-digit number. It should be either printed or embossed in raised numbers across the card. Make sure that the card is well lit and all details are visible.",
    "help-doc-valid-card-number-field-title": "Where's the card number?",
    "help-doc-valid-card-number-field-description": "Card number is usually a 16-digit number, although it may have between 12 and 19 digits. It should be either printed or embossed in raised numbers across the card. It can be on the front or back of your card.",
    "help-doc-invalid-invisible-fields-title": "Keep all the details visible",
    "help-doc-invalid-invisible-fields-description": "Make sure you aren’t covering parts of the card with a finger, including the bottom lines. Also, watch out for hologram reflections that go over the cards' fields.",
    "help-doc-invalid-harsh-light-title": "Watch out for harsh light",
    "help-doc-invalid-harsh-light-description": "Avoid direct harsh light because it reflects from the card and can make parts of the card unreadable. If you can't read data on the card, it won't be visible to the camera either.",
    "help-doc-invalid-to-much-motion-title": "Keep still while scanning",
    "help-doc-invalid-to-much-motion-description": "Try to keep the phone and card still while scanning. Moving either can blur the image and make data on the card unreadable.",

    "action-alt-camera": "Device camera",
    "action-alt-gallery": "From gallery",
    "action-message": "Scan or choose from gallery",
    "action-message-camera": "Device camera",
    "action-message-camera-disabled": "Camera disabled",
    "action-message-camera-not-allowed": "Camera not allowed",
    "action-message-camera-in-use": "Camera in use",
    "action-message-image": "From gallery",
    "action-message-image-not-supported": "Not supported",
    "camera-disabled": "Camera disabled",
    "camera-not-allowed": "Cannot access camera.",
    "camera-in-use": "Camera is already used by another application.",
    "camera-generic-error": "Cannot access camera.",
    "camera-feedback-scan-front": "Scan the card number",
    "camera-feedback-scan-back": "Scan the other side of the card",
    "camera-feedback-flip": "Flip to the back side",
    "camera-feedback-barcode-message": "Scan the barcode",
    "camera-feedback-move-farther": "Move farther",
    "camera-feedback-move-closer": "Move closer",
    "camera-feedback-adjust-angle": "Keep card parallel to screen",
    "camera-feedback-wrong-side": "Flip the card over",
    "drop-info": "Drop image here",
    "drop-error": "Whoops, we don't support that image format. Please upload a JPEG or PNG file.",
    "initialization-error": "Failed to load component. Try using another device or update your browser.",
    "process-image-box-first": "Card number side",
    "process-image-box-second": "Other side",
    "process-image-box-add": "Add image",
    "process-image-upload-cta": "Upload",
    "process-image-message": "Just a moment.",
    "process-image-message-inline": "Processing",
    "process-image-message-inline-done": "Processing done",
    "process-api-message": "Just a moment",
    "process-api-retry": "Retry",
    "feedback-scan-unsuccessful-title": "Scan unsuccessful",
    "feedback-scan-unsuccessful": "We weren't able to recognize your document. Please try again.",
    "feedback-error-generic": "Whoops, that didn't work. Please give it another go.",
    "check-internet-connection": "Check internet connection.",
    "network-error": "Network error.",
    "scanning-not-available": "Scanning not available.",
    "modal-window-close": "Close",
};
/* eslint-enable max-len */

export class TranslationService
{
    public translations: { [key: string]: string|Array<string> };

    constructor( alternativeTranslations?: { [key: string]: string|Array<string> } )
    {
        this.translations = defaultTranslations;

        for ( const key in alternativeTranslations )
        {
            if ( key in defaultTranslations )
            {
                if ( this.isExpectedValue( alternativeTranslations[key] ) )
                {
                    this.translations[key] = alternativeTranslations[key];
                }
            }
        }
    }

    public i( key: string ): string|Array<string>
    {
        if ( this.translations[key] )
        {
            if ( Array.isArray( this.translations[key] ) )
            {
                return JSON.parse( JSON.stringify( this.translations[key] ) );
            }
            return this.translations[key];
        }
    }

    private isExpectedValue( value: string | Array<string> ): boolean
    {
        if ( Array.isArray( value ) )
        {
            const notValidFound = value.filter( item => typeof item !== "string" );
            return notValidFound.length == 0;
        }
        return typeof value === "string";
    }
}
