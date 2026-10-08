import type { PropertyValues, TemplateResult } from "lit";
import { LitElement, css, html } from "lit";
import { customElement, query, state } from "lit/decorators";
import { classMap } from "lit/directives/class-map";
import { ensureArray } from "../../../../src/common/array/ensure-array";
import { mockAreaRegistry } from "../../../../demo/src/stubs/area_registry";
import { mockAuth } from "../../../../demo/src/stubs/auth";
import { mockConfig } from "../../../../demo/src/stubs/config";
import { mockConfigEntries } from "../../../../demo/src/stubs/config_entries";
import { mockDeviceAutomation } from "../../../../demo/src/stubs/device_automation";
import { mockDeviceRegistry } from "../../../../demo/src/stubs/device_registry";
import { mockEntityRegistry } from "../../../../demo/src/stubs/entity_registry";
import { mockHassioSupervisor } from "../../../../demo/src/stubs/hassio_supervisor";
import { mockIntegration } from "../../../../demo/src/stubs/integration";
import { mockTags } from "../../../../demo/src/stubs/tags";
import "../../../../src/components/ha-formfield";
import type {
  AutomationConfig,
  Condition,
  SidebarConfig,
  Trigger,
} from "../../../../src/data/automation";
import { makeDialogManager } from "../../../../src/dialogs/make-dialog-manager";
import { provideHass } from "../../../../src/fake_data/provide_hass";
import "../../../../src/panels/config/automation/condition/ha-automation-condition";
import { HaTriggerCondition } from "../../../../src/panels/config/automation/condition/types/ha-automation-condition-trigger";
import "../../../../src/panels/config/automation/ha-automation-sidebar";
import type HaAutomationSidebar from "../../../../src/panels/config/automation/ha-automation-sidebar";
import { AutomationTriggerController } from "../../../../src/panels/config/automation/trigger/automation-trigger-controller";
import "../../../../src/panels/config/automation/trigger/ha-automation-trigger";
import { HaConversationTrigger } from "../../../../src/panels/config/automation/trigger/types/ha-automation-trigger-conversation";
import { HaDeviceTrigger } from "../../../../src/panels/config/automation/trigger/types/ha-automation-trigger-device";
import { HaEventTrigger } from "../../../../src/panels/config/automation/trigger/types/ha-automation-trigger-event";
import { HaGeolocationTrigger } from "../../../../src/panels/config/automation/trigger/types/ha-automation-trigger-geo_location";
import { HaHassTrigger } from "../../../../src/panels/config/automation/trigger/types/ha-automation-trigger-homeassistant";
import { HaTriggerList } from "../../../../src/panels/config/automation/trigger/types/ha-automation-trigger-list";
import { HaNumericStateTrigger } from "../../../../src/panels/config/automation/trigger/types/ha-automation-trigger-numeric_state";
import { HaPersistentNotificationTrigger } from "../../../../src/panels/config/automation/trigger/types/ha-automation-trigger-persistent_notification";
import { HaRateLimitTrigger } from "../../../../src/panels/config/automation/trigger/types/ha-automation-trigger-rate_limit";
import { HaStateTrigger } from "../../../../src/panels/config/automation/trigger/types/ha-automation-trigger-state";
import { HaSunTrigger } from "../../../../src/panels/config/automation/trigger/types/ha-automation-trigger-sun";
import { HaTagTrigger } from "../../../../src/panels/config/automation/trigger/types/ha-automation-trigger-tag";
import { HaTemplateTrigger } from "../../../../src/panels/config/automation/trigger/types/ha-automation-trigger-template";
import { HaTimeTrigger } from "../../../../src/panels/config/automation/trigger/types/ha-automation-trigger-time";
import { HaTimePatternTrigger } from "../../../../src/panels/config/automation/trigger/types/ha-automation-trigger-time_pattern";
import { HaWebhookTrigger } from "../../../../src/panels/config/automation/trigger/types/ha-automation-trigger-webhook";
import { HaZoneTrigger } from "../../../../src/panels/config/automation/trigger/types/ha-automation-trigger-zone";
import type { HomeAssistant } from "../../../../src/types";
import "../../components/demo-black-white-row";

