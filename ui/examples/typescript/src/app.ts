/**
 * Copyright (c) Microblink Ltd. All rights reserved.
 */

// Import typings for UI component
import "@microblink/blinkcard-in-browser-sdk/ui";

// Import typings for custom events
import
{
    EventFatalError,
    EventScanError,
    EventScanSuccess
} from "@microblink/blinkcard-in-browser-sdk/ui/dist/types/utils/data-structures";

function initializeUiComponent()
{
    const blinkCard = document.querySelector( "blinkcard-in-browser" ) as HTMLBlinkcardInBrowserElement;

    if ( !blinkCard )
    {
        throw "Could not find UI component!";
    }

    blinkCard.licenseKey = "sRwAAAYJbG9jYWxob3N0r/lOPmg/w35CpOHWKrE6YH5ih33s/TJkODw0u0DaeG+uUSHj28ftv86lELB6BU+CiM7ZoW1Tqw1VgaEho8ywZiMgTrMdxX/f+z8my6mMI3hK/RAIws6/5x48RGEcboN4uDYr6b1yIsPfgnfXVJGBSIZdsquKvWb3yuNGztL7MoQGQxc27YBYnuwAfxWQyoTv2ka8ZzZFKlnMxhUaQxq5WSKCCVAK5+0J1ByofyQSkw==";
    blinkCard.engineLocation = window.location.origin;
    blinkCard.recognizers = [ "BlinkCardRecognizer" ];
    blinkCard.translations = {
        'camera-feedback-scan-front': 'Scan the card number',
        'camera-feedback-scan-back': 'Scan the card number',
        'camera-feedback-flip': 'Flip the card over'
    };

    blinkCard.addEventListener( "fatalError", ( ev: CustomEventInit< EventFatalError > ) =>
    {
        const fatalError = ev.detail;
        console.log( "Could not load UI component", fatalError );
    });

    blinkCard.addEventListener( "scanError", ( ev: CustomEventInit< EventScanError > ) =>
    {
        const scanError = ev.detail;
        console.log( "Could not scan a document", scanError );
    });

    blinkCard.addEventListener( "scanSuccess", ( ev: CustomEventInit< EventScanSuccess > ) =>
    {
        const scanResults = ev.detail;
        console.log( "Scan results", scanResults );
    });
}

window.addEventListener( "DOMContentLoaded", () => initializeUiComponent() );
