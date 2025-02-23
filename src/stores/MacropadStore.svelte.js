export function createMacropadState() {
  let selectedComponent = $state(null)
  let selectedComponentType = $state(null)

  return {
    get selectedComponent() {
      return selectedComponent
    },
    set selectedComponent(x) {
      selectedComponent = x
    },
    get selectedComponentType() {
      return selectedComponentType // This was returning selectedComponent
    },
    set selectedComponentType(x) {
      selectedComponentType = x
    }
  }
}

export const MacropadState = createMacropadState()
