/**
 * Copyright (c) Microblink Ltd. All rights reserved.
 */

// Import typings for UI component
import "@microblink/blinkcard-in-browser-sdk/ui";

// Import typings for custom events
import { SDKError, EventScanError, EventScanSuccess } from "@microblink/blinkcard-in-browser-sdk/ui/dist/types/utils/data-structures";
function initializeUiComponent() {
    const blinkCard = document.querySelector("blinkcard-in-browser") as HTMLBlinkcardInBrowserElement;
    if (!blinkCard) {
        throw "Could not find UI component!";
    }
    blinkCard.licenseKey = "sRwAAAYJbG9jYWxob3N0r/lOPmg/w35CpOHWKeIcyUSz8fDN+kpZwh39JTAYyAQ+7adUFfgptY2QPtEII9rfosGVKtbC/pMs5g8QQIzFmx0voaH4qjuMs7p/Pdnoi7kqPYB6QL9cRIsBMfqJOJmf9jTsUQtHdubYz8Sv3PEoul18uBorUMM86Bw7tFLEcDjfp8xOXM1fuNfgDVG2BvK/UwpVc4k8a3SiQLXgDUU0ItaNXo7yY9au8ZX/R6yDOfbXRw==";
    blinkCard.engineLocation = window.location.origin;
    blinkCard.workerLocation = window.location.origin + "/BlinkCardWasmSDK.worker.min.js";
    blinkCard.recognizers = ["BlinkCardRecognizer"];
    blinkCard.addEventListener("fatalError", (ev: CustomEventInit<SDKError>) => {
        const fatalError = ev.detail;
        console.log("Could not load UI component", fatalError);
    });
    blinkCard.addEventListener("scanError", (ev: CustomEventInit<EventScanError>) => {
        const scanError = ev.detail;
        console.log("Could not scan a document", scanError);
    });
    blinkCard.addEventListener("scanSuccess", (ev: CustomEventInit<EventScanSuccess>) => {
        const scanResults = ev.detail;
        console.log("Scan results", scanResults);
    });
}

window.addEventListener("DOMContentLoaded", () => initializeUiComponent());
