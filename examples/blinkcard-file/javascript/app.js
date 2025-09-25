
/**
 * Copyright (c) Microblink Ltd. All rights reserved.
 *
 * BlinkCard In-browser SDK demo app which demonstrates how to:
 *
 * - Change default SDK settings
 * - Scan payment cards from still images
 */

// General UI helpers
const initialMessageEl = document.getElementById("msg");
const progressEl = document.getElementById("load-progress");

// UI elements for scanning feedback
const scanImageElement = document.getElementById("target-image");
const inputImageFileFrontSide = document.getElementById(
  "image-file-front-side"
);
const inputImageFileBackSide = document.getElementById("image-file-back-side");

/**
 * Initialize and load WASM SDK.
 */
function main()
{
  // Check if browser has proper support for WebAssembly
  if (!BlinkCardSDK.isBrowserSupported())
  {
    initialMessageEl.innerText = "This browser is not supported!";
    return;
  }

  // 1. It's possible to obtain a free trial license key on microblink.com
  let licenseKey =
  "sRwAAAYJbG9jYWxob3N0r/lOPmg/w35CpOFWK2Iby5viGQ9SaGEyOialp1EO1iKzPsJXbg9VP3TdMUCeipwZDJi4noTUf8UVXElkfSy9dBFJpabS22+rUh5gSwAnbDXVGWqXU8D/5YrBFd0s4NUQizBnHXwsqt2iHGPBR2psl/4xYdpqfJ3nAyUuGIMiykVsonyD7n9/Q1q30W+bLOysj+iapP7uDH7m18PMuAQpHbT38PfYKwNQVmgqRF6bxqzTlw==";

  if (window.location.hostname === "blinkcard.github.io")
  {
    licenseKey =
    "sRwAAAYTYmxpbmtjYXJkLmdpdGh1Yi5pby+N7zvpysD9Mbe+q3g5yH0h9RBOHPVq3LuTPf8+PV8vHlbD9h6c76syU9z2P8zASRWRMXIK8Dw/6cHrSX316QNCGui5jIN1iF8hATjp4LxFr8bc8nbuPic5rAAH68kYebKxwhMY+O+n2PD/AJe5M+CoxQGRPt8st0IwE9QpBM44qU91PgY76wg1k3YD3/z/Yj2wUR+2pdjRTqd3MWXDrqiAA510wup31fGLj5DQDx5Ny5M=";
  }

  // 2. Create instance of SDK load settings with your license key
  const loadSettings = new BlinkCardSDK.WasmSDKLoadSettings(licenseKey);

  // [OPTIONAL] Change default settings

  // Show or hide hello message in browser console when WASM is successfully loaded
  loadSettings.allowHelloMessage = true;

  // In order to provide better UX, display progress bar while loading the SDK
  loadSettings.loadProgressCallback = (progress) =>
  progressEl.value = progress;

  // Set absolute location of the engine, i.e. WASM and support JS files
  loadSettings.engineLocation = "https://blinkcard.github.io/blinkcard-in-browser/resources";

  // Set absolute location of the worker file
  loadSettings.workerLocation =
  "https://blinkcard.github.io/blinkcard-in-browser/resources/BlinkCardWasmSDK.worker.min.js";

  // 3. Load SDK
  BlinkCardSDK.loadWasmModule(loadSettings).then(
    (sdk) =>
    {
      document.getElementById("screen-initial")?.classList.add("hidden");
      document.getElementById("screen-start")?.classList.remove("hidden");
      document.
      getElementById("start-button")?.
      addEventListener("click", (ev) =>
      {
        ev.preventDefault();
        startScan(sdk);
      });
    },
    (error) =>
    {
      initialMessageEl.innerText = "Failed to load SDK!";
      console.error("Failed to load SDK!", error);
    }
  );
}

/**
 * Scan payment card.
 */
async function startScan(sdk)
{
  document.getElementById("screen-start")?.classList.add("hidden");
  document.getElementById("screen-scanning")?.classList.remove("hidden");

  // 1. Create a recognizer objects which will be used to recognize single image or stream of images.
  //
  // In this example, we create a BlinkCardRecognizer, which knows how to scan Payment cards
  // and extract payment information from them.
  const blinkCardRecognizer = await BlinkCardSDK.createBlinkCardRecognizer(
    sdk
  );

  // 2. Create a RecognizerRunner object which orchestrates the recognition with one or more
  //    recognizer objects.
  const recognizerRunner = await BlinkCardSDK.createRecognizerRunner(
    // SDK instance to use
    sdk,
    // List of recognizer objects that will be associated with created RecognizerRunner object
    [blinkCardRecognizer],
    // [OPTIONAL] Should recognition pipeline stop as soon as first recognizer in chain finished recognition
    false
  );

  // 3. Prepare front side image for scan action - keep in mind that SDK can only process images represented
  //    in internal CapturedFrame data structure. Therefore, auxiliary method "captureFrame" is provided.

  // Make sure that image file is provided
  const fileFrontSide = getImageFromInput(inputImageFileFrontSide.files);

  if (!fileFrontSide)
  {
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
  const processResultFrontSide = await recognizerRunner.processImage(
    imageFrame
  );

  // 5. If recognition of the first side was successful, process the back side
  if (processResultFrontSide !== BlinkCardSDK.RecognizerResultState.Empty)
  {
    // 6. Prepare back side image for scan action
    const fileBackSide = getImageFromInput(inputImageFileBackSide.files);

    if (!fileBackSide)
    {
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
    const processResultBackSide = await recognizerRunner.processImage(
      imageFrame
    );

    if (
    processResultBackSide !== BlinkCardSDK.RecognizerResultState.Empty)

    {
      // 8. If recognition of the back side was successful, obtain the result and display it
      const results = await blinkCardRecognizer.getResult();

      if (results.state !== BlinkCardSDK.RecognizerResultState.Empty)
      {
        console.log("BlinkCard results", results);

        const firstAndLastName = results.owner;
        const cardNumber = results.cardNumber;
        const dateOfExpiry = {
          year: results.expiryDate.year,
          month: results.expiryDate.month
        };

        alert(
          `Hello, ${firstAndLastName}!\n Your payment card with card number ${cardNumber} will expire on ${dateOfExpiry.year}/${dateOfExpiry.month}.`
        );
      }
    } else

    {
      alert(
        "Could not extract information from the back side of a document!"
      );
    }
  } else

  {
    alert(
      "Could not extract information from the front side of a document!"
    );
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

function getImageFromInput(fileList)
{
  let image = null;
  const imageRegex = RegExp(/^image\//);
  for (let i = 0; i < fileList.length; ++i)
  {
    if (imageRegex.exec(fileList[i].type))
    {
      image = fileList[i];
    }
  }
  return image;
}

async function getImageFrame(file)
{
  scanImageElement.src = URL.createObjectURL(file);
  await scanImageElement.decode();
  return BlinkCardSDK.captureFrame(scanImageElement);
}

// Run
main();
