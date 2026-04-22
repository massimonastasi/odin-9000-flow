import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

// Ensure the component is registered
import './fds-notification-banner';

type ComponentArgs = {
  type: 'Status' | 'Neutral';
  context: 'success' | 'error' | 'alert' | 'info' | 'surface' | 'surface-variant';
  actionButton: boolean;
  showTitle: boolean;
  iconSlot?: string;
  titleSlot?: string;
  contentSlot?: string;
  actionsSlot?: string;
};

const meta: Meta<ComponentArgs> = {
  title: 'Components/FdsNotificationBanner',
  component: 'fds-notification-banner',
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['Status', 'Neutral'],
      description: 'Status (coloured surface) or Neutral (surface/surface-variant)',
    },
    context: {
      control: 'select',
      options: ['success', 'error', 'alert', 'info', 'surface', 'surface-variant'],
      description: 'Contextual variant — drives background colour token',
    },
    actionButton: {
      control: 'boolean',
      description: 'Show the action button row',
    },
    showTitle: {
      control: 'boolean',
      description: 'Show the optional title slot',
    },
    iconSlot:    { control: 'text', name: 'slot: icon' },
    titleSlot:   { control: 'text', name: 'slot: title' },
    contentSlot: { control: 'text', name: 'slot: content' },
    actionsSlot: { control: 'text', name: 'slot: actions' },
  },
  render: ({ type, context, actionButton, showTitle, iconSlot, titleSlot, contentSlot, actionsSlot }) => html`
    <fds-notification-banner
      type=${type}
      context=${context}
      ?action-button=${actionButton}
      ?show-title=${showTitle}
    >
      ${iconSlot    ? html`<span slot="icon">${iconSlot}</span>` : ''}
      ${titleSlot   ? html`<strong slot="title">${titleSlot}</strong>` : ''}
      ${contentSlot ? html`<span slot="content">${contentSlot}</span>` : ''}
      ${actionsSlot ? html`<button slot="actions">${actionsSlot}</button>` : ''}
    </fds-notification-banner>
  `,
};
export default meta;
type Story = StoryObj<ComponentArgs>;

export const Success: Story = {
  args: {
    type: 'Status',
    context: 'success',
    actionButton: true,
    showTitle: true,
    titleSlot: 'Title (optional)',
    contentSlot: 'Banner content text (mandatory)',
    actionsSlot: 'Action Button',
  },
};

export const Error: Story = {
  args: {
    type: 'Status',
    context: 'error',
    actionButton: true,
    showTitle: true,
    titleSlot: 'Title (optional)',
    contentSlot: 'Banner content text (mandatory)',
    actionsSlot: 'Action Button',
  },
};

export const Alert: Story = {
  args: {
    type: 'Status',
    context: 'alert',
    actionButton: true,
    showTitle: true,
    titleSlot: 'Title (optional)',
    contentSlot: 'Banner content text (mandatory)',
    actionsSlot: 'Action Button',
  },
};

export const Info: Story = {
  args: {
    type: 'Status',
    context: 'info',
    actionButton: true,
    showTitle: true,
    titleSlot: 'Title (optional)',
    contentSlot: 'Banner content text (mandatory)',
    actionsSlot: 'Action Button',
  },
};

export const NeutralSurface: Story = {
  args: {
    type: 'Neutral',
    context: 'surface',
    actionButton: true,
    showTitle: true,
    titleSlot: 'Title (optional)',
    contentSlot: 'Banner content text (mandatory)',
    actionsSlot: 'Action Button',
  },
};

export const NeutralSurfaceVariant: Story = {
  args: {
    type: 'Neutral',
    context: 'surface-variant',
    actionButton: true,
    showTitle: true,
    titleSlot: 'Title (optional)',
    contentSlot: 'Banner content text (mandatory)',
    actionsSlot: 'Action Button',
  },
};

export const NoTitle: Story = {
  args: {
    type: 'Status',
    context: 'success',
    actionButton: true,
    showTitle: false,
    contentSlot: 'Banner content text (mandatory)',
    actionsSlot: 'Action Button',
  },
};

export const NoActions: Story = {
  args: {
    type: 'Status',
    context: 'info',
    actionButton: false,
    showTitle: true,
    titleSlot: 'Title (optional)',
    contentSlot: 'Banner content text (mandatory)',
  },
};
