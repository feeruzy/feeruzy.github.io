const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let stars = [];
const numStars = 100;

// Enhanced comet definition
let comet = {
  x: -150,
  y: 0,
  size: 6,
  tailLength: 150,
  trail: [],
  tailParticles: [],
  glowSize: 12,
  lastParticleTime: 0,
  // Parameters for elliptical orbit
  a: 500, // semi-major axis
  b: 300, // semi-minor axis
  centerX: 0, // will be set based on canvas width
  centerY: 0, // will be set based on canvas height
  angle: Math.PI, // starting angle
  speed: 0.002, // angular velocity
  direction: 1 // 1 for counterclockwise, -1 for clockwise
};

// Enhanced moon configuration
const moonConfig = {
  radius: 60,
  craterCount: 12,
  craterSizeRange: [3, 8],
  glowRadius: 30,
  orbitalObjects: []
};

// Galaxy configuration
const galaxyConfig = {
  count: 3,
  minSize: 100,
  maxSize: 300,
  rotationSpeed: 0.0005,
  galaxies: []
};

// Graph background settings
const gridConfig = {
  lineSpacing: 30, // Reduced spacing for more lines
  color: "rgba(50, 70, 120, 0.15)",
  dashSize: 2,
  nodes: {
    count: 20, // Number of nodes to create
    size: 3,
    color: "rgba(100, 150, 220, 0.4)",
    glowColor: "rgba(100, 150, 220, 0.2)",
    connections: 3, // Max connections per node
    nodes: [] // Will store node data
  }
};

// Moon craters
let moonCraters = [];

// Language switching function
function toggleLanguage(lang) {
  document.getElementById('btn-en').classList.remove('active');
  document.getElementById('btn-fa').classList.remove('active');
  document.getElementById('content-en').classList.remove('active');
  document.getElementById('content-fa').classList.remove('active');
  
  if (lang === 'en') {
    document.getElementById('btn-en').classList.add('active');
    document.getElementById('content-en').classList.add('active');
  } else {
    document.getElementById('btn-fa').classList.add('active');
    document.getElementById('content-fa').classList.add('active');
  }
}

// Initialize galaxies
function initGalaxies() {
  galaxyConfig.galaxies = [];
  
  for (let i = 0; i < galaxyConfig.count; i++) {
    const size = galaxyConfig.minSize + Math.random() * (galaxyConfig.maxSize - galaxyConfig.minSize);
    
    // Create different galaxy types
    const type = Math.floor(Math.random() * 3); // 0=spiral, 1=elliptical, 2=irregular
    
    const colors = [
      // Spiral galaxies - blue/white
      ["rgba(150, 180, 255, 0.2)", "rgba(200, 220, 255, 0.3)", "rgba(255, 255, 255, 0.4)"],
      // Elliptical galaxies - yellow/red
      ["rgba(255, 180, 100, 0.2)", "rgba(255, 200, 150, 0.3)", "rgba(255, 230, 200, 0.4)"],
      // Irregular galaxies - blue/purple
      ["rgba(130, 100, 220, 0.2)", "rgba(180, 150, 255, 0.3)", "rgba(200, 180, 255, 0.4)"]
    ];
    
    // Make sure galaxies don't overlap with the moon
    let x, y;
    let overlapping = true;
    while (overlapping) {
      x = size/2 + Math.random() * (canvas.width - size);
      y = size/2 + Math.random() * (canvas.height - size);
      
      // Check distance from moon
      const moonX = canvas.width * 0.8;
      const moonY = canvas.height * 0.2;
      const dx = x - moonX;
      const dy = y - moonY;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      // If far enough from moon, we're good
      if (distance > moonConfig.radius + size/2 + 50) {
        overlapping = false;
      }
    }
    
    galaxyConfig.galaxies.push({
      x,
      y,
      size,
      type,
      colors: colors[type],
      rotation: Math.random() * Math.PI * 2,
      armCount: 2 + Math.floor(Math.random() * 3) * 2, // 2, 4, or 6 arms
      density: 0.5 + Math.random() * 0.5,
      particles: []
    });
    
    // Generate galaxy particles based on type
    generateGalaxyParticles(galaxyConfig.galaxies[galaxyConfig.galaxies.length - 1]);
  }
}

