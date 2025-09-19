import * as OBC from "@thatopen/components"
import * as FRAGS from "@thatopen/fragments"
import { DataEnhancerSource } from "./src";

export class DataEnhancer extends OBC.Component {
  static uuid = "d9d41a68-2606-4c61-9e86-af6b675758ef" as const
  enabled = true;

  readonly sources = new FRAGS.DataMap<string, DataEnhancerSource>()

  async getData(items: OBC.ModelIdMap) {
    for (const [modelId, _localIds] of Object.entries(items)) {
      const localIds = [..._localIds]
    }
  }
}