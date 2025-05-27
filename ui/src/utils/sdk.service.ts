/**
 * Copyright (c) Microblink Ltd. All rights reserved.
 */

import * as BlinkCardSDK from '@microblink/blinkcard-in-browser-sdk';

import {
  AvailableRecognizers,
  CameraEntry,
  CameraExperience,
  EventReady,
  VideoRecognitionConfiguration,
  ImageRecognitionConfiguration,
  MultiSideImageRecognitionConfiguration,
  ImageRecognitionType,
  RecognizerInstance,
  RecognitionEvent,
  RecognitionStatus,
  RecognitionResults,
  SdkSettings,
  SDKError
} from './data-structures';
import * as ErrorTypes from './error-structures';

const _IS_IMAGE_CAPTURE = false;

export interface CheckConclusion {
  status: boolean;
  message?: string;
}

export async function getCameraDevices(): Promise<Array<CameraEntry>> {
  const devices = await BlinkCardSDK.getCameraDevices();
  const allDevices = devices.frontCameras.concat(devices.backCameras);
  const finalEntries = allDevices.map((el: BlinkCardSDK.SelectedCamera) => {
    return {
      prettyName: el.label,
      details: el
    };
  });

  return finalEntries;
}

export class SdkService {
  private sdk: BlinkCardSDK.WasmSDK;

  private eventEmitter$: HTMLAnchorElement;

  private cancelInitiatedFromOutside: boolean = false;

  private recognizerName: string;

  public videoRecognizer: BlinkCardSDK.VideoRecognizer;

  public showOverlay: boolean = false;

  public isFrontSuccessFrame: boolean = false;

  private lastDetectionStatus: BlinkCardSDK.DetectionStatus =
    BlinkCardSDK.DetectionStatus.Failed;

  constructor() {
    this.eventEmitter$ = document.createElement('a');
  }

  public delete() {
    this.sdk?.delete();
  }

  public initialize(
    licenseKey: string,
    sdkSettings: SdkSettings
  ): Promise<EventReady | SDKError> {
    const loadSettings = new BlinkCardSDK.WasmSDKLoadSettings(licenseKey);

    loadSettings.allowHelloMessage = sdkSettings.allowHelloMessage;
    loadSettings.engineLocation = sdkSettings.engineLocation;
    loadSettings.workerLocation = sdkSettings.workerLocation;

    if (sdkSettings.wasmType) {
      loadSettings.wasmType = sdkSettings.wasmType;
    }

    return new Promise((resolve) => {
      BlinkCardSDK.loadWasmModule(loadSettings)
        .then((sdk: BlinkCardSDK.WasmSDK) => {
          this.sdk = sdk;
          this.showOverlay = sdk.showOverlay;
          resolve(new EventReady(this.sdk));
        })
        .catch((error) => {
          resolve(
            new SDKError(ErrorTypes.componentErrors.sdkLoadFailed, error)
          );
        });
    });
  }

  public checkRecognizers(recognizers: Array<string>): CheckConclusion {
    if (!recognizers || !recognizers.length) {
      return {
        status: false,
        message: 'There are no provided recognizers!'
      };
    }

    for (const recognizer of recognizers) {
      if (!this.isRecognizerAvailable(recognizer)) {
        return {
          status: false,
          message: `Recognizer "${recognizer}" doesn't exist!`
        };
      }
    }

    return {
      status: true
    };
  }

  public getDesiredCameraExperience(
    _recognizers: Array<string> = [],
    _recognizerOptions: any = {}
  ): CameraExperience {
    return CameraExperience.PaymentCard;
  }

  public async scanFromCamera(
    configuration: VideoRecognitionConfiguration,
    eventCallback: (ev: RecognitionEvent) => void
  ): Promise<void> {
    eventCallback({ status: RecognitionStatus.Preparing });

    this.cancelInitiatedFromOutside = false;

    // Prepare terminate mechanism before recognizer and runner instances are created
    this.eventEmitter$.addEventListener('terminate', async () => {
      this.videoRecognizer?.cancelRecognition?.();
      window.setTimeout(() => this.videoRecognizer?.releaseVideoFeed?.(), 1);

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

        if (recognizer.recognizer?.objectHandle > -1) {
          recognizer.recognizer.delete?.();
        }
      }
    });

    // Prepare recognizers and runner
    const recognizers = await this.createRecognizers(
      configuration.recognizers,
      configuration.recognizerOptions,
      configuration.successFrame
    );

