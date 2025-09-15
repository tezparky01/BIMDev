import * as OBC from "@thatopen/components"

export const setupItemsFinder = (components: OBC.Components) => {
  const finder = components.get(OBC.ItemsFinder);
  finder.create("Walls", [{ categories: [/WALL/] }])
  finder.create("Doors & Windows", [{ categories: [/DOOR/, /WINDOW/] }])
  finder.create("Structural Walls - 0.15m", [
    {
      attributes: {
        queries: [
          { name: /Name/, value: /0.15m - Muro Estructual/ }
        ]
      }
    }
  ])
}