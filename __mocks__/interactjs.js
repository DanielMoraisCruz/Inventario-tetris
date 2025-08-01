// Mock do Interact.js
const mockInteract = () => ({
  draggable: jest.fn(() => ({
    resizable: jest.fn(() => ({
      on: jest.fn(),
      unset: jest.fn()
    }))
  })),
  modifiers: {
    restrictRect: jest.fn(),
    restrictEdges: jest.fn(),
    restrictSize: jest.fn()
  }
});

module.exports = mockInteract();
module.exports.default = mockInteract(); 