// Generate particles for a galaxy
function generateGalaxyParticles(galaxy) {
  galaxy.particles = [];
  
  const numParticles = Math.floor(galaxy.size * galaxy.size * 0.03 * galaxy.density);
  
  for (let i = 0; i < numParticles; i++) {
    let r, theta, opacity, size;
    
    if (galaxy.type === 0) { // Spiral
      // Logarithmic spiral pattern r = a * e^(b * theta)
      theta = Math.random() * Math.PI * 2;
      const arm = Math.floor(Math.random() * galaxy.armCount);
      const armOffset = (Math.PI * 2 / galaxy.armCount) * arm;
      theta = theta + armOffset;
      
      // Distance from center follows a distribution that peaks away from center
      const a = 5;
      const b = 0.2;
      r = a * Math.exp(b * theta) * Math.random() * galaxy.size/2.5;
      
      // Adjust to fit within galaxy size
      if (r > galaxy.size/2) {
        r = galaxy.size/2 * (0.7 + Math.random() * 0.3);
      }
      
      // Particles are brighter in the arms
      opacity = 0.4 + Math.random() * 0.6;
      size = 1 + Math.random() * 1.5;
      
    } else if (galaxy.type === 1) { // Elliptical
      // Distance from center - more concentrated at the center
      r = Math.random() * Math.random() * galaxy.size/2;
      theta = Math.random() * Math.PI * 2;
      
      // Particles fade out toward edges
      opacity = 0.3 + Math.random() * 0.5 * (1 - r/(galaxy.size/2));
      size = 0.8 + Math.random() * 1.2;
      
    } else { // Irregular
      // Random distribution but with clumps
      r = Math.random() * galaxy.size/2;
      theta = Math.random() * Math.PI * 2;
      
      // Add some clumping
      if (Math.random() > 0.7) {
        r = r * 0.6;
        opacity = 0.5 + Math.random() * 0.5;
        size = 1 + Math.random() * 2;
      } else {
        opacity = 0.2 + Math.random() * 0.4;
        size = 0.8 + Math.random() * 1;
      }
    }
    
    // Convert polar to cartesian
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    
    // Choose color based on position in galaxy
    const colorIndex = Math.min(2, Math.floor(r / (galaxy.size/2) * 3));
    
    galaxy.particles.push({
      x,
      y,
      r,
      theta,
      size,
      opacity,
      color: galaxy.colors[colorIndex]
    });
  }
}

// Initialize graph nodes
function initGraphNodes() {
  gridConfig.nodes.nodes = [];
  
  for (let i = 0; i < gridConfig.nodes.count; i++) {
    gridConfig.nodes.nodes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: gridConfig.nodes.size * (0.5 + Math.random() * 0.5),
      connections: []
    });
  }
  
  // Create connections between nodes
  for (let i = 0; i < gridConfig.nodes.nodes.length; i++) {
    const node = gridConfig.nodes.nodes[i];
    
    // Find nearest nodes
    const others = [...gridConfig.nodes.nodes];
    others.splice(i, 1); // Remove this node
    
    // Sort by distance
    others.sort((a, b) => {
      const distA = Math.sqrt(Math.pow(node.x - a.x, 2) + Math.pow(node.y - a.y, 2));
      const distB = Math.sqrt(Math.pow(node.x - b.x, 2) + Math.pow(node.y - b.y, 2));
      return distA - distB;
    });
    
    // Connect to the closest nodes
    const connectCount = Math.floor(Math.random() * gridConfig.nodes.connections) + 1;
    for (let j = 0; j < connectCount && j < others.length; j++) {
      // Check if this connection already exists
      const exists = node.connections.some(conn => conn.index === gridConfig.nodes.nodes.indexOf(others[j]));
      
      if (!exists) {
        node.connections.push({
          index: gridConfig.nodes.nodes.indexOf(others[j]),
          opacity: 0.1 + Math.random() * 0.2
        });
      }
    }
  }
}