const SCHEMAS: { name: string; triggers: Trigger[] }[] = [
  {
    name: "Trigger group",
    triggers: [
      {
        ...HaTriggerList.defaultConfig,
        alias: "Someone arrives or leaves",
        triggers: [
          {
            trigger: "zone",
            entity_id: "person.person",
            zone: "zone.home",
            event: "enter",
          },
          {
            trigger: "zone",
            entity_id: "person.person",
            zone: "zone.home",
            event: "leave",
          },
        ],
      },
    ],
  },
  {
    name: "Rate limit",
    triggers: [
      {
        ...HaRateLimitTrigger.defaultConfig,
        triggers: [{ ...HaDeviceTrigger.defaultConfig }],
      },
      { trigger: "state", entity_id: "light.kitchen" },
    ],
  },
  {
    name: "State",
    triggers: [{ ...HaStateTrigger.defaultConfig }],
  },

  {
    name: "GeoLocation",
    triggers: [{ ...HaGeolocationTrigger.defaultConfig }],
  },

  {
    name: "Home Assistant",
    triggers: [{ ...HaHassTrigger.defaultConfig }],
  },

  {
    name: "Numeric State",
    triggers: [{ ...HaNumericStateTrigger.defaultConfig }],
  },

  {
    name: "Sun",
    triggers: [{ ...HaSunTrigger.defaultConfig }],
  },

  {
    name: "Time Pattern",
    triggers: [{ ...HaTimePatternTrigger.defaultConfig }],
  },

  {
    name: "Webhook",
    triggers: [{ ...HaWebhookTrigger.defaultConfig }],
  },

  {
    name: "Persistent Notification",
    triggers: [
      {
        ...HaPersistentNotificationTrigger.defaultConfig,
      },
    ],
  },

  {
    name: "Zone",
    triggers: [{ ...HaZoneTrigger.defaultConfig }],
  },

  {
    name: "Tag",
    triggers: [{ ...HaTagTrigger.defaultConfig }],
  },

  {
    name: "Time",
    triggers: [{ ...HaTimeTrigger.defaultConfig }],
  },

  {
    name: "Template",
    triggers: [{ ...HaTemplateTrigger.defaultConfig }],
  },

  {
    name: "Event",
    triggers: [{ ...HaEventTrigger.defaultConfig }],
  },

  {
    name: "Device Trigger",
    triggers: [{ ...HaDeviceTrigger.defaultConfig }],
  },
  {
    name: "Sentence",
    triggers: [
      { ...HaConversationTrigger.defaultConfig },
      {
        trigger: "conversation",
        command: ["Turn on the lights", "Turn the lights on"],
      },
    ],
  },
];

@customElement("demo-automation-editor-trigger")
export class DemoAutomationEditorTrigger extends LitElement {
  @state() private hass!: HomeAssistant;

  @state() private _disabled = false;

  @state() private _sidebarConfig?: SidebarConfig;

  @state() private _sidebarKey = 0;

  @state() private _conditions: Condition[] = [
    { ...HaTriggerCondition.defaultConfig },
  ];

  @query("ha-automation-sidebar")
  private _sidebarElement?: HaAutomationSidebar;

  private data: Trigger[][] = SCHEMAS.map((info) => info.triggers);

  // All demo triggers as one automation, so the trigger controller can resolve
  // "Triggered by" references the same way the real editor does. Only rebuilt on
  // changes, as the controller memoizes its options on the triggers reference.
  private _config: AutomationConfig = this._buildConfig();

  private _triggerController = new AutomationTriggerController(this, {
    getConfig: () => this._config,
    canEdit: () => !this._disabled,
    commit: (config) => this._applyConfig(config),
  });

  // Dialogs (like the add trigger dialog) are attached to this element and
  // need to be kept in sync with hass, as there is no app shell in the gallery.
  private _dialogElements = new Set<HTMLElement & { hass?: HomeAssistant }>();

  constructor() {
    super();
    makeDialogManager(this);
    const hass = provideHass(this);
    hass.updateTranslations(null, "en");
    hass.updateTranslations("config", "en");
    mockEntityRegistry(hass);
    mockDeviceRegistry(hass);
    mockAreaRegistry(hass);
    mockHassioSupervisor(hass);
    mockConfig(hass);
    mockConfigEntries(hass);
    mockIntegration(hass);
    mockDeviceAutomation(hass);
    mockTags(hass);
    mockAuth(hass);
  }

  public provideHass(el: HTMLElement & { hass?: HomeAssistant }) {
    this._dialogElements.add(el);
    el.hass = this.hass;
  }

