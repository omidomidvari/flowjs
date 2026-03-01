(function(root, factory){
  if (typeof module === 'object' && typeof module.exports === 'object') module.exports = factory();
  else root.Flow = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  // Minimal Flow.js - small 2D physics + render helper

  function now() { return Date.now(); }

  function extend(a, b){ for(var k in b) if(b.hasOwnProperty(k)) a[k]=b[k]; return a; }

  var defaults = {
    gravity: { x: 0, y: 600 }, // px/s^2
    friction: 0.999,
    restitution: 0.9 // bounce
  };

  function Body(opts){
    opts = opts || {};
    this.x = opts.x || 0;
    this.y = opts.y || 0;
    this.vx = opts.vx || 0;
    this.vy = opts.vy || 0;
    this.ax = 0;
    this.ay = 0;
    this.mass = (typeof opts.mass === 'number') ? opts.mass : 1;
    this.radius = (typeof opts.radius === 'number') ? opts.radius : 10;
    this.color = opts.color || '#3498db';
    this.static = !!opts.static;
    this.userData = opts.userData || null;
  }

  Body.prototype.applyForce = function(fx, fy){
    if(this.static) return;
    this.ax += fx / this.mass;
    this.ay += fy / this.mass;
  };

  function createFlow(options){
    var cfg = extend({}, defaults);
    if(options) extend(cfg, options);

    var bodies = [];

    function createBody(opts){
      var b = new Body(opts);
      bodies.push(b);
      return b;
    }

    function step(dt){
      // dt in seconds
      if(!dt || dt <= 0) return;

      // integrate forces
      for(var i=0;i<bodies.length;i++){
        var b = bodies[i];
        if(b.static) continue;
        // gravity
        b.applyForce(cfg.gravity.x * b.mass, cfg.gravity.y * b.mass);

        // integrate velocity
        b.vx += b.ax * dt;
        b.vy += b.ay * dt;

        // apply simple damping
        b.vx *= cfg.friction;
        b.vy *= cfg.friction;

        // integrate position
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // reset accel
        b.ax = 0; b.ay = 0;
      }

      // simple pairwise collision (circles)
      for(var a=0;a<bodies.length;a++){
        for(var b=a+1;b<bodies.length;b++){
          collide(bodies[a], bodies[b]);
        }
      }
    }

    function collide(b1, b2){
      var dx = b2.x - b1.x;
      var dy = b2.y - b1.y;
      var dist = Math.sqrt(dx*dx + dy*dy) || 1e-6;
      var minDist = b1.radius + b2.radius;
      if(dist < minDist){
        // overlap
        var overlap = (minDist - dist) / 2;
        var nx = dx / dist, ny = dy / dist;

        if(!b1.static){ b1.x -= nx * overlap; b1.y -= ny * overlap; }
        if(!b2.static){ b2.x += nx * overlap; b2.y += ny * overlap; }

        // relative velocity
        var rvx = b2.vx - b1.vx;
        var rvy = b2.vy - b1.vy;
        var velAlongNormal = rvx * nx + rvy * ny;
        if(velAlongNormal > 0) return; // moving apart

        var e = Math.min(cfg.restitution, cfg.restitution);
        var j = -(1 + e) * velAlongNormal;
        var invMass1 = b1.static ? 0 : 1 / b1.mass;
        var invMass2 = b2.static ? 0 : 1 / b2.mass;
        var invMassSum = invMass1 + invMass2 || 1;
        j = j / invMassSum;

        var impulseX = j * nx;
        var impulseY = j * ny;

        if(!b1.static){ b1.vx -= impulseX * invMass1; b1.vy -= impulseY * invMass1; }
        if(!b2.static){ b2.vx += impulseX * invMass2; b2.vy += impulseY * invMass2; }
      }
    }

    function render(ctx){
      // if a canvas context, draw circles
      if(ctx && typeof ctx.clearRect === 'function'){
        // try to detect canvas size
        try{
          var w = ctx.canvas && ctx.canvas.width || 300;
          var h = ctx.canvas && ctx.canvas.height || 150;
          ctx.clearRect(0,0,w,h);
        }catch(e){}
        for(var i=0;i<bodies.length;i++){
          var b = bodies[i];
          ctx.beginPath();
          ctx.fillStyle = b.color;
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2);
          ctx.fill();
        }
        return;
      }

      // fallback: simple console output of positions
      var out = bodies.map(function(b, idx){
        return idx+":"+Math.round(b.x)+","+Math.round(b.y);
      }).join(' | ');
      if(typeof console !== 'undefined' && console.log) console.log('[Flow] '+out);
    }

    function findBodies(filter){
      if(!filter) return bodies.slice();
      return bodies.filter(filter);
    }

    function reset(){ bodies.length = 0; }

    return {
      createBody: createBody,
      step: step,
      render: render,
      bodies: bodies,
      findBodies: findBodies,
      reset: reset,
      config: cfg
    };
  }

  // default singleton
  var Default = createFlow();

  return {
    create: createFlow,
    default: Default,
    // convenience: use singleton methods
    createBody: function(opts){ return Default.createBody(opts); },
    step: function(dt){ return Default.step(dt); },
    render: function(ctx){ return Default.render(ctx); },
    bodies: Default.bodies,
    config: Default.config
  };
});
