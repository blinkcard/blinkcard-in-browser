/**
 * Copyright (c) Microblink Ltd. All rights reserved.
 */

import { newSpecPage } from '@stencil/core/testing';
import { BlinkcardInBrowser } from '../blinkcard-in-browser';

describe('blinkcard-in-browser', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [BlinkcardInBrowser],
      html: `<blinkcard-in-browser></blinkcard-in-browser>`,
    });
    expect(page.root).toEqualHtml(`
      <blinkcard-in-browser>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </blinkcard-in-browser>
    `);
  });
});
