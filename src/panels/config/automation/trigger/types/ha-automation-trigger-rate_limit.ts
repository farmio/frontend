import { css, html, LitElement, nothing } from "lit";
import { customElement, property, query } from "lit/decorators";
import memoizeOne from "memoize-one";
import { ensureArray } from "../../../../../common/array/ensure-array";
import { fireEvent } from "../../../../../common/dom/fire_event";
import type { LocalizeFunc } from "../../../../../common/translations/localize";
import "../../../../../components/ha-form/ha-form";
import type { SchemaUnion } from "../../../../../components/ha-form/types";
import type { RateLimitTrigger } from "../../../../../data/automation";
import { RATE_LIMIT_PERIODS } from "../../../../../data/automation";
import type { HomeAssistant } from "../../../../../types";
import "../ha-automation-trigger";
import type HaAutomationTrigger from "../ha-automation-trigger";
import type { TriggerElement } from "../ha-automation-trigger-row";
import { handleChangeEvent } from "../ha-automation-trigger-row";

@customElement("ha-automation-trigger-rate_limit")
export class HaRateLimitTrigger extends LitElement implements TriggerElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public trigger!: RateLimitTrigger;

  @property({ type: Boolean }) public disabled = false;

  @property({ type: Boolean }) public narrow = false;

  @property({ type: Boolean, attribute: "sidebar" }) public inSidebar = false;

  @property({ type: Boolean, attribute: "indent" }) public indent = false;

  @query("ha-automation-trigger")
  private _triggerElement?: HaAutomationTrigger;

  public static get defaultConfig(): RateLimitTrigger {
    return {
      trigger: "rate_limit",
      count: 1,
      per: "day",
      triggers: [],
    };
  }

  private _schema = memoizeOne(
    (localize: LocalizeFunc) =>
      [
        {
          name: "count",
          required: true,
          selector: { number: { mode: "box", min: 1 } },
        },
        {
          name: "per",
          required: true,
          selector: {
            select: {
              mode: "dropdown",
              options: RATE_LIMIT_PERIODS.map((period) => ({
                value: period,
                label: localize(
                  `ui.panel.config.automation.editor.triggers.type.rate_limit.periods.${period}`
                ),
              })),
            },
          },
        },
      ] as const
  );

  protected render() {
    const triggers = ensureArray(this.trigger.triggers);

    return html`
      ${
        !this.indent
          ? html`<ha-form
              .hass=${this.hass}
              .data=${this.trigger}
              .schema=${this._schema(this.hass.localize)}
              .disabled=${this.disabled}
              .computeLabel=${this._computeLabelCallback}
              @value-changed=${this._settingsChanged}
            ></ha-form>`
          : nothing
      }
      ${
        !this.inSidebar
          ? html`<ha-automation-trigger
              .triggers=${triggers}
              .hass=${this.hass}
              .disabled=${this.disabled}
              .narrow=${this.narrow}
              .optionsInSidebar=${this.indent}
              .name=${"triggers"}
              @value-changed=${this._valueChanged}
            ></ha-automation-trigger>`
          : nothing
      }
    `;
  }

  public expandAll() {
    this._triggerElement?.expandAll();
  }

  private _computeLabelCallback = (
    schema: SchemaUnion<ReturnType<typeof this._schema>>
  ): string =>
    this.hass.localize(
      `ui.panel.config.automation.editor.triggers.type.rate_limit.${schema.name}`
    );

  private _settingsChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    fireEvent(this, "value-changed", {
      value: { ...this.trigger, ...ev.detail.value },
    });
  }

  private _valueChanged(ev: CustomEvent): void {
    handleChangeEvent(this, ev);
  }

  static styles = css`
    ha-form + ha-automation-trigger {
      display: block;
      margin-top: var(--ha-space-4);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-automation-trigger-rate_limit": HaRateLimitTrigger;
  }
}
