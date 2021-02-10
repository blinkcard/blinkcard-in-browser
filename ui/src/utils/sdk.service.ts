/**
 * Copyright (c) Microblink Ltd. All rights reserved.
 */

import * as BlinkCardSDK from "../../../es/blinkcard-sdk";

import {
  AvailableRecognizers,
  AvailableRecognizerOptions,
  CameraExperience,
  Code,
  EventFatalError,
  EventReady,
  VideoRecognitionConfiguration,
  ImageRecognitionConfiguration,
  RecognizerInstance,
  RecognitionEvent,
  RecognitionStatus,
  RecognitionResults,
  SdkSettings
} from './data-structures';

export interface CheckConclusion {
  status: boolean;
  message?: string;
}

export class SdkService {
  private sdk: BlinkCardSDK.WasmSDK;

  private eventEmitter$: HTMLAnchorElement;

  private cancelInitiatedFromOutside: boolean = false;

  private recognizerName: string;

  private videoRecognizer: BlinkCardSDK.VideoRecognizer;

  public showOverlay: boolean = false;

  constructor() {
    this.eventEmitter$ = document.createElement('a');
  }

  public initialize(licenseKey: string, sdkSettings: SdkSettings): Promise<EventReady|EventFatalError> {
    const loadSettings = new BlinkCardSDK.WasmSDKLoadSettings(licenseKey);

    loadSettings.allowHelloMessage = sdkSettings.allowHelloMessage;
    loadSettings.engineLocation = sdkSettings.engineLocation;

    return new Promise((resolve) => {
      BlinkCardSDK.loadWasmModule(loadSettings)
        .then((sdk: BlinkCardSDK.WasmSDK) => {
          this.sdk = sdk;
          this.showOverlay = sdk.showOverlay;
          resolve(new EventReady(this.sdk));
        })
        .catch(error => {
          resolve(new EventFatalError(Code.SdkLoadFailed, 'Failed to load SDK!', error));
        });
    });
  }

  public checkRecognizers(recognizers: Array<string>): CheckConclusion {
    if (!recognizers || !recognizers.length) {
      return {
        status: false,
        message: 'There are no provided recognizers!'
      }
    }

    for (const recognizer of recognizers) {
      if (!this.isRecognizerAvailable(recognizer)) {
        return {
          status: false,
          message: `Recognizer "${ recognizer }" doesn't exist!`
        }
      }

    }

    return {
      status: true
    }
  }

  public checkRecognizerOptions(recognizers: Array<string>, recognizerOptions: Array<string>): CheckConclusion {
    if (!recognizerOptions || !recognizerOptions.length) {
      return {
        status: true
      }
    }

    for (const recognizerOption of recognizerOptions) {
      let optionExistInProvidedRecognizers = false;

      for (const recognizer of recognizers) {
        const availableOptions = AvailableRecognizerOptions[recognizer];

        if (availableOptions.indexOf(recognizerOption) > -1) {
          optionExistInProvidedRecognizers = true;
          break;
        }
      }

      if (!optionExistInProvidedRecognizers) {
        return {
          status: false,
          message: `Recognizer option "${ recognizerOption }" is not supported by available recognizers!`
        }
      }
    }

    return {
      status: true
    }
  }

  public getDesiredCameraExperience(recognizers: Array<string>, _recognizerOptions: Array<string> = []): CameraExperience {
    if (recognizers.indexOf('BlinkCardRecognizer') > -1) {
      return CameraExperience.BlinkCard;
    }
  }

