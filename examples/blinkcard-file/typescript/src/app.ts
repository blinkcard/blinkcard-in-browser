/**
 * Copyright (c) Microblink Ltd. All rights reserved.
 *
 * BlinkCard In-browser SDK demo app which demonstrates how to:
 *
 * - Change default SDK settings
 * - Scan payment cards
 */
import * as BlinkCardSDK from "@microblink/blinkcard-in-browser-sdk";

// General UI helpers
const initialMessageEl = document.getElementById("msg") as HTMLHeadingElement;
const progressEl = document.getElementById("load-progress") as HTMLProgressElement;

// UI elements for scanning feedback
const scanImageElement = document.getElementById("target-image") as HTMLImageElement;
const inputImageFileFrontSide = document.getElementById("image-file-front-side") as HTMLInputElement;
const inputImageFileBackSide = document.getElementById("image-file-back-side") as HTMLInputElement;

/**
 * Initialize and load WASM SDK.
 */
function main() {

    // Check if browser has proper support for WebAssembly
    if (!BlinkCardSDK.isBrowserSupported()) {
        initialMessageEl.innerText = "This browser is not supported!";
        return;
    }

    // 1. It's possible to obtain a free trial license key on microblink.com
    const licenseKey = "sRwAAAYJbG9jYWxob3N0r/lOPmg/w35CpOFWKHI7ZwemvnngIM3BrXc+ddpu1yLxCEf1wh5Zirs10MaPFe2kgsWG/Gnx1W2j1ff6x/OCa2eUBoCJLIdzKoDYHG7Xz34Beji0zm0c0fhAtHz0mPdswISNY4g9GgpNG8LHldMZs48/nMoTQ79qkKj9R7AIvVG8wvRsJhzdoyDzHTMr88QXRtTy6QKHQZWAbfSeDa8yJRqu2nQDPeiYgkQLoTxO5fc88g==";

    // 2. Create instance of SDK load settings with your license key
    const loadSettings = new BlinkCardSDK.WasmSDKLoadSettings(licenseKey);

    // [OPTIONAL] Change default settings

    // Show or hide hello message in browser console when WASM is successfully loaded
    loadSettings.allowHelloMessage = true;

    // In order to provide better UX, display progress bar while loading the SDK
    loadSettings.loadProgressCallback = (progress: number) => (progressEl!.value = progress);

    // Set absolute location of the engine, i.e. WASM and support JS files
    loadSettings.engineLocation = window.location.origin;

    // Set absolute location of the worker file
    loadSettings.workerLocation =
        window.location.origin + "/BlinkCardWasmSDK.worker.min.js";

    // 3. Load SDK
    BlinkCardSDK.loadWasmModule(loadSettings).then((sdk: BlinkCardSDK.WasmSDK) => {
        document.getElementById("screen-initial")?.classList.add("hidden");
        document.getElementById("screen-start")?.classList.remove("hidden");
        document
            .getElementById("start-button")
            ?.addEventListener("click", (ev) => {
            ev.preventDefault();
            startScan(sdk);
        });
    }, (error: any) => {
        initialMessageEl.innerText = "Failed to load SDK!";
        console.error("Failed to load SDK!", error);
    });
}

/**
 * Scan payment card.
 */
