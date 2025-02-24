const commandCategories = {
  basic: {
    name: 'Basic Keys',
    options: [
      {
        type: 'key',
        options: [
          { label: 'A-Z Keys', code: 0x04 - 0x1d },
          { label: '0-9 Keys', code: 0x27 - 0x30 },
          { label: 'Enter', code: 0x28 },
          { label: 'Escape', code: 0x29 },
          { label: 'Backspace', code: 0x2a },
          { label: 'Tab', code: 0x2b },
          { label: 'Space', code: 0x2c }
        ]
      },
      {
        type: 'modifier',
        options: [
          { label: 'Left Control', code: 0xe0 },
          { label: 'Left Shift', code: 0xe1 },
          { label: 'Left Alt', code: 0xe2 },
          { label: 'Left GUI', code: 0xe3 }
        ]
      }
    ]
  },
  media: {
    name: 'Media Controls',
    options: [
      { label: 'Volume Up', code: 0xe9 },
      { label: 'Volume Down', code: 0xea },
      { label: 'Mute', code: 0xe2 },
      { label: 'Play/Pause', code: 0xcd },
      { label: 'Next Track', code: 0xb5 },
      { label: 'Previous Track', code: 0xb6 }
    ]
  },
  system: {
    name: 'System',
    options: [
      { label: 'Sleep', code: 0x82 },
      { label: 'Power', code: 0x81 },
      { label: 'Wake', code: 0x83 }
    ]
  },
  timing: {
    name: 'Timing',
    options: [
      {
        type: 'delay',
        label: 'Delay',
        min: 1,
        max: 5000,
        default: 100
      },
      {
        type: 'duration',
        label: 'Hold Duration',
        min: 1,
        max: 1000,
        default: 50
      }
    ]
  }
}
