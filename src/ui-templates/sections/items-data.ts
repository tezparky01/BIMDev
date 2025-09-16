import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as CUI from "@thatopen/ui-obc"
import * as OBF from "@thatopen/components-front"
import { appIcons } from "../../globals";

export interface ItemsDataPanelState {
  components: OBC.Components;
}

export const itemsDataPanelTemplate: BUI.StatefullComponent<
  ItemsDataPanelState
> = (state) => {
  const { components } = state;

  const highlighter = components.get(OBF.Highlighter)

  const [propsTable, updatePropsTable] = CUI.tables.itemsData({
    components,
    modelIdMap: {},
  });

  highlighter.events.select.onClear.add(() => {
    updatePropsTable({modelIdMap: {}})
  })

  const onRefresh = () => {
    const selection = highlighter.selection.select
    if (OBC.ModelIdMapUtils.isEmpty(selection)) return
    updatePropsTable({modelIdMap: selection})
  }

  return BUI.html`<bim-panel-section fixed label="Selection Data">
    <div style="display: flex; gap: 0.5rem;">
      <bim-button style="flex: 0" icon=${appIcons.REFRESH} @click=${onRefresh}></bim-button>
    </div>
    ${propsTable}
  </bim-panel-section>`;
};