  protected willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);
    if (changedProperties.has("_sidebarConfig")) {
      this._triggerController.checkShowIndices(this._sidebarConfig);
    }
  }

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (changedProperties.has("hass")) {
      this._dialogElements.forEach((el) => {
        el.hass = this.hass;
      });
    }
  }

  protected render(): TemplateResult {
    return html`
      <div
        class=${classMap({ page: true, "has-sidebar": !!this._sidebarConfig })}
        @open-sidebar=${this._openSidebar}
        @request-close-sidebar=${this._requestCloseSidebar}
        @close-sidebar=${this._handleCloseSidebar}
      >
        <div class="options">
          <ha-formfield label="Disabled">
            <ha-switch
              .name=${"disabled"}
              .checked=${this._disabled}
              @change=${this._handleOptionChange}
            ></ha-switch>
          </ha-formfield>
        </div>
        ${SCHEMAS.map(
          (info, sampleIdx) => html`
            <demo-black-white-row
              .title=${info.name}
              .value=${this.data[sampleIdx]}
            >
              ${["light", "dark"].map(
                (slot) => html`
                  <ha-automation-trigger
                    slot=${slot}
                    .hass=${this.hass}
                    .triggers=${this.data[sampleIdx]}
                    .sampleIdx=${sampleIdx}
                    .disabled=${this._disabled}
                    @value-changed=${this._handleValueChange}
                    root
                    sidebar
                  ></ha-automation-trigger>
                `
              )}
            </demo-black-white-row>
          `
        )}
        <demo-black-white-row
          .title=${"Triggered by (references the triggers above)"}
          .value=${this._conditions}
        >
          ${["light", "dark"].map(
            (slot) => html`
              <ha-automation-condition
                slot=${slot}
                .hass=${this.hass}
                .conditions=${this._conditions}
                .disabled=${this._disabled}
                @value-changed=${this._handleConditionChange}
                root
                sidebar
              ></ha-automation-condition>
            `
          )}
        </demo-black-white-row>
        <ha-automation-sidebar
          class=${classMap({ hidden: !this._sidebarConfig })}
          .hass=${this.hass}
          .config=${this._sidebarConfig}
          .disabled=${this._disabled}
          .sidebarKey=${this._sidebarKey}
          @value-changed=${this._sidebarConfigChanged}
        ></ha-automation-sidebar>
      </div>
    `;
  }

  private _handleValueChange(ev) {
    const sampleIdx = ev.target.sampleIdx;
    this.data[sampleIdx] = ev.detail.value;
    this._config = this._buildConfig();
    this.requestUpdate();
  }

  private _handleConditionChange(ev: CustomEvent) {
    ev.stopPropagation();
    this._conditions = ev.detail.value;
    this._config = this._buildConfig();
  }

  private _handleOptionChange(ev) {
    this[`_${ev.target.name}`] = ev.target.checked;
  }

  private _buildConfig(): AutomationConfig {
    return {
      triggers: this.data.flat(),
      conditions: this._conditions,
      actions: [],
    };
  }

  // The controller only changes IDs and references, never the number or order
  // of triggers, so the flat list can be split back into the demo samples.
  private _applyConfig(config: AutomationConfig) {
    const triggers = ensureArray(config.triggers);
    let offset = 0;
    this.data = this.data.map((sample) => {
      const next = triggers.slice(offset, offset + sample.length);
      offset += sample.length;
      return next;
    });
    this._conditions = ensureArray(config.conditions ?? []);
    this._config = config;
    this.requestUpdate();
  }

  private async _openSidebar(ev: CustomEvent<SidebarConfig>) {
    ev.stopPropagation();
    // deselect previous selected row
    this._sidebarConfig?.close?.();
    this._sidebarConfig = ev.detail;
    this._sidebarKey++;

    await this._sidebarElement?.updateComplete;
    this._sidebarElement?.focus();
  }

  private _sidebarConfigChanged(ev: CustomEvent) {
    ev.stopPropagation();
    if (!this._sidebarConfig) {
      return;
    }
    this._sidebarConfig = {
      ...this._sidebarConfig,
      ...ev.detail.value,
    };
  }

  private _requestCloseSidebar(ev: Event) {
    ev.stopPropagation();
    if (!this._sidebarConfig) {
      return;
    }
    if (this._sidebarElement) {
      this._sidebarElement.triggerCloseSidebar();
      return;
    }
    this._sidebarConfig.close();
    this._sidebarKey = 0;
  }

  private _handleCloseSidebar(ev: Event) {
    ev.stopPropagation();
    this._sidebarConfig = undefined;
  }

  static styles = css`
    .page {
      transition: padding-right 180ms ease-in-out;
    }
    .page.has-sidebar {
      padding-right: 432px;
    }
    .options {
      max-width: 800px;
      margin: 16px auto;
    }
    .options ha-formfield {
      margin-right: 16px;
    }
    ha-automation-sidebar {
      position: fixed;
      top: calc(var(--header-height, 64px) + 16px);
      right: 16px;
      width: 400px;
      height: calc(100vh - var(--header-height, 64px) - 32px);
      display: block;
    }
    ha-automation-sidebar.hidden {
      display: none;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "demo-automation-editor-trigger": DemoAutomationEditorTrigger;
  }
}
