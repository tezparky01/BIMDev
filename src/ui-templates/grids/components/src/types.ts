import * as BUI from "@thatopen/ui";
import { DataSourcesPanelState, ItemsDataPanelState, ModelsPanelState, QueriesPanelState, ClipperPanelState } from "../../../sections";

type Viewport = {
  name: "viewport";
  state: {};
}

export type ItemsData = {
  name: "itemsData";
  state: ItemsDataPanelState
}

export type Queries = {
  name: "queries";
  state: QueriesPanelState
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

export type Clipper = {
  name: "clipper";
  state: ClipperPanelState
}

type ComponentsGridElements = [Viewport, ItemsData, Models, Queries, DataSources, Quality, Clipper];
type ComponentsGridLayouts = ["Models", "Queries", "Viewer", "Quality", "Clipper"];

export type ComponentsGrid = BUI.Grid<ComponentsGridLayouts, ComponentsGridElements>