// Create a new comet tail particle
function createCometParticle(isInitial = false) {
  const offsetY = (Math.random() - 0.5) * 15;
  const offsetX = (Math.random() - 0.5) * 15;
  const distance = isInitial ? Math.random() * comet.tailLength : 0;
  const fadeSpeed = 0.01 + Math.random() * 0.02;
  
  // Calculate angle of comet's current motion
  const nextAngle = comet.angle + comet.speed * comet.direction;
  const currentX = comet.centerX + comet.a * Math.cos(comet.angle);
  const currentY = comet.centerY + comet.b * Math.sin(comet.angle);
  const nextX = comet.centerX + comet.a * Math.cos(nextAngle);
  const nextY = comet.centerY + comet.b * Math.sin(nextAngle);
  
  // Calculate direction vector
  const directionX = nextX - currentX;
  const directionY = nextY - currentY;
  
  // Normalize direction vector
  const length = Math.sqrt(directionX * directionX + directionY * directionY);
  const normalizedDirX = directionX / length;
  const normalizedDirY = directionY / length;
  
  // Calculate perpendicular vector for offset
  const perpX = -normalizedDirY;
  const perpY = normalizedDirX;
  
  // Create the particle position with offset
  const particleX = comet.x + offsetX * perpX - (isInitial ? distance * normalizedDirX : 0);
  const particleY = comet.y + offsetY * perpY - (isInitial ? distance * normalizedDirY : 0);
  
  comet.tailParticles.push({
    x: particleX,
    y: particleY,
    size: 1 + Math.random() * 2,
    opacity: isInitial ? Math.random() * 0.8 : 0.8 + Math.random() * 0.2,
    speed: comet.speed * (0.2 + Math.random() * 0.5) * 500, // Adjusted for orbital speed
    fadeSpeed: fadeSpeed,
    color: Math.random() > 0.7 ? "#a0c0ff" : "#ffffff",
    dirX: -normalizedDirX,
    dirY: -normalizedDirY
  });
}

// Initialize comet tail particles
function initCometTailParticles() {
  comet.tailParticles = [];
  for (let i = 0; i < 25; i++) {
    createCometParticle(true);
  }
}

// Initialize orbital objects around the moon
function initOrbitalObjects() {
  moonConfig.orbitalObjects = [];
  const count = 3;
  
  for (let i = 0; i < count; i++) {
    moonConfig.orbitalObjects.push({
      angle: Math.random() * Math.PI * 2,
      distance: moonConfig.radius * (1.2 + Math.random() * 0.5),
      size: 1 + Math.random() * 2,
      speed: 0.001 + Math.random() * 0.002,
      color: Math.random() > 0.5 ? "#ffffff" : "#a0c0ff"
    });
  }
}

// Initialize moon craters
function initMoonCraters() {
  moonCraters = [];
  for (let i = 0; i < moonConfig.craterCount; i++) {
    let angle = Math.random() * Math.PI * 2;
    let distance = Math.random() * moonConfig.radius * 0.8;
    let craterRadius = moonConfig.craterSizeRange[0] + 
                      Math.random() * (moonConfig.craterSizeRange[1] - moonConfig.craterSizeRange[0]);
    moonCraters.push({ 
      angle, 
      distance, 
      radius: craterRadius,
      depth: 0.3 + Math.random() * 0.7
    });
  }
}

// Initialize all moon features
function initMoonFeatures() {
  initMoonCraters();
  initOrbitalObjects();
}

// Resize canvas and reinitialize objects
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Set comet orbit parameters based on canvas size
  comet.centerX = canvas.width * 0.5;
  comet.centerY = canvas.height * 0.5;
  comet.a = canvas.width * 0.4; // Horizontal radius 
  comet.b = canvas.height * 0.3; // Vertical radius
  
  // Update comet position based on angle
  comet.x = comet.centerX + comet.a * Math.cos(comet.angle);
  comet.y = comet.centerY + comet.b * Math.sin(comet.angle);
  
  // Reinitialize everything
  initMoonFeatures();
  initCometTailParticles();
  initGalaxies();
  initGraphNodes();
}

// Initialize stars
function initStars() {
  stars = [];
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      speed: 0.5 + Math.random(),
      angle: Math.random() * 2 * Math.PI
    });
  }
}

