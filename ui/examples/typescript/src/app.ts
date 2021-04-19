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

    blinkCard.licenseKey = "sRwAAAYJbG9jYWxob3N0r/lOPmg/w35CpOHWLDI9YLXwiRy2l6Ayy4V1ZcZCsKoaN9wbtrTbapJQTRn/9EaFA40fn9ylJpvRVejCXlO0xXOGLnkGhIoZuuzpKzyGveyAPze5J9Ot+YNQdLLadBjQMwjdMflzz1v94FCLcDZQ55+B23TT/JrZ5jjUVEMwoR+tXh3puQPIEAsVPcE1sa8pSmE8UbaPyXqkQx0vRsljLEcAITPYl/ii7kEd2BKMUA==";
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