  public async scanFromCamera(
    configuration: VideoRecognitionConfiguration,
    eventCallback: (ev: RecognitionEvent) => void
  ): Promise<void> {
    eventCallback({ status: RecognitionStatus.Preparing });

    this.cancelInitiatedFromOutside = false;

    const recognizers = await this.createRecognizers(
      configuration.recognizers,
      configuration.recognizerOptions,
      configuration.successFrame
    );

    const recognizerRunner = await this.createRecognizerRunner(
      recognizers,
      eventCallback
    );

    try {
      this.videoRecognizer = await BlinkCardSDK.VideoRecognizer.createVideoRecognizerFromCameraStream(
        configuration.cameraFeed,
        recognizerRunner,
        configuration.cameraId
      );

      await this.videoRecognizer.setVideoRecognitionMode(BlinkCardSDK.VideoRecognitionMode.Recognition);

      this.eventEmitter$.addEventListener('terminate', async () => {
        if (this.videoRecognizer && typeof this.videoRecognizer.cancelRecognition === 'function') {
          this.videoRecognizer.cancelRecognition();
        }

        if (recognizerRunner) {
            try {
              await recognizerRunner.delete();
            } catch (error) {
              // Psst, this error should not happen.
            }
        }

        for (const recognizer of recognizers) {
          if (!recognizer) {
            continue;
          }

          if (
            recognizer.recognizer &&
            recognizer.recognizer.objectHandle > -1 &&
            typeof recognizer.recognizer.delete === 'function'
          ) {
            recognizer.recognizer.delete()
          }

          if (
            recognizer.successFrame &&
            recognizer.successFrame.objectHandle > -1
            && typeof recognizer.successFrame.delete === 'function'
          ) {
            recognizer.successFrame.delete();
          }
        }

        window.setTimeout(() => {
          if (this.videoRecognizer) {
            this.videoRecognizer.releaseVideoFeed();
          }
        }, 1);
      });

      this.videoRecognizer.startRecognition(
        async (recognitionState: BlinkCardSDK.RecognizerResultState) => {
          this.videoRecognizer.pauseRecognition();

          eventCallback({ status: RecognitionStatus.Processing });

          if (recognitionState !== BlinkCardSDK.RecognizerResultState.Empty) {
            for (const recognizer of recognizers) {
              const results = await recognizer.recognizer.getResult();
              this.recognizerName = recognizer.recognizer.recognizerName;

              if (!results || results.state === BlinkCardSDK.RecognizerResultState.Empty) {
                eventCallback({
                  status: RecognitionStatus.EmptyResultState,
                  data: {
                    initiatedByUser: this.cancelInitiatedFromOutside,
                    recognizerName: this.recognizerName
                  }
                });
              } else {
                const recognitionResults: RecognitionResults = {
                  recognizer: results,
                  recognizerName: this.recognizerName
                }

                if (recognizer.successFrame) {
                  const successFrameResults = await recognizer.successFrame.getResult();

                  if (successFrameResults && successFrameResults.state !== BlinkCardSDK.RecognizerResultState.Empty) {
                    recognitionResults.successFrame = successFrameResults;
                  }
                }

                eventCallback({
                  status: RecognitionStatus.ScanSuccessful,
                  data: {
                    result: recognitionResults,
                    initiatedByUser: this.cancelInitiatedFromOutside,
                    imageCapture: this.recognizerName === 'BlinkIdImageCaptureRecognizer'
                  }
                });
                break;
              }
            }
          } else {
            eventCallback({
              status: RecognitionStatus.EmptyResultState,
              data: {
                initiatedByUser: this.cancelInitiatedFromOutside,
                recognizerName: ''
              }
            });
          }

          if (this.recognizerName !== 'BlinkIdImageCaptureRecognizer') {
            window.setTimeout(() => void this.cancelRecognition(), 400);
          }
        });
    } catch (error) {
      if (error && error.name === 'VideoRecognizerError') {
        const reason = (error as BlinkCardSDK.VideoRecognizerError).reason;

        switch (reason) {
          case BlinkCardSDK.NotSupportedReason.MediaDevicesNotSupported:
            eventCallback({ status: RecognitionStatus.NoSupportForMediaDevices });
            break;

          case BlinkCardSDK.NotSupportedReason.CameraNotFound:
            eventCallback({ status: RecognitionStatus.CameraNotFound });
            break;

          case BlinkCardSDK.NotSupportedReason.CameraNotAllowed:
            eventCallback({ status: RecognitionStatus.CameraNotAllowed });
            break;

          case BlinkCardSDK.NotSupportedReason.CameraInUse:
            eventCallback({ status: RecognitionStatus.CameraInUse });
            break;

          default:
            eventCallback({ status: RecognitionStatus.UnableToAccessCamera });
        }

        console.warn('VideoRecognizerError', error.name, '[' + reason + ']:', error.message);
        void this.cancelRecognition();
      } else {
        eventCallback({ status: RecognitionStatus.UnknownError });
      }
    }
  }

