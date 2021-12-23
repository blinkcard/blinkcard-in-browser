/**
 * Copyright (c) Microblink Ltd. All rights reserved.
 */

import * as BlinkCardSDK from '../../../../../es/blinkcard-sdk';

function getSDKWasmType(wasmType: string): BlinkCardSDK.WasmType | null {
  switch (wasmType) {
    case 'BASIC':
      return BlinkCardSDK.WasmType.Basic;
    case 'ADVANCED':
      return BlinkCardSDK.WasmType.Advanced;
    case 'ADVANCED_WITH_THREADS':
      return BlinkCardSDK.WasmType.AdvancedWithThreads;
    default:
      return null;
  }
}

export { getSDKWasmType }
