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

    blinkCard.licenseKey = "sRwAAAYJbG9jYWxob3N0r/lOPmg/w35CpOHWKwIXzajXdIY8LZ3Xy3hpLADHpkhWoRQfYyVnGMcsmLJnWHQElSsn+Gu7LKMfxAir0jKn9o0iOqm5V5GeWzaUpo01ebA8gEcsxAV93tUmMUQo8jJc3NVdcrvJCSeMV6Ucqp8UqJus8sXr6hkj0hrp7PYFQjspwV3RVIePsOw0ms14Q+E8J+VSqnETgtJ9kNnT8F0cLnwV27AAYJAkbfDkMPtJEw==";
    blinkCard.engineLocation = window.location.origin;
    blinkCard.recognizers = [ "BlinkCardRecognizer" ];

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
