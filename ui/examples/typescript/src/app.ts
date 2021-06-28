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

    blinkCard.licenseKey = "sRwAAAYJbG9jYWxob3N0r/lOPmg/w35CpOFWK6UdzXulq6YisydKaKVq0SyX+QmUrMt5U0ioHlFOctsTlLUs59rsm1j4M3XFuTLZk8lpEFbSVjYNjj+nCYO5mUkXc3BfIUfMXsxSwFTQIvDyWWW/L2OZBNjkXF1YEw2ru2XmhP8WIU23T2x3CnES0jJGXV5AV1sB7ttGCshTqCLONcYotsCe8heZtArivnKoQQ91WO+NC1njpGJCTyT9ASR3CA==";
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