    const recognizerRunner = await this.createRecognizerRunner(recognizers);

    try {
      this.videoRecognizer =
        await BlinkCardSDK.VideoRecognizer.createVideoRecognizerFromCameraStream(
          configuration.cameraFeed,
          recognizerRunner,
          configuration.cameraId
        );

      eventCallback({ status: RecognitionStatus.Ready });

      await this.videoRecognizer.setVideoRecognitionMode(
        BlinkCardSDK.VideoRecognitionMode.Recognition
      );

      // We do per-frame operations here
      this.videoRecognizer.setOnFrameProcessed((result) => {
        window.setTimeout(() => {
          // detection status callback is triggered before the video frame callback
          // reset it after each frame is done processing
          this.lastDetectionStatus = BlinkCardSDK.DetectionStatus.Failed;
        }, 0);

        const notDetected =
          this.lastDetectionStatus === BlinkCardSDK.DetectionStatus.Failed;

        // framing
        switch (this.lastDetectionStatus) {
          case BlinkCardSDK.DetectionStatus.CameraTooFar:
            eventCallback({
              status: RecognitionStatus.DetectionStatusCameraTooHigh
            });
            break;

          case BlinkCardSDK.DetectionStatus.FallbackSuccess:
            eventCallback({
              status: RecognitionStatus.DetectionStatusFallbackSuccess
            });
            break;

          case BlinkCardSDK.DetectionStatus.DocumentPartiallyVisible:
            eventCallback({ status: RecognitionStatus.DetectionStatusPartial });
            break;

          case BlinkCardSDK.DetectionStatus.CameraAngleTooSteep:
            eventCallback({
              status: RecognitionStatus.DetectionStatusCameraAtAngle
            });
            break;

          case BlinkCardSDK.DetectionStatus.CameraTooClose:
            eventCallback({
              status: RecognitionStatus.DetectionStatusCameraTooNear
            });
            break;

          case BlinkCardSDK.DetectionStatus.DocumentTooCloseToCameraEdge:
            eventCallback({
              status: RecognitionStatus.DetectionStatusDocumentTooCloseToEdge
            });
            break;
        }

        // handle no detection
        if (notDetected) {
          eventCallback({
            // this status doesn't seem to do anything
            // the logic is probably handled as a "default" state somewhere else
            status: RecognitionStatus.DetectionStatusFail
          });

          return;
        }

        // first side done - show flip/move. This status triggers only once
        if (this.isFrontSuccessFrame) {
          eventCallback({ status: RecognitionStatus.OnFirstSideResult });
          this.isFrontSuccessFrame = false;

          return;
        }

        // scanning wrong side
        if (
          result.processingStatus ===
          BlinkCardSDK.ProcessingStatus.ScanningWrongSide
        ) {
          eventCallback({
            status: RecognitionStatus.WrongSide
          });

          return;
        }

        // fallback - success?
        eventCallback({ status: RecognitionStatus.DetectionStatusSuccess });
      });

      //////////////////////////////////////////////////
      // Start recognition

      await this.videoRecognizer
        .startRecognition(
          async (recognitionState: BlinkCardSDK.RecognizerResultState) => {
            this.videoRecognizer.pauseRecognition();

            eventCallback({ status: RecognitionStatus.Processing });

            if (recognitionState !== BlinkCardSDK.RecognizerResultState.Empty) {
              for (const recognizer of recognizers) {
                const results = await recognizer.recognizer.getResult();
                this.recognizerName = recognizer.recognizer.recognizerName;

                if (
                  !results ||
                  results.state === BlinkCardSDK.RecognizerResultState.Empty
                ) {
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
                  };

                  if (configuration.recognizerOptions?.returnSignedJSON) {
                    recognitionResults.resultSignedJSON =
                      await recognizer.recognizer.toSignedJSON();
                  }

                  const scanData: any = {
                    result: recognitionResults,
                    initiatedByUser: this.cancelInitiatedFromOutside
                  };

                  eventCallback({
                    status: RecognitionStatus.ScanSuccessful,
                    data: scanData
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

            window.setTimeout(() => void this.cancelRecognition(), 400);
          },
          configuration.recognitionTimeout
        )
        .then(() => {
          /* Scanning... */
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      if (!error.code) {
        eventCallback({ status: RecognitionStatus.UnknownError });
      } else {
        switch (error.code) {
          case BlinkCardSDK.ErrorCodes
            .VIDEO_RECOGNIZER_MEDIA_DEVICES_UNSUPPORTED:
            eventCallback({
              status: RecognitionStatus.NoSupportForMediaDevices
            });
            break;
          case BlinkCardSDK.ErrorCodes.VIDEO_RECOGNIZER_CAMERA_MISSING:
            eventCallback({ status: RecognitionStatus.CameraNotFound });
            break;
          case BlinkCardSDK.ErrorCodes.VIDEO_RECOGNIZER_CAMERA_NOT_ALLOWED:
            eventCallback({ status: RecognitionStatus.CameraNotAllowed });
            break;
          case BlinkCardSDK.ErrorCodes.VIDEO_RECOGNIZER_CAMERA_IN_USE:
            eventCallback({ status: RecognitionStatus.CameraInUse });
            break;

          default:
            eventCallback({ status: RecognitionStatus.UnableToAccessCamera });
            break;
        }
      }

      console.warn('Error in VideoRecognizer', error.code, error.message);

      void this.cancelRecognition();
    }
  }

  public async flipCamera(): Promise<void> {
    await this.videoRecognizer.flipCamera();
  }

  public isCameraFlipped(): boolean {
    if (!this.videoRecognizer) {
      return false;
    }
    return this.videoRecognizer.isCameraFlipped();
  }

  public isScanFromImageAvailable(
    _recognizers: Array<string> = [],
    _recognizerOptions: any = {}
  ): boolean {
    return false;
  }

  public getScanFromImageType(
    _recognizers: Array<string> = [],
    _recognizerOptions: any = {}
  ): ImageRecognitionType {
    if (_recognizers.indexOf('BlinkCardRecognizer') > -1) {
      return ImageRecognitionType.MultiSide;
    }

    return ImageRecognitionType.SingleSide;
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

    const recognizerRunner = await this.createRecognizerRunner(recognizers);

    const handleTerminate = async () => {
      this.eventEmitter$.removeEventListener('terminate', handleTerminate);

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

        if (recognizer.recognizer?.objectHandle > -1) {
          recognizer.recognizer.delete?.();
        }
      }

      this.eventEmitter$.dispatchEvent(new Event('terminate:done'));
    };

    this.eventEmitter$.addEventListener('terminate', handleTerminate);

    // Get image file
    if (
      !configuration.file ||
      !RegExp(/^image\//).exec(configuration.file.type)
    ) {
      eventCallback({ status: RecognitionStatus.NoImageFileFound });
      window.setTimeout(() => void this.cancelRecognition(), 500);
      return;
    }

    const file = configuration.file;
    const imageElement = new Image();
    imageElement.src = URL.createObjectURL(file);
    await imageElement.decode();

    const imageFrame = BlinkCardSDK.captureFrame(imageElement);

    // Get results
    eventCallback({ status: RecognitionStatus.Processing });

    const processResult = await recognizerRunner.processImage(imageFrame);

    if (processResult !== BlinkCardSDK.RecognizerResultState.Empty) {
      for (const recognizer of recognizers) {
        const results = await recognizer.recognizer.getResult();

        if (
          !results ||
          results.state === BlinkCardSDK.RecognizerResultState.Empty
        ) {
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
            imageCapture: _IS_IMAGE_CAPTURE,
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

  public async scanFromImageMultiSide(
    configuration: MultiSideImageRecognitionConfiguration,
    eventCallback: (ev: RecognitionEvent) => void
  ): Promise<void> {
    eventCallback({ status: RecognitionStatus.Preparing });

    const recognizers = await this.createRecognizers(
      configuration.recognizers,
      configuration.recognizerOptions
    );

    const recognizerRunner = await this.createRecognizerRunner(recognizers);

    const handleTerminate = async () => {
      this.eventEmitter$.removeEventListener('terminate', handleTerminate);

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

        if (recognizer.recognizer?.objectHandle > -1) {
          recognizer.recognizer.delete?.();
        }
      }

      this.eventEmitter$.dispatchEvent(new Event('terminate:done'));
    };

    this.eventEmitter$.addEventListener('terminate', handleTerminate);

    if (!configuration.firstFile) {
      eventCallback({ status: RecognitionStatus.NoFirstImageFileFound });
      window.setTimeout(() => void this.cancelRecognition(), 500);
      return;
    }

    if (!configuration.secondFile) {
      eventCallback({ status: RecognitionStatus.NoSecondImageFileFound });
      window.setTimeout(() => void this.cancelRecognition(), 500);
      return;
    }

    // Get results
    eventCallback({ status: RecognitionStatus.Processing });

    const imageElement = new Image();
    imageElement.src = URL.createObjectURL(configuration.firstFile);
    await imageElement.decode();

    const firstFrame = BlinkCardSDK.captureFrame(imageElement);
    const firstProcessResult = await recognizerRunner.processImage(firstFrame);

    if (firstProcessResult !== BlinkCardSDK.RecognizerResultState.Empty) {
      const imageElement = new Image();
      imageElement.src = URL.createObjectURL(configuration.secondFile);
      await imageElement.decode();

      const secondFrame = BlinkCardSDK.captureFrame(imageElement);
      const secondProcessResult = await recognizerRunner.processImage(
        secondFrame
      );

      if (secondProcessResult !== BlinkCardSDK.RecognizerResultState.Empty) {
        for (const recognizer of recognizers) {
          const results = await recognizer.recognizer.getResult();

          if (
            !results ||
            results.state === BlinkCardSDK.RecognizerResultState.Empty
          ) {
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
              imageCapture: _IS_IMAGE_CAPTURE,
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
    void (await this.cancelRecognition(true));
  }

  public async resumeRecognition(): Promise<void> {
    this.videoRecognizer.resumeRecognition(true);
  }

  public changeCameraDevice(
    camera: BlinkCardSDK.SelectedCamera
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.videoRecognizer
        .changeCameraDevice(camera)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  }

  public getProductIntegrationInfo(): Promise<BlinkCardSDK.ProductIntegrationInfo> {
    return this.sdk.getProductIntegrationInfo();
  }

  //////////////////////////////////////////////////////////////////////////////
  //
  // PRIVATE METHODS

  private isRecognizerAvailable(recognizer: string): boolean {
    return !!AvailableRecognizers[recognizer];
  }

  private async createRecognizers(
    recognizers: Array<string>,
    recognizerOptions: any,
    successFrame: boolean = false
  ): Promise<Array<RecognizerInstance>> {
    const pureRecognizers = [];

    for (const recognizer of recognizers) {
      const instance = await BlinkCardSDK[AvailableRecognizers[recognizer]](
        this.sdk
      );
      pureRecognizers.push(instance);
    }

    if (recognizerOptions && Object.keys(recognizerOptions).length > 0) {
      for (const recognizer of pureRecognizers) {
        const settings = await recognizer.currentSettings();

        let updated = false;

        if (
          !recognizerOptions[recognizer.recognizerName] ||
          Object.keys(recognizerOptions[recognizer.recognizerName]).length < 1
        ) {
          continue;
        }

        for (const [key, value] of Object.entries(
          recognizerOptions[recognizer.recognizerName]
        )) {
          if (key in settings) {
            settings[key] = value;
            updated = true;
          }
        }

        if (updated) {
          await recognizer.updateSettings(settings);
        }
      }
    }

    const recognizerInstances = [];

    for (let i = 0; i < pureRecognizers.length; ++i) {
      const recognizer = pureRecognizers[i];
      const instance: RecognizerInstance = { name: recognizers[i], recognizer };

      if (successFrame) {
        const successFrameGrabber =
          await BlinkCardSDK.createSuccessFrameGrabberRecognizer(
            this.sdk,
            recognizer
          );
        instance.successFrame = successFrameGrabber;
      }

      recognizerInstances.push(instance);
    }

    return recognizerInstances;
  }

  private async createRecognizerRunner(
    recognizers: Array<RecognizerInstance>
  ): Promise<BlinkCardSDK.RecognizerRunner> {
    const metadataCallbacks: BlinkCardSDK.MetadataCallbacks = {
      onQuadDetection: (quad: BlinkCardSDK.Displayable) => {
        this.lastDetectionStatus = quad.detectionStatus;
      },
      onFirstSideResult: () => {
        this.isFrontSuccessFrame = true;
      }
    };

    const recognizerRunner = await BlinkCardSDK.createRecognizerRunner(
      this.sdk,
      recognizers.map((el: RecognizerInstance) => el.recognizer),
      false,
      metadataCallbacks
    );

    return recognizerRunner;
  }

  private async cancelRecognition(
    initiatedFromOutside: boolean = false
  ): Promise<void> {
    this.cancelInitiatedFromOutside = initiatedFromOutside;
    this.eventEmitter$.dispatchEvent(new Event('terminate'));
  }
}