  public async flipCamera(): Promise<void> {
    await this.videoRecognizer.flipCamera();
  }

  public isCameraFlipped(): boolean {
    if (!this.videoRecognizer) {
      return false;
    }
    return this.videoRecognizer.cameraFlipped;
  }

  public isScanFromImageAvailable(recognizers: Array<string>, _recognizerOptions: Array<string> = []): boolean {
    return recognizers.indexOf('BlinkCardRecognizer') !== -1;
  }

  public async scanFromImage(
    configuration: ImageRecognitionConfiguration,
    eventCallback: (ev: RecognitionEvent) => void
  ): Promise<void> {
    eventCallback({ status: RecognitionStatus.Preparing });

    const recognizers = await this.createRecognizers(
      configuration.recognizers,
      configuration.recognizerOptions
    );

    const recognizerRunner = await this.createRecognizerRunner(
      recognizers,
      eventCallback
    );

    // Get image file
    const imageRegex = RegExp(/^image\//);
    const file: File|null = (() => {
      for (let i = 0; i < configuration.fileList.length; ++i) {
        if (imageRegex.exec(configuration.fileList[i].type)) {
          return configuration.fileList[i];
        }
      }

      return null;
    })();

    if (!file) {
      eventCallback({ status: RecognitionStatus.NoImageFileFound });
      return;
    }

    const originalImageElement = document.createElement('img');
    originalImageElement.src = URL.createObjectURL(file);
    await originalImageElement.decode();

    const canvas: HTMLCanvasElement = document.createElement('canvas');
    const padding = Math.round(originalImageElement.naturalWidth * 0.075);

    canvas.width = originalImageElement.naturalWidth + 2 * padding;
    canvas.height = originalImageElement.naturalHeight + 2 * padding;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImageElement, padding, padding, originalImageElement.naturalWidth, originalImageElement.naturalHeight);

    const imageElement = new Image(canvas.width, canvas.height);
    imageElement.src = canvas.toDataURL();
    await imageElement.decode();

    const imageFrame = BlinkCardSDK.captureFrame(imageElement);

    this.eventEmitter$.addEventListener('terminate', async () => {
      if (recognizerRunner) {
          try {
            await recognizerRunner.delete();
          } catch (error) {
            // Psst, this error should not happen.
          }
      }

      for (const recognizer of recognizers) {
        if (!recognizer) {
          continue;
        }

        if (
          recognizer.recognizer &&
          recognizer.recognizer.objectHandle > -1 &&
          typeof recognizer.recognizer.delete === 'function'
        ) {
          await recognizer.recognizer.delete();
        }
      }
    });

    // Get results
    eventCallback({ status: RecognitionStatus.Processing });

    const processResult = await recognizerRunner.processImage(imageFrame);

    if (processResult !== BlinkCardSDK.RecognizerResultState.Empty) {
      for (const recognizer of recognizers) {
        const results = await recognizer.recognizer.getResult();

        if (!results || results.state === BlinkCardSDK.RecognizerResultState.Empty) {
          eventCallback({
            status: RecognitionStatus.EmptyResultState,
            data: {
              initiatedByUser: this.cancelInitiatedFromOutside,
              recognizerName: recognizer.name
            }
          });
        } else {
          const recognitionResults: RecognitionResults = {
            recognizer: results,
            imageCapture: recognizer.name === 'BlinkIdImageCaptureRecognizer',
            recognizerName: recognizer.name
          };
          eventCallback({
            status: RecognitionStatus.ScanSuccessful,
            data: recognitionResults
          });
          break;
        }
      }
    } else {
      eventCallback({
        status: RecognitionStatus.EmptyResultState,
        data: {
          initiatedByUser: this.cancelInitiatedFromOutside,
          recognizerName: ''
        }
      });
    }

    window.setTimeout(() => void this.cancelRecognition(), 500);
  }

  public async stopRecognition() {
    void await this.cancelRecognition(true);
  }

  public async resumeRecognition(): Promise<void> {
    this.videoRecognizer.resumeRecognition(true);
  }

  //////////////////////////////////////////////////////////////////////////////
  //
  // PRIVATE METHODS

  private isRecognizerAvailable(recognizer: string): boolean {
    return !!AvailableRecognizers[recognizer];
  }

