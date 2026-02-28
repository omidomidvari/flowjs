# flowjs

A tiny, dependency-free JavaScript library to display objects and simulate simple 2D physics.

Main file: `flow.js` (UMD compatible - can be used in Node and browser)

Features:
- Create circle bodies with mass, radius, color
- Simple gravity, damping and pairwise circle collisions
- `render` helper draws to a Canvas 2D context or falls back to console output

Quick start (Node):

```js
const Flow = require('./flow.js');
const a = Flow.createBody({ x: 100, y: 50, vx: 10 });
Flow.step(1/60);
Flow.render();
```

Run the example:

```powershell
node example.js
```

Run tests:

```powershell
node ./test/index.test.js
```

API (short):
- `Flow.create(options)` - returns an isolated simulation instance
- `Flow.createBody(opts)` - create a body in the default instance
- `Flow.step(dt)` - step the default sim by dt seconds
- `Flow.render(ctx)` - render (Canvas context or console fallback)

Notes and next steps:
- Add proper integration (RK) for stability
- Add edge/shape support (rectangles, polygons)
- Add browser demo with canvas and controls
- Add better test harness, CI, and packaging details for npm
