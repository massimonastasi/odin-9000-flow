import { Component, Prop, h, Host } from '@stencil/core';

// Registration: import this component via your Stencil build's dist-custom-elements loader.
// e.g. import { defineCustomElements } from 'fds-components/loader';

@Component({
  tag: 'fds-notification-banner',
  styleUrl: 'fds-notification-banner.css',
  shadow: true,
})
export class FdsNotificationBanner {
  /** Status (coloured surface) or Neutral (surface/surface-variant) */
  @Prop() type: 'Status' | 'Neutral' = 'Status';

  /** Contextual variant — drives background colour token */
  @Prop() context: 'success' | 'error' | 'alert' | 'info' | 'surface' | 'surface-variant' = 'success';

  /** Show the action button row */
  @Prop() actionButton: boolean = true;

  /** Show the optional title slot */
  @Prop() showTitle: boolean = true;

  render() {
    return (
      <Host class={`${this.type.toLowerCase()} ${this.context}`}>
        <div class="banner-content">
          <div class="content-row">
            <slot name="icon" />
            <div class="text-content">
              {this.showTitle && <slot name="title" />}
              <slot name="content" />
            </div>
          </div>
          {this.actionButton && (
            <div class="action-row">
              <slot name="actions" />
            </div>
          )}
        </div>
      </Host>
    );
  }
}