async function startScan(sdk: BlinkCardSDK.WasmSDK) {
    document.getElementById("screen-start")?.classList.add("hidden");
    document.getElementById("screen-scanning")?.classList.remove("hidden");

    // 1. Create a recognizer objects which will be used to recognize single image or stream of images.
    //

    // In this example, we create a BlinkCardRecognizer, which knows how to scan Payment cards

    // and extract payment information from them.
    const blinkCardRecognizer = await BlinkCardSDK.createBlinkCardRecognizer(sdk);

    // 2. Create a RecognizerRunner object which orchestrates the recognition with one or more

    //    recognizer objects.
    const recognizerRunner = await BlinkCardSDK.createRecognizerRunner(

    // SDK instance to use
    sdk, 

    // List of recognizer objects that will be associated with created RecognizerRunner object
    [blinkCardRecognizer], 

    // [OPTIONAL] Should recognition pipeline stop as soon as first recognizer in chain finished recognition
    false);

    // 3. Prepare front side image for scan action - keep in mind that SDK can only process images represented

    //    in internal CapturedFrame data structure. Therefore, auxiliary method "captureFrame" is provided.

    // Make sure that image file is provided
    const fileFrontSide = getImageFromInput(inputImageFileFrontSide.files);
    if (!fileFrontSide) {
        alert("No image files provided!");

        // Release memory on WebAssembly heap used by the RecognizerRunner
        recognizerRunner?.delete();

        // Release memory on WebAssembly heap used by the recognizer
        blinkCardRecognizer?.delete();
        inputImageFileFrontSide.value = "";
        return;
    }
    const imageFrame = await getImageFrame(fileFrontSide);

    // 4. Start the recognition and await for the results
    const processResultFrontSide = await recognizerRunner.processImage(imageFrame);

    // 5. If recognition of the first side was successful, process the back side
    if (processResultFrontSide !== BlinkCardSDK.RecognizerResultState.Empty) {

        // 6. Prepare back side image for scan action
        const fileBackSide = getImageFromInput(inputImageFileBackSide.files);
        if (!fileBackSide) {
            alert("No image files provided!");

            // Release memory on WebAssembly heap used by the RecognizerRunner
            recognizerRunner?.delete();

            // Release memory on WebAssembly heap used by the recognizer
            blinkCardRecognizer?.delete();
            inputImageFileBackSide.value = "";
            return;
        }
        const imageFrame = await getImageFrame(fileBackSide);

        // 7. Start the recognition and await for the results
        const processResultBackSide = await recognizerRunner.processImage(imageFrame);
        if (processResultBackSide !== BlinkCardSDK.RecognizerResultState.Empty) {

            // 8. If recognition of the back side was successful, obtain the result and display it
            const results = await blinkCardRecognizer.getResult();
            if (results.state !== BlinkCardSDK.RecognizerResultState.Empty) {
                console.log("BlinkCard results", results);
                const firstAndLastName = results.owner;
                const cardNumber = results.cardNumber;
                const dateOfExpiry = {
                    year: results.expiryDate.year,
                    month: results.expiryDate.month,
                };
                alert(`Hello, ${firstAndLastName}!\n Your payment card with card number ${cardNumber} will expire on ${dateOfExpiry.year}/${dateOfExpiry.month}.`);
            }
        }
        else {
            alert("Could not extract information from the back side of a document!");
        }
    }
    else {
        alert("Could not extract information from the front side of a document!");
    }

    // 7. Release all resources allocated on the WebAssembly heap and associated with camera stream

    // Release memory on WebAssembly heap used by the RecognizerRunner
    recognizerRunner?.delete();

    // Release memory on WebAssembly heap used by the recognizer
    blinkCardRecognizer?.delete();

    // Hide scanning screen and show scan button again
    inputImageFileFrontSide.value = "";
    inputImageFileBackSide.value = "";
    document.getElementById("screen-start")?.classList.remove("hidden");
    document.getElementById("screen-scanning")?.classList.add("hidden");
}

function getImageFromInput(fileList: FileList | null): File | null {
    if (fileList === null) {
        return null;
    }
    let image = null;
    const imageRegex = RegExp(/^image\//);
    for (let i = 0; i < fileList.length; ++i) {
        if (imageRegex.exec(fileList[i].type)) {
            image = fileList[i];
        }
    }
    return image;
}

async function getImageFrame(file: File): Promise<BlinkCardSDK.CapturedFrame> {
    scanImageElement.src = URL.createObjectURL(file);
    await scanImageElement.decode();
    return BlinkCardSDK.captureFrame(scanImageElement);
}

// Run
main();