  private async createRecognizers(
    recognizers: Array<string>,
    recognizerOptions?: Array<string>,
    successFrame: boolean = false
  ): Promise<Array<RecognizerInstance>> {
    const pureRecognizers = [];

    for (const recognizer of recognizers) {
      const instance = await BlinkCardSDK[AvailableRecognizers[recognizer]](this.sdk);
      pureRecognizers.push(instance);
    }

    if (recognizerOptions && recognizerOptions.length) {
      for (const recognizer of pureRecognizers) {
        let settingsUpdated = false;
        const settings = await recognizer.currentSettings();

        for (const setting of recognizerOptions) {
          if (setting in settings) {
            settings[setting] = true;
            settingsUpdated = true;
          }
        }

        if (settingsUpdated) {
          await recognizer.updateSettings(settings);
        }
      }
    }

    const recognizerInstances = [];

    for (let i = 0; i < pureRecognizers.length; ++i) {
      const recognizer = pureRecognizers[i];
      const instance: RecognizerInstance = { name: recognizers[i], recognizer }

      if (successFrame) {
        const successFrameGrabber = await BlinkCardSDK.createSuccessFrameGrabberRecognizer(this.sdk, recognizer);
        instance.successFrame = successFrameGrabber;
      }

      recognizerInstances.push(instance)
    }

    return recognizerInstances;
  }

  private async createRecognizerRunner(
    recognizers: Array<RecognizerInstance>,
    eventCallback: (ev: RecognitionEvent) => void
  ): Promise<BlinkCardSDK.RecognizerRunner> {
    const metadataCallbacks: BlinkCardSDK.MetadataCallbacks = {
      onDetectionFailed: () => eventCallback({ status: RecognitionStatus.DetectionFailed }),
      onQuadDetection: (quad: BlinkCardSDK.Displayable) => {
        eventCallback({ status: RecognitionStatus.DetectionStatusChange, data: quad });

        const detectionStatus = quad.detectionStatus;
        switch (detectionStatus) {
          case BlinkCardSDK.DetectionStatus.Fail:
            eventCallback({ status: RecognitionStatus.DetectionStatusSuccess });
            break;

          case BlinkCardSDK.DetectionStatus.Success:
            eventCallback({ status: RecognitionStatus.DetectionStatusSuccess });
            break;

          case BlinkCardSDK.DetectionStatus.CameraTooHigh:
            eventCallback({ status: RecognitionStatus.DetectionStatusCameraTooHigh });
            break;

          case BlinkCardSDK.DetectionStatus.FallbackSuccess:
            eventCallback({ status: RecognitionStatus.DetectionStatusFallbackSuccess });
            break;

          case BlinkCardSDK.DetectionStatus.Partial:
            eventCallback({ status: RecognitionStatus.DetectionStatusPartial });
            break;

          case BlinkCardSDK.DetectionStatus.CameraAtAngle:
            eventCallback({ status: RecognitionStatus.DetectionStatusCameraAtAngle });
            break;

          case BlinkCardSDK.DetectionStatus.CameraTooNear:
            eventCallback({ status: RecognitionStatus.DetectionStatusCameraTooNear });
            break;

          case BlinkCardSDK.DetectionStatus.DocumentTooCloseToEdge:
            eventCallback({ status: RecognitionStatus.DetectionStatusDocumentTooCloseToEdge });
            break;

          default:
            // Send nothing
        }
      }
    }
    for (const el of recognizers) {
      if ( el.recognizer.recognizerName === 'BlinkCardRecognizer' ) {
        metadataCallbacks.onFirstSideResult = () => eventCallback({ status: RecognitionStatus.OnFirstSideResult });
      }
    }
    const recognizerRunner = await BlinkCardSDK.createRecognizerRunner(
      this.sdk,
      recognizers.map((el: RecognizerInstance) => el.successFrame || el.recognizer),
      false,
      metadataCallbacks
    );

    return recognizerRunner;
  }

  private async cancelRecognition(initiatedFromOutside: boolean = false): Promise<void> {
    this.cancelInitiatedFromOutside = initiatedFromOutside;
    this.eventEmitter$.dispatchEvent(new Event('terminate'));
  }
}

