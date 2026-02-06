import * as BUI from "@thatopen/ui";
import { DataSourcesPanelState, ItemsDataPanelState, ModelsPanelState } from "../../../sections";

type Viewport = {
  name: "viewport";
  state: {};
}

export type ItemsData = {
  name: "itemsData";
  state: ItemsDataPanelState
}

export type DataSources = {
  name: "datasources";
  state: DataSourcesPanelState
}

export type Models = {
  name: "models";
  state: ModelsPanelState
}

export type Quality = {
  name: "quality";
  state: import("../../../sections").QualityPanelState
}

type ComponentsGridElements = [Viewport, ItemsData, Models, DataSources, Quality];
type ComponentsGridLayouts = ["Models", "Viewer", "Quality"];

export type ComponentsGrid = BUI.Grid<ComponentsGridLayouts, ComponentsGridElements>