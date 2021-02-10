/**
 * Copyright (c) Microblink Ltd. All rights reserved.
 */

import { newE2EPage } from '@stencil/core/testing';

describe('blinkcard-in-browser', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<blinkcard-in-browser></blinkcard-in-browser>');

    const element = await page.find('blinkcard-in-browser');
    expect(element).toHaveClass('hydrated');
  });
});
