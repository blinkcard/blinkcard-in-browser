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

    blinkCard.licenseKey = "sRwAAAYJbG9jYWxob3N0r/lOPmg/w35CpOHWKCo4YL/KpeOpvHscDeDQC9klS88t+s6XvuLJ1in7UWQPRwJpdtaEuhUOzQ2i/skQVYj8AfzYyHulgyTqCDjPFbhDdYG/TrTkkCxcy3OOpqHJG7PjUZVF0113BftYk/gGpaJSGtK9BmraX9d83L4CkdZwGK9jOHEQ+Skn11cdf3QIyxePnpG/wKNRSKilJXGgFFz1+oDVzjcbLZmDG3/LoPqpfQ==";
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
