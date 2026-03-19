<template>
  <div
    role="presentation"
    class="monitor-preview"
    :data-setting-hovered="hoveredSettingId"
    :style="cssVariables({
      '--monitor': settings.monitor,
      '--monitor-label': colors.monitorLabel,
      '--list-header': settings.listHeader,
      '--list-header-text': colors.listHeaderText,
      '--variable-value': colors.variableValue,
      '--variable-value-text': colors.variableValueText,
      '--list-value': colors.listValue,
      '--list-value-text': colors.listValueText,
      '--monitor-radius': settings.monitorRadius + 'px',
      '--value-radius': settings.valueRadius + 'px',
    })"
  >
    <div
      class="monitor monitor-variable"
      @mouseenter="$emit('areahover', 'monitor')"
      @mouseleave="$emit('areahover', null)"
    >
      <div class="monitor-variable-label">{{ msg("myVariable") }}</div>
      <div
        class="monitor-variable-value"
        @mouseenter="$emit('areahover', 'customValueColor')"
        @mouseleave="$emit('areahover', 'monitor')"
      >
        123
      </div>
    </div>
    <div
      class="monitor monitor-list"
      @mouseenter="$emit('areahover', 'monitor')"
      @mouseleave="$emit('areahover', null)"
    >
      <div
        class="monitor-list-header"
        @mouseenter="$emit('areahover', 'listHeader')"
        @mouseleave="$emit('areahover', 'monitor')"
      >
        {{ msg("myList") }}
      </div>
      <div class="monitor-list-row">
        <div class="monitor-list-index">1</div>
        <div
          class="monitor-list-value"
          @mouseenter="$emit('areahover', 'customValueColor')"
          @mouseleave="$emit('areahover', 'monitor')"
        >
          {{ msg("thing") }}
        </div>
      </div>
    </div>
  </div>
</template>

<style>
  .monitor-preview {
    margin-top: 10px;
    width: max-content;
    padding: 6px;
    background: linear-gradient(45deg, #777 25%, transparent 25%), linear-gradient(-45deg, #777 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #777 75%), linear-gradient(-45deg, transparent 75%, #777 75%);
    background-color: white;
    background-size: 6px 6px;
    background-position:
      0 0,
      0 3px,
      3px -3px,
      -3px 0px;
    border: 1px solid var(--control-border);
    border-radius: 4px;
    user-select: none;
  }

  .monitor-preview * {
    transition: box-shadow 0.2s ease;
  }

  .monitor-preview[data-setting-hovered="monitor"] .monitor,
  .monitor-preview[data-setting-hovered="listHeader"] .monitor-list-header {
    box-shadow: 0 0 8px inset var(--orange);
  }

  .monitor-preview[data-setting-hovered="customValueColor"] .monitor-variable-value,
  .monitor-preview[data-setting-hovered="customValueColor"] .monitor-list-value,
  .monitor-preview[data-setting-hovered="monitorValueBg"] .monitor-variable-value,
  .monitor-preview[data-setting-hovered="monitorValueBg"] .monitor-list-value {
    box-shadow: 0 0 8px var(--blue);
  }

  .monitor {
    overflow: hidden;
    background-color: var(--monitor);
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: var(--monitor-radius);
    color: var(--monitor-label);
  }

  .monitor-variable {
    display: flex;
    padding: 3px;
  }

  .monitor-variable-label {
    margin: 0 5px;
    font-weight: bold;
  }

  .monitor-variable-value {
    margin: 0 5px;
    min-width: 40px;
    box-sizing: border-box;
    padding: 0 2px;
    background-color: var(--variable-value);
    border-radius: var(--value-radius);
    color: var(--variable-value-text);
    text-align: center;
  }

  .monitor-list {
    margin-top: 6px;
  }

  .monitor-list-header {
    padding: 3px;
    background-color: var(--list-header);
    border-bottom: 1px solid rgba(0, 0, 0, 0.15);
    color: var(--list-header-text);
    font-weight: bold;
    text-align: center;
  }

  .monitor-list-row {
    padding: 2px;
    display: flex;
    align-items: center;
  }

  .monitor-list-index {
    margin: 0 3px;
    font-weight: bold;
  }

  .monitor-list-value {
    flex-grow: 1;
    margin: 0 3px;
    min-width: 40px;
    box-sizing: border-box;
    padding: 3px 5px;
    background-color: var(--list-value);
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: var(--value-radius);
    color: var(--list-value-text);
  }
</style>