// Draw graph background with nodes
function drawGraphBackground() {
  ctx.save();
  
  // Draw grid lines
  ctx.strokeStyle = gridConfig.color;
  ctx.lineWidth = 1;
  ctx.setLineDash([gridConfig.dashSize, gridConfig.dashSize]);
  
  // Draw vertical lines
  for (let x = gridConfig.lineSpacing; x < canvas.width; x += gridConfig.lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  
  // Draw horizontal lines
  for (let y = gridConfig.lineSpacing; y < canvas.height; y += gridConfig.lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Draw more pronounced axes
  ctx.strokeStyle = "rgba(70, 90, 140, 0.25)";
  ctx.lineWidth = 1.5;
  
  // Center horizontal line
  ctx.beginPath();
  ctx.moveTo(0, canvas.height/2);
  ctx.lineTo(canvas.width, canvas.height/2);
  ctx.stroke();
  
  // Center vertical line
  ctx.beginPath();
  ctx.moveTo(canvas.width/2, 0);
  ctx.lineTo(canvas.width/2, canvas.height);
  ctx.stroke();
  
  // Draw nodes and connections
  ctx.setLineDash([]); // Reset line dash
  
  // First draw connections
  for (let i = 0; i < gridConfig.nodes.nodes.length; i++) {
    const node = gridConfig.nodes.nodes[i];
    
    for (let j = 0; j < node.connections.length; j++) {
      const conn = node.connections[j];
      const targetNode = gridConfig.nodes.nodes[conn.index];
      
      // Draw connection
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(targetNode.x, targetNode.y);
      ctx.strokeStyle = `rgba(100, 150, 220, ${conn.opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  
  // Then draw nodes on top
  for (let i = 0; i < gridConfig.nodes.nodes.length; i++) {
    const node = gridConfig.nodes.nodes[i];
    
    // Draw node glow
    const glowSize = node.size * 3;
    const glow = ctx.createRadialGradient(
      node.x, node.y, node.size / 2,
      node.x, node.y, glowSize
    );
    glow.addColorStop(0, gridConfig.nodes.glowColor);
    glow.addColorStop(1, "rgba(100, 150, 220, 0)");
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
    
    // Draw node
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
    ctx.fillStyle = gridConfig.nodes.color;
    ctx.fill();
  }
  
  ctx.restore();
}

// Draw galaxies
function drawGalaxies() {
  ctx.save();
  
  for (let galaxy of galaxyConfig.galaxies) {
    // Update rotation
    galaxy.rotation += galaxyConfig.rotationSpeed * (galaxy.type === 0 ? 1 : 0.2); // Spiral galaxies rotate faster
    
    // Draw each particle
    for (let i = 0; i < galaxy.particles.length; i++) {
      const particle = galaxy.particles[i];
      
      // For spiral galaxies, rotate the particles
      let x = particle.x;
      let y = particle.y;
      
      if (galaxy.type === 0) {
        // Update theta for rotation
        particle.theta += galaxyConfig.rotationSpeed * (1 - particle.r / galaxy.size);
        
        // Convert polar to cartesian
        x = particle.r * Math.cos(particle.theta);
        y = particle.r * Math.sin(particle.theta);
      }
      
      // Apply rotation to all galaxies
      const rotatedX = x * Math.cos(galaxy.rotation) - y * Math.sin(galaxy.rotation);
      const rotatedY = x * Math.sin(galaxy.rotation) + y * Math.cos(galaxy.rotation);
      
      // Draw the particle
      ctx.beginPath();
      ctx.arc(
        galaxy.x + rotatedX, 
        galaxy.y + rotatedY, 
        particle.size, 
        0, 
        Math.PI * 2
      );
      ctx.fillStyle = particle.color.replace(")", `, ${particle.opacity})`);
      ctx.fill();
    }
  }
  
  ctx.restore();
}

// Draw a star with glow effect
function drawStar(star) {
  const gradient = ctx.createRadialGradient(
    star.x,
    star.y,
    star.radius * 0.3,
    star.x,
    star.y,
    star.radius
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  
  ctx.save();
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 8;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Draw enhanced moon with craters and orbiting objects
function drawMoon() {
  const moonX = canvas.width * 0.8;
  const moonY = canvas.height * 0.2;
  const moonRadius = moonConfig.radius;
  
  // Draw moon glow
  ctx.save();
  const glowGradient = ctx.createRadialGradient(
    moonX, moonY, moonRadius,
    moonX, moonY, moonRadius + moonConfig.glowRadius
  );
  glowGradient.addColorStop(0, "rgba(200, 200, 255, 0.3)");
  glowGradient.addColorStop(1, "rgba(200, 200, 255, 0)");
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius + moonConfig.glowRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Draw moon base
  ctx.save();
  ctx.shadowColor = "#8e9eff";
  ctx.shadowBlur = 20;
  
  // Enhanced gradient for more realistic moon
  const moonGradient = ctx.createRadialGradient(
    moonX - moonRadius * 0.2,
    moonY - moonRadius * 0.2,
    moonRadius * 0.1,
    moonX,
    moonY,
    moonRadius
  );
  moonGradient.addColorStop(0, "#e1e1ff");
  moonGradient.addColorStop(0.3, "#c4c4db");
  moonGradient.addColorStop(0.7, "#9090a8");
  moonGradient.addColorStop(1, "#70708a");
  
  ctx.fillStyle = moonGradient;
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw craters with 3D effect
  for (let crater of moonCraters) {
    let craterX = moonX + Math.cos(crater.angle) * crater.distance;
    let craterY = moonY + Math.sin(crater.angle) * crater.distance;
    
    // Crater outer rim highlight
    ctx.beginPath();
    ctx.arc(craterX, craterY, crater.radius + 1, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fill();
    
    // Crater inner shadow
    ctx.beginPath();
    ctx.arc(craterX, craterY, crater.radius, 0, Math.PI * 2);
    
    // Create 3D effect with gradient
    const craterGradient = ctx.createRadialGradient(
      craterX - crater.radius * 0.3,
      craterY - crater.radius * 0.3,
      0,
      craterX,
      craterY,
      crater.radius
    );
    craterGradient.addColorStop(0, "rgba(60, 60, 70, " + crater.depth + ")");
    craterGradient.addColorStop(1, "rgba(40, 40, 50, " + crater.depth + ")");
    
    ctx.fillStyle = craterGradient;
    ctx.fill();
  }
  
  // Draw orbital objects (satellites, etc)
  for (let obj of moonConfig.orbitalObjects) {
    // Update angle
    obj.angle += obj.speed;
    
    // Calculate position
    const objX = moonX + Math.cos(obj.angle) * obj.distance;
    const objY = moonY + Math.sin(obj.angle) * obj.distance;
    
    // Draw orbit path (faint)
    ctx.beginPath();
    ctx.arc(moonX, moonY, obj.distance, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.stroke();
    
    // Draw object
    ctx.beginPath();
    ctx.arc(objX, objY, obj.size, 0, Math.PI * 2);
    ctx.fillStyle = obj.color;
    ctx.fill();
    
    // Add a glow effect
    ctx.beginPath();
    ctx.arc(objX, objY, obj.size * 2, 0, Math.PI * 2);
    const objGlow = ctx.createRadialGradient(
      objX, objY, obj.size * 0.5,
      objX, objY, obj.size * 2
    );
    objGlow.addColorStop(0, "rgba(255, 255, 255, 0.3)");
    objGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = objGlow;
    ctx.fill();
  }
  
  ctx.restore();
}

// Draw comet with realistic elliptical orbit
function drawComet() {
  // Update comet position along elliptical orbit
  comet.angle += comet.speed * comet.direction;
  comet.x = comet.centerX + comet.a * Math.cos(comet.angle);
  comet.y = comet.centerY + comet.b * Math.sin(comet.angle);
  
  // Save current position for trail
  comet.trail.push({ x: comet.x, y: comet.y });
  if (comet.trail.length > 25) {
    comet.trail.shift();
  }
  
  // Emit new particles based on time
  if (Date.now() - comet.lastParticleTime > 50) {
    createCometParticle();
    comet.lastParticleTime = Date.now();
  }
  
  // Update and draw tail particles
  ctx.save();
  for (let i = comet.tailParticles.length - 1; i >= 0; i--) {
    const particle = comet.tailParticles[i];
    
    // Update position based on direction vector
    particle.x += particle.dirX * particle.speed;
    particle.y += particle.dirY * particle.speed;
    
    // Fade out
    particle.opacity -= particle.fadeSpeed;
    
    // Remove faded particles
    if (particle.opacity <= 0) {
      comet.tailParticles.splice(i, 1);
      continue;
    }
    
    // Draw particle
    const particleGradient = ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, particle.size
    );
    particleGradient.addColorStop(0, `rgba(255, 255, 255, ${particle.opacity})`);
    particleGradient.addColorStop(1, `rgba(160, 190, 255, 0)`);
    
    ctx.fillStyle = particleGradient;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Calculate tail direction based on orbital motion
  const nextAngle = comet.angle + comet.speed * comet.direction;
  const nextX = comet.centerX + comet.a * Math.cos(nextAngle);
  const nextY = comet.centerY + comet.b * Math.sin(nextAngle);
  
  const directionX = comet.x - nextX;
  const directionY = comet.y - nextY;
  
  // Normalize and scale for tail length
  const length = Math.sqrt(directionX * directionX + directionY * directionY);
  const normalizedDirX = directionX / length;
  const normalizedDirY = directionY / length;
  
  const tailEndX = comet.x + normalizedDirX * comet.tailLength;
  const tailEndY = comet.y + normalizedDirY * comet.tailLength;
  
  // Calculate control points for curved tail
  const perpX = -normalizedDirY; // Perpendicular to direction
  const perpY = normalizedDirX;
  
  const controlX = comet.x + normalizedDirX * comet.tailLength * 0.5 + perpX * 15;
  const controlY = comet.y + normalizedDirY * comet.tailLength * 0.5 + perpY * 15;
  
  // Draw the long distinctive tail with gradient
  ctx.beginPath();
  ctx.moveTo(comet.x, comet.y);
  
  // Create a curve for the tail
  ctx.quadraticCurveTo(controlX, controlY, tailEndX, tailEndY);
  ctx.lineTo(tailEndX + perpX * 10, tailEndY + perpY * 10);
  ctx.quadraticCurveTo(controlX + perpX * 5, controlY + perpY * 5, comet.x, comet.y);
  
  // Create gradient for the tail
  const tailGradient = ctx.createLinearGradient(
    comet.x, comet.y,
    tailEndX, tailEndY
  );
  tailGradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
  tailGradient.addColorStop(0.2, "rgba(180, 210, 255, 0.5)");
  tailGradient.addColorStop(0.6, "rgba(100, 150, 255, 0.3)");
  tailGradient.addColorStop(1, "rgba(70, 100, 255, 0)");
  
  ctx.fillStyle = tailGradient;
  ctx.fill();
  
  // Draw a smaller inner tail with brighter color
  ctx.beginPath();
  ctx.moveTo(comet.x, comet.y);
  const innerTailLength = comet.tailLength * 0.7;
  const innerTailEndX = comet.x + normalizedDirX * innerTailLength;
  const innerTailEndY = comet.y + normalizedDirY * innerTailLength;
  
  ctx.lineTo(innerTailEndX + perpX * 2, innerTailEndY + perpY * 2);
  ctx.lineTo(innerTailEndX - perpX * 2, innerTailEndY - perpY * 2);
  ctx.closePath();
  
  const innerTailGradient = ctx.createLinearGradient(
    comet.x, comet.y,
    innerTailEndX, innerTailEndY
  );
  innerTailGradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  innerTailGradient.addColorStop(1, "rgba(200, 230, 255, 0)");
  
  ctx.fillStyle = innerTailGradient;
  ctx.fill();
  
  // Draw the comet head (nucleus)
  const headGradient = ctx.createRadialGradient(
    comet.x, comet.y, 0,
    comet.x, comet.y, comet.glowSize
  );
  headGradient.addColorStop(0, "#ffffff");
  headGradient.addColorStop(0.3, "#e0e8ff");
  headGradient.addColorStop(0.7, "rgba(160, 190, 255, 0.4)");
  headGradient.addColorStop(1, "rgba(120, 160, 255, 0)");
  
  ctx.fillStyle = headGradient;
  ctx.beginPath();
  ctx.arc(comet.x, comet.y, comet.glowSize, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw the bright core
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(comet.x, comet.y, comet.size, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

// Draw elliptical orbit path (subtle visualization)
function drawOrbitPath() {
  ctx.save();
  ctx.strokeStyle = "rgba(100, 120, 180, 0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(
    comet.centerX, 
    comet.centerY, 
    comet.a, 
    comet.b, 
    0, 
    0, 
    Math.PI * 2
  );
  ctx.stroke();
  ctx.restore();
}

// Main animation loop
function animate() {
  const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGradient.addColorStop(0, "#000428");
  bgGradient.addColorStop(1, "#004e92");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw galaxies first (background layer)
  drawGalaxies();
  
  // Draw graph background
  drawGraphBackground();
  
  // Draw orbit path (subtle visualization)
  drawOrbitPath();
  
  // Draw stars
  stars.forEach(star => {
    star.x += Math.cos(star.angle) * star.speed * 0.1;
    star.y += Math.sin(star.angle) * star.speed * 0.1;
    if (star.x < 0) star.x = canvas.width;
    if (star.x > canvas.width) star.x = 0;
    if (star.y < 0) star.y = canvas.height;
    if (star.y > canvas.height) star.y = 0;
    drawStar(star);
  });
  
  // Draw moon
  drawMoon();
  
  // Draw comet
  drawComet();
  
  requestAnimationFrame(animate);
}

// Setup
window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', function() {
  resizeCanvas();
  initStars();
  initCometTailParticles();
  animate();
});