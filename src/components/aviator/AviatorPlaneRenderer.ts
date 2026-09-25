/**
 * Aviator Vintage Red Propeller Aerobatic Plane & Sky Trajectory Canvas Renderer
 * Faithfully recreates the iconic Spribe Aviator red stunt plane graphics and flight mechanics.
 */

export interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

/**
 * Draws the iconic vintage red stunt monoplane with spinning propeller and realistic aviation details
 */
export function drawVintageAviatorPlane(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  propellerAngle: number,
  scale: number = 1.0,
  opacity: number = 1.0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.globalAlpha = opacity;

  // 1. Red Glow / Engine Aura
  ctx.shadowColor = 'rgba(239, 68, 68, 0.7)';
  ctx.shadowBlur = 14;

  // 2. Landing Gear (Undercarriage wheels & struts)
  ctx.save();
  ctx.shadowBlur = 0;
  // Main forward strut
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(5, 6);
  ctx.lineTo(1, 16);
  ctx.stroke();

  // Rubber tire
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.ellipse(1, 16, 5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Silver center hubcap
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(1, 16, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Rear tail skid
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-26, 4);
  ctx.lineTo(-29, 9);
  ctx.stroke();
  ctx.restore();

  // 3. Far Horizontal Tail Stabilizer (Opposite side)
  ctx.save();
  ctx.fillStyle = '#991b1b';
  ctx.beginPath();
  ctx.moveTo(-22, -2);
  ctx.lineTo(-34, -7);
  ctx.lineTo(-37, -5);
  ctx.lineTo(-28, 1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 4. Main Aerobatic Racing Fuselage
  ctx.beginPath();
  ctx.moveTo(24, 0); // Nose cone apex
  // Upper cowl curve to cockpit
  ctx.bezierCurveTo(20, -7, 10, -9, 2, -9);
  // Cockpit top ridge
  ctx.lineTo(-8, -9);
  // Rear spine sloping down to the tail
  ctx.bezierCurveTo(-18, -7, -27, -3, -34, 0);
  // Tail end block
  ctx.lineTo(-34, 3);
  // Underside belly contour
  ctx.bezierCurveTo(-24, 8, -6, 9, 5, 8);
  // Chin curve up to nose
  ctx.bezierCurveTo(15, 7, 22, 4, 24, 0);
  ctx.closePath();

  // Rich Aviator Cherry Red Gradient
  const fuseGrad = ctx.createLinearGradient(0, -9, 0, 9);
  fuseGrad.addColorStop(0, '#ff3b56'); // glossy highlight on top
  fuseGrad.addColorStop(0.35, '#e50926'); // iconic Aviator crimson
  fuseGrad.addColorStop(0.85, '#b91c1c'); // rich body red
  fuseGrad.addColorStop(1, '#6b030f'); // deep shadow on underside
  ctx.fillStyle = fuseGrad;
  ctx.fill();

  // Dark outline for crisp definition
  ctx.strokeStyle = '#4c020a';
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Horizontal racing highlight stripe along fuselage
  ctx.beginPath();
  ctx.moveTo(18, -2);
  ctx.lineTo(-22, -2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 5. Cockpit Canopy / Windshield
  ctx.beginPath();
  ctx.moveTo(6, -7);
  ctx.lineTo(-2, -8);
  ctx.lineTo(-7, -4);
  ctx.lineTo(4, -3);
  ctx.closePath();
  ctx.fillStyle = '#090d16';
  ctx.fill();
  // Glass highlight reflection
  ctx.beginPath();
  ctx.moveTo(4, -6.5);
  ctx.lineTo(-1, -7);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 6. High Vertical Tail Fin (Rudder)
  ctx.beginPath();
  ctx.moveTo(-24, -3);
  ctx.lineTo(-32, -20);
  ctx.lineTo(-40, -20);
  ctx.lineTo(-32, 1);
  ctx.closePath();
  const tailGrad = ctx.createLinearGradient(-40, -20, -24, 0);
  tailGrad.addColorStop(0, '#ff4762');
  tailGrad.addColorStop(1, '#b91c1c');
  ctx.fillStyle = tailGrad;
  ctx.fill();
  ctx.strokeStyle = '#4c020a';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // White rudder racing accent strip
  ctx.beginPath();
  ctx.moveTo(-33, -18);
  ctx.lineTo(-38, -18);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 7. Main Swept Red Wing (Near Side)
  ctx.beginPath();
  ctx.moveTo(10, 1);
  ctx.lineTo(-5, 20);
  ctx.lineTo(-14, 19);
  ctx.lineTo(-3, 0);
  ctx.closePath();
  const wingGrad = ctx.createLinearGradient(0, 0, 0, 20);
  wingGrad.addColorStop(0, '#ff2e4d');
  wingGrad.addColorStop(0.5, '#e50926');
  wingGrad.addColorStop(1, '#7a0512');
  ctx.fillStyle = wingGrad;
  ctx.fill();
  ctx.strokeStyle = '#4c020a';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Wing leading edge white sheen
  ctx.beginPath();
  ctx.moveTo(9, 2);
  ctx.lineTo(-4, 19);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 8. Nose Spinner Bullet Cone
  ctx.beginPath();
  ctx.moveTo(24, -4);
  ctx.quadraticCurveTo(31, 0, 24, 4);
  ctx.closePath();
  ctx.fillStyle = '#dc2626';
  ctx.fill();
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 9. Spinning Propeller Assembly
  ctx.save();
  ctx.translate(27, 0);

  // Propeller motion blur disk (translucent disc giving high-speed sensation)
  ctx.beginPath();
  ctx.ellipse(0, 0, 3, 20, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Fast spinning propeller blades
  ctx.rotate(propellerAngle);

  // Blade 1
  ctx.beginPath();
  ctx.ellipse(0, -10, 2.2, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // Blade 1 safety red tip
  ctx.beginPath();
  ctx.ellipse(0, -16, 2.2, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#e11d48';
  ctx.fill();

  // Blade 2 (opposite)
  ctx.beginPath();
  ctx.ellipse(0, 10, 2.2, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // Blade 2 safety red tip
  ctx.beginPath();
  ctx.ellipse(0, 16, 2.2, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#e11d48';
  ctx.fill();

  // Center spinner hub cap
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#e11d48';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.9;
  ctx.stroke();

  ctx.restore();

  ctx.restore();
}

/**
 * Draws coordinate runway grid and subtle Aviator brand watermark in background
 */
export function drawAviatorBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
) {
  // Clear with deep space black
  ctx.fillStyle = '#080b11';
  ctx.fillRect(0, 0, w, h);

  // Fine coordinate grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1;
  const step = 44;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Runway horizontal baseline at bottom
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h - 35);
  ctx.lineTo(w, h - 35);
  ctx.stroke();

  // Runway start markings
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(20 + i * 20, h - 33, 12, 2.5);
  }

  // Subtle Center Watermark (Aviator Spribe official style)
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.font = '900 64px "Chakra Petch", sans-serif';
  ctx.fillText('AVIATOR', w / 2, h / 2 - 20);
  ctx.restore();
}
