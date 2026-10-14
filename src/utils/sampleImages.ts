/**
 * Procedural sample image generator using HTML5 Canvas & Vector graphics.
 * This guarantees zero external network dependency, zero broken images, and instant availability.
 */

function createDataUri(width: number, height: number, painter: (ctx: CanvasRenderingContext2D) => void): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    painter(ctx);
  }
  return canvas.toDataURL('image/png');
}

export const SAMPLE_IMAGES = {
  // 1. Portrait Sample for Background Removal, Headshot, Face Cutout
  portrait: () => {
    return createDataUri(600, 750, (ctx) => {
      // Background gradient (warm studio gradient to be removed)
      const bgGrad = ctx.createLinearGradient(0, 0, 600, 750);
      bgGrad.addColorStop(0, '#f8fafc');
      bgGrad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 600, 750);

      // Studio light accents
      const halo = ctx.createRadialGradient(300, 300, 50, 300, 300, 280);
      halo.addColorStop(0, 'rgba(255, 237, 213, 0.4)');
      halo.addColorStop(1, 'transparent');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, 600, 750);

      // Torso / Shoulders
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(300, 650, 220, 160, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shirt collar
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.moveTo(270, 520);
      ctx.lineTo(300, 570);
      ctx.lineTo(330, 520);
      ctx.closePath();
      ctx.fill();

      // Neck
      ctx.fillStyle = '#e2a77a';
      ctx.fillRect(270, 420, 60, 110);

      // Head shape
      ctx.fillStyle = '#f5cba7';
      ctx.beginPath();
      ctx.ellipse(300, 340, 115, 145, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.ellipse(300, 260, 125, 90, 0, 0, Math.PI * 2);
      ctx.fill();
      // Flowing hair sides
      ctx.beginPath();
      ctx.ellipse(195, 340, 35, 100, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(405, 340, 35, 100, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.ellipse(255, 335, 12, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(345, 335, 12, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Smile
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(300, 395, 25, 0.2, Math.PI - 0.2);
      ctx.stroke();

      // Gentle cheek blush
      ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
      ctx.beginPath();
      ctx.arc(240, 365, 20, 0, Math.PI * 2);
      ctx.arc(360, 365, 20, 0, Math.PI * 2);
      ctx.fill();
    });
  },

  // 2. E-Commerce Product Sample (Luxury bottle on pedestal)
  product: () => {
    return createDataUri(600, 600, (ctx) => {
      // Seamless studio backdrop
      const bg = ctx.createLinearGradient(0, 0, 0, 600);
      bg.addColorStop(0, '#f1f5f9');
      bg.addColorStop(0.7, '#e2e8f0');
      bg.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 600, 600);

      // Ground shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
      ctx.beginPath();
      ctx.ellipse(300, 480, 140, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glass Bottle Body
      const bottleGrad = ctx.createLinearGradient(200, 180, 400, 460);
      bottleGrad.addColorStop(0, '#f8fafc');
      bottleGrad.addColorStop(0.3, '#38bdf8');
      bottleGrad.addColorStop(0.8, '#0284c7');
      bottleGrad.addColorStop(1, '#0369a1');

      ctx.fillStyle = bottleGrad;
      ctx.beginPath();
      ctx.roundRect(220, 220, 160, 240, [18, 18, 24, 24]);
      ctx.fill();

      // Glass Reflection highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(235, 235, 25, 210);

      // Golden Cap
      const capGrad = ctx.createLinearGradient(260, 140, 340, 220);
      capGrad.addColorStop(0, '#fef08a');
      capGrad.addColorStop(0.5, '#eab308');
      capGrad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = capGrad;
      ctx.fillRect(265, 140, 70, 80);

      // Minimalist Label
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(250, 300, 100, 90);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PIXELFORGE', 300, 335);
      ctx.font = '9px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('EAU DE PARFUM', 300, 355);
      ctx.fillText('100 ML · 3.4 FL. OZ', 300, 370);
    });
  },

  // 3. Landscape with Object (Wires / Distraction to remove)
  landscape: () => {
    return createDataUri(800, 500, (ctx) => {
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, 350);
      sky.addColorStop(0, '#38bdf8');
      sky.addColorStop(1, '#fed7aa');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 800, 500);

      // Distant mountains
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(0, 360);
      ctx.lineTo(200, 240);
      ctx.lineTo(450, 380);
      ctx.lineTo(650, 220);
      ctx.lineTo(800, 350);
      ctx.lineTo(800, 500);
      ctx.lineTo(0, 500);
      ctx.fill();

      // Calm lake
      const lake = ctx.createLinearGradient(0, 360, 0, 500);
      lake.addColorStop(0, '#0284c7');
      lake.addColorStop(1, '#0f172a');
      ctx.fillStyle = lake;
      ctx.fillRect(0, 360, 800, 140);

      // Unwanted powerline / pole (Target for Object Remover)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(560, 160);
      ctx.lineTo(560, 420);
      ctx.stroke();

      // Crossbars
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(520, 190);
      ctx.lineTo(600, 190);
      ctx.moveTo(530, 230);
      ctx.lineTo(590, 230);
      ctx.stroke();

      // Power lines crossing the scenic sky
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(0, 120);
      ctx.quadraticCurveTo(300, 210, 520, 190);
      ctx.moveTo(600, 190);
      ctx.quadraticCurveTo(700, 210, 800, 230);
      ctx.stroke();
    });
  },

  // 4. Vintage Photo for Colorizer / Enhancer
  vintage: () => {
    return createDataUri(600, 700, (ctx) => {
      // Sepia / B&W tones
      const bg = ctx.createLinearGradient(0, 0, 600, 700);
      bg.addColorStop(0, '#d1c7b7');
      bg.addColorStop(1, '#8c8070');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 600, 700);

      // Vintage grain / vignette
      ctx.fillStyle = 'rgba(40, 30, 20, 0.35)';
      ctx.beginPath();
      ctx.ellipse(300, 350, 280, 330, 0, 0, Math.PI * 2);
      ctx.lineWidth = 30;
      ctx.stroke();

      // Classical portrait silhouette in grayscale
      ctx.fillStyle = '#3a352f';
      ctx.beginPath();
      ctx.ellipse(300, 620, 190, 140, 0, 0, Math.PI * 2);
      ctx.fill();

      // Vintage necktie & collar
      ctx.fillStyle = '#efe9e0';
      ctx.fillRect(285, 480, 30, 80);

      // Head
      ctx.fillStyle = '#b8aa99';
      ctx.beginPath();
      ctx.ellipse(300, 340, 105, 135, 0, 0, Math.PI * 2);
      ctx.fill();

      // Vintage Fedora Hat
      ctx.fillStyle = '#2b2722';
      ctx.beginPath();
      ctx.ellipse(300, 240, 130, 40, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(300, 210, 80, 55, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  },
};
