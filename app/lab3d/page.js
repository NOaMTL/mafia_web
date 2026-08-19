'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

const PLAYERS = [
  { name: 'JULIEN', suit: '#262728', accent: '#8e7244', skin: '#ba8465', hair: '#201711', style: 'fedora' },
  { name: 'LÉA', suit: '#5b2026', accent: '#b49255', skin: '#d19a79', hair: '#32130f', style: 'bob' },
  { name: 'ALEX', suit: '#263141', accent: '#7d91ad', skin: '#9c6a50', hair: '#171616', style: 'slick' },
  { name: 'MANON', suit: '#65303a', accent: '#c19a5b', skin: '#cf9674', hair: '#8a281c', style: 'wave' },
  { name: 'TOM', suit: '#343230', accent: '#9a7a48', skin: '#bd8664', hair: '#2a1b12', style: 'fedora' },
  { name: 'CHLOÉ', suit: '#4e3b32', accent: '#ad8651', skin: '#dfad8c', hair: '#6b3e20', style: 'bun' },
  { name: 'MAXIME', suit: '#293a31', accent: '#809b7d', skin: '#8c6047', hair: '#161310', style: 'slick' },
  { name: 'DRAIME', suit: '#3c2d42', accent: '#91789c', skin: '#b57d5c', hair: '#29192b', style: 'fedora' },
  { name: 'ENZO', suit: '#493425', accent: '#9d784a', skin: '#a97050', hair: '#21150f', style: 'fedora' },
  { name: 'NINA', suit: '#2e3947', accent: '#7d93a8', skin: '#c78f6d', hair: '#1b1513', style: 'bob' },
];

const PHASES = {
  nuit: {
    icon: '☾', label: 'NUIT', kicker: 'La ville retient son souffle',
    ambient: '#4b3b36', ambientI: 0.34, key: '#f1a34d', keyI: 6.5,
    rim: '#596f8c', rimI: 1.6, fog: '#0b0908', fogDensity: 0.012, tint: [0.56, 0.43, 0.32], exposure: 0.98,
    skyTop: '#070d1f', skyBottom: '#26374f', moon: true, stars: true, glass: [0.9, 0.95, 1.05],
  },
  jour: {
    icon: '☀', label: 'JOUR', kicker: 'Discussion en cours',
    ambient: '#8c735f', ambientI: 0.48, key: '#ffd9a5', keyI: 8.5,
    rim: '#bfc7c2', rimI: 2, fog: '#19140f', fogDensity: 0.007, tint: [0.72, 0.58, 0.42], exposure: 1.04,
    skyTop: '#87b6da', skyBottom: '#e9dcb2', moon: false, stars: false, glass: [1.15, 1.1, 1],
  },
  proces: {
    icon: '⚖', label: 'PROCÈS', kicker: 'Le village doit trancher',
    ambient: '#5c4337', ambientI: 0.38, key: '#ffc36f', keyI: 7.5,
    rim: '#9b684f', rimI: 1.8, fog: '#120b08', fogDensity: 0.014, tint: [0.64, 0.44, 0.3], exposure: 1.0,
    skyTop: '#3a2b50', skyBottom: '#a06238', moon: false, stars: false, glass: [1, 0.85, 0.75],
  },
  sentence: {
    icon: '◆', label: 'SENTENCE', kicker: 'Le verdict est irrévocable',
    ambient: '#4f302c', ambientI: 0.3, key: '#f27a43', keyI: 6.5,
    rim: '#9c3e31', rimI: 2.2, fog: '#120605', fogDensity: 0.017, tint: [0.55, 0.31, 0.24], exposure: 0.92,
    skyTop: '#150910', skyBottom: '#63201a', moon: true, stars: false, glass: [1, 0.7, 0.62],
  },
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${src}"]`);
    if (script) {
      if (script.dataset.loaded === '1' || window.BABYLON) {
        resolve();
        return;
      }
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', () => reject(new Error(`Impossible de charger ${src}`)), { once: true });
      return;
    }
    script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.addEventListener('load', () => {
      script.dataset.loaded = '1';
      resolve();
    }, { once: true });
    script.addEventListener('error', () => reject(new Error(`Impossible de charger ${src}`)), { once: true });
    document.head.appendChild(script);
  });
}

async function ensureBabylon() {
  await loadScript('https://cdn.jsdelivr.net/npm/babylonjs@7.54.1/babylon.min.js');
  await loadScript('https://cdn.jsdelivr.net/npm/babylonjs-loaders@7.54.1/babylonjs.loaders.min.js');
  await loadScript('https://cdn.jsdelivr.net/npm/babylonjs-gui@7.54.1/babylon.gui.min.js');
  const startedAt = Date.now();
  while (!(window.BABYLON?.Engine && window.BABYLON?.GUI?.AdvancedDynamicTexture)) {
    if (Date.now() - startedAt > 8000) throw new Error('Le moteur 3D ne répond pas.');
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
}

export default function Lab3dPage() {
  const canvasRef = useRef(null);
  const sceneApi = useRef(null);
  const [status, setStatus] = useState('Ouverture de la salle…');
  const [phase, setPhase] = useState('jour');

  const switchPhase = (key) => {
    setPhase(key);
    sceneApi.current?.setPhase(key);
  };

  useEffect(() => {
    let engine;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      try {
        await ensureBabylon();
      } catch (error) {
        if (!disposed) setStatus(error.message);
        return;
      }
      if (disposed || !canvasRef.current) return;

      const B = window.BABYLON;
      const canvas = canvasRef.current;
      engine = new B.Engine(canvas, true, { antialias: true, stencil: true, preserveDrawingBuffer: false });
      const scene = new B.Scene(engine);
      scene.clearColor = B.Color4.FromHexString('#090705ff');
      scene.fogMode = B.Scene.FOGMODE_EXP2;
      scene.fogDensity = PHASES.jour.fogDensity;
      scene.fogColor = B.Color3.FromHexString(PHASES.jour.fog);

      const imageFx = scene.imageProcessingConfiguration;
      imageFx.toneMappingEnabled = true;
      imageFx.toneMappingType = B.ImageProcessingConfiguration.TONEMAPPING_ACES;
      imageFx.exposure = PHASES.jour.exposure;
      imageFx.contrast = 1.22;
      imageFx.vignetteEnabled = true;
      imageFx.vignetteWeight = 1.65;
      imageFx.vignetteStretch = 0.35;
      imageFx.vignetteColor = new B.Color4(0.025, 0.018, 0.012, 1);

      const camera = new B.ArcRotateCamera(
        'camera', -Math.PI / 2, 1.16, 13.8,
        new B.Vector3(0, 1.38, 0.55), scene,
      );
      camera.attachControl(canvas, true);
      camera.lowerRadiusLimit = 5.5;
      camera.upperRadiusLimit = 18;
      camera.lowerBetaLimit = 0.55;
      camera.upperBetaLimit = 1.38;
      // Rotation 360° libre autour de la table.
      camera.lowerAlphaLimit = null;
      camera.upperAlphaLimit = null;
      camera.wheelDeltaPercentage = 0.012;
      camera.panningSensibility = 0;
      camera.inertia = 0.82;

      const materialCache = new Map();
      const makeMaterial = (name, hex, specular = 0.08, emissive = null) => {
        const cacheKey = `${name}-${hex}-${specular}-${emissive ?? ''}`;
        if (materialCache.has(cacheKey)) return materialCache.get(cacheKey);
        const material = new B.StandardMaterial(cacheKey, scene);
        material.diffuseColor = B.Color3.FromHexString(hex);
        material.specularColor = new B.Color3(specular, specular, specular);
        material.specularPower = 72;
        if (emissive) material.emissiveColor = B.Color3.FromHexString(emissive);
        materialCache.set(cacheKey, material);
        return material;
      };

      // ═══ DÉCOR 3D TEXTURÉ — plus aucune image de fond ═══════════════════
      // Toutes les textures sont dessinées au canvas (DynamicTexture) :
      // papier peint damassé, lambris, parquet, ciel des fenêtres, tableaux.

      const makeCanvasTexture = (name, width, height, draw, { uScale = 1, vScale = 1 } = {}) => {
        const dt = new B.DynamicTexture(name, { width, height }, scene, true);
        draw(dt.getContext(), width, height);
        dt.update();
        dt.wrapU = B.Texture.WRAP_ADDRESSMODE;
        dt.wrapV = B.Texture.WRAP_ADDRESSMODE;
        dt.uScale = uScale;
        dt.vScale = vScale;
        return dt;
      };

      // Papier peint damassé vert-brun, rayures + losanges dorés discrets.
      const wallpaperTex = makeCanvasTexture('wallpaper', 256, 256, (c, w, h) => {
        c.fillStyle = '#231a11';
        c.fillRect(0, 0, w, h);
        for (let x = 0; x < w; x += 32) {
          c.fillStyle = x % 64 === 0 ? '#281e14' : '#1f1710';
          c.fillRect(x, 0, 16, h);
        }
        c.strokeStyle = 'rgba(158,118,54,.14)';
        c.lineWidth = 1.4;
        for (let y = 0; y < h + 64; y += 64) {
          for (let x = 0; x < w + 32; x += 64) {
            c.beginPath();
            c.moveTo(x, y - 22); c.lineTo(x + 16, y); c.lineTo(x, y + 22); c.lineTo(x - 16, y);
            c.closePath();
            c.stroke();
          }
        }
      }, { uScale: 6, vScale: 3 });

      // Lambris : panneaux de bois verticaux avec moulures claires.
      const wainscotTex = makeCanvasTexture('wainscot', 256, 128, (c, w, h) => {
        c.fillStyle = '#2a180c';
        c.fillRect(0, 0, w, h);
        for (let x = 0; x < w; x += 64) {
          const grad = c.createLinearGradient(x, 0, x + 64, 0);
          grad.addColorStop(0, '#33200f');
          grad.addColorStop(0.5, '#26150a');
          grad.addColorStop(1, '#311e0e');
          c.fillStyle = grad;
          c.fillRect(x + 4, 8, 56, h - 16);
          c.strokeStyle = 'rgba(190,140,70,.22)';
          c.lineWidth = 2;
          c.strokeRect(x + 9, 13, 46, h - 26);
        }
      }, { uScale: 8, vScale: 1 });

      // Parquet à lattes, tons variés.
      const parquetTex = makeCanvasTexture('parquet', 256, 256, (c, w, h) => {
        const tones = ['#241509', '#2b1a0c', '#1f1208', '#291807', '#221408'];
        for (let y = 0; y < h; y += 32) {
          const offset = (y / 32) % 2 === 0 ? 0 : 64;
          for (let x = -64; x < w; x += 128) {
            c.fillStyle = tones[Math.floor(Math.random() * tones.length)];
            c.fillRect(x + offset, y, 126, 30);
            c.fillStyle = 'rgba(0,0,0,.5)';
            c.fillRect(x + offset, y + 30, 126, 2);
            c.fillRect(x + offset + 126, y, 2, 32);
            c.fillStyle = 'rgba(255,205,140,.045)';
            c.fillRect(x + offset, y, 126, 3);
          }
        }
      }, { uScale: 5, vScale: 4 });

      const floor = B.MeshBuilder.CreateGround('parquet', { width: 26, height: 22 }, scene);
      floor.position.z = 0.5;
      const floorMaterial = new B.StandardMaterial('parquet-material', scene);
      floorMaterial.diffuseTexture = parquetTex;
      floorMaterial.specularColor = new B.Color3(0.14, 0.12, 0.1);
      floorMaterial.specularPower = 96;
      floor.material = floorMaterial;
      floor.receiveShadows = true;

      // ── Murs : fond + retours latéraux, lambris en partie basse ──
      const wallMaterial = new B.StandardMaterial('wallpaper-material', scene);
      wallMaterial.diffuseTexture = wallpaperTex;
      wallMaterial.specularColor = new B.Color3(0.03, 0.03, 0.03);
      const wainscotMaterial = new B.StandardMaterial('wainscot-material', scene);
      wainscotMaterial.diffuseTexture = wainscotTex;
      wainscotMaterial.specularColor = new B.Color3(0.09, 0.07, 0.05);

      const makeWall = (name, width, position, rotationY) => {
        const upper = B.MeshBuilder.CreatePlane(name, { width, height: 7.4 }, scene);
        upper.position.copyFrom(position);
        upper.position.y = 5.1;
        upper.rotation.y = rotationY;
        upper.material = wallMaterial;
        upper.receiveShadows = true;
        const lower = B.MeshBuilder.CreatePlane(`${name}-wainscot`, { width, height: 1.5 }, scene);
        lower.position.copyFrom(position);
        lower.position.y = 0.75;
        lower.rotation.y = rotationY;
        lower.material = wainscotMaterial;
        lower.receiveShadows = true;
        const rail = B.MeshBuilder.CreateBox(`${name}-rail`, { width, height: 0.09, depth: 0.07 }, scene);
        rail.position.copyFrom(position);
        rail.position.y = 1.53;
        rail.rotation.y = rotationY;
        rail.material = makeMaterial('rail-wood', '#3e2712', 0.24);
        const cornice = B.MeshBuilder.CreateBox(`${name}-cornice`, { width, height: 0.16, depth: 0.1 }, scene);
        cornice.position.copyFrom(position);
        cornice.position.y = 8.72;
        cornice.rotation.y = rotationY;
        cornice.material = makeMaterial('cornice', '#41290f', 0.3, '#180e04');
      };

      makeWall('wall-back', 26, new B.Vector3(0, 0, 8.2), Math.PI);
      makeWall('wall-left', 18, new B.Vector3(-12.4, 0, 1.5), -Math.PI / 2);
      makeWall('wall-right', 18, new B.Vector3(12.4, 0, 1.5), Math.PI / 2);
      // 4e mur : la rotation 360° ne doit plus donner sur le vide.
      makeWall('wall-front', 26, new B.Vector3(0, 0, -10.4), 0);

      // ── Plafond à poutres ──
      const ceiling = B.MeshBuilder.CreatePlane('ceiling', { width: 26, height: 22 }, scene);
      ceiling.position.set(0, 8.8, 0.5);
      ceiling.rotation.x = -Math.PI / 2;
      ceiling.material = makeMaterial('ceiling', '#171008', 0.02);
      for (let i = -2; i <= 2; i++) {
        const beam = B.MeshBuilder.CreateBox(`beam-${i}`, { width: 0.5, height: 0.42, depth: 22 }, scene);
        beam.position.set(i * 5.4, 8.6, 0.5);
        beam.material = makeMaterial('beam-wood', '#241507', 0.1);
      }

      // ── Fenêtres : ciel dynamique par phase + croisillons + rideaux ──
      const skyTextures = [];
      const glassMaterials = [];
      const drawSky = (c, w, h, p) => {
        const grad = c.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, p.skyTop);
        grad.addColorStop(1, p.skyBottom);
        c.fillStyle = grad;
        c.fillRect(0, 0, w, h);
        if (p.stars) {
          c.fillStyle = 'rgba(255,255,255,.75)';
          for (let i = 0; i < 42; i++) {
            const sx = (i * 97) % w;
            const sy = ((i * 61) % Math.floor(h * 0.55));
            c.fillRect(sx, sy, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
          }
        }
        if (p.moon) {
          c.fillStyle = 'rgba(240,235,215,.95)';
          c.beginPath();
          c.arc(w * 0.68, h * 0.24, 16, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = 'rgba(240,235,215,.14)';
          c.beginPath();
          c.arc(w * 0.68, h * 0.24, 26, 0, Math.PI * 2);
          c.fill();
        }
        // Silhouette de la ville en contre-jour.
        c.fillStyle = 'rgba(4,5,8,.92)';
        const heights = [0.62, 0.5, 0.68, 0.55, 0.72, 0.58, 0.65];
        const bw = w / heights.length;
        heights.forEach((hh, i) => {
          c.fillRect(i * bw, h * hh, bw - 3, h);
        });
        c.fillStyle = 'rgba(255,205,110,.5)';
        heights.forEach((hh, i) => {
          for (let f = 0; f < 3; f++) {
            if ((i + f) % 2 === 0) c.fillRect(i * bw + 6 + f * 9, h * hh + 12, 3, 4);
          }
        });
      };

      const curtainMaterial = makeMaterial('curtain', '#4a1519', 0.06);
      const frameMaterial = makeMaterial('window-frame', '#31200f', 0.2);

      const makeWindow = (x) => {
        const W = 2.5;
        const H = 4.7;
        const yCenter = 4.35;
        const z = 8.16;

        const sky = new B.DynamicTexture(`sky-${x}`, { width: 192, height: 320 }, scene, true);
        drawSky(sky.getContext(), 192, 320, PHASES.jour);
        sky.update();
        skyTextures.push(sky);
        const glassMat = new B.StandardMaterial(`glass-${x}`, scene);
        glassMat.emissiveTexture = sky;
        glassMat.diffuseColor = B.Color3.Black();
        glassMat.specularColor = B.Color3.Black();
        glassMat.emissiveColor = new B.Color3(...PHASES.jour.glass);
        glassMat.fogEnabled = false;
        glassMaterials.push(glassMat);
        const glass = B.MeshBuilder.CreatePlane(`window-glass-${x}`, { width: W, height: H }, scene);
        glass.position.set(x, yCenter, z);
        glass.rotation.y = Math.PI;
        glass.material = glassMat;
        glass.applyFog = false;

        // Cadre + croisillons
        const parts = [
          { w: W + 0.3, h: 0.16, px: 0, py: H / 2 + 0.06 },
          { w: W + 0.3, h: 0.16, px: 0, py: -H / 2 - 0.06 },
          { w: 0.16, h: H + 0.3, px: -W / 2 - 0.06, py: 0 },
          { w: 0.16, h: H + 0.3, px: W / 2 + 0.06, py: 0 },
          { w: 0.08, h: H, px: 0, py: 0 },
          { w: W, h: 0.08, px: 0, py: H * 0.22 },
          { w: W, h: 0.08, px: 0, py: -H * 0.22 },
        ];
        for (const part of parts) {
          const bar = B.MeshBuilder.CreateBox(`window-bar-${x}-${part.px}-${part.py}`, { width: part.w, height: part.h, depth: 0.1 }, scene);
          bar.position.set(x + part.px, yCenter + part.py, z - 0.04);
          bar.material = frameMaterial;
        }

        // Rideaux latéraux + cantonnière
        for (const side of [-1, 1]) {
          const curtain = B.MeshBuilder.CreateCylinder(`curtain-${x}-${side}`, {
            diameterTop: 0.42, diameterBottom: 0.62, height: H + 0.9, tessellation: 24,
          }, scene);
          curtain.position.set(x + side * (W / 2 + 0.32), yCenter - 0.15, z - 0.28);
          curtain.scaling.z = 0.55;
          curtain.material = curtainMaterial;
        }
        const valance = B.MeshBuilder.CreateBox(`valance-${x}`, { width: W + 1.15, height: 0.55, depth: 0.34 }, scene);
        valance.position.set(x, yCenter + H / 2 + 0.32, z - 0.22);
        valance.material = curtainMaterial;
      };

      makeWindow(-4.4);
      makeWindow(4.4);

      // ── Tableaux : portraits procéduraux encadrés ──
      const makePainting = (name, position, rotationY, seed, width = 1.9, height = 2.5) => {
        const canvasTex = makeCanvasTexture(name, 128, 168, (c, w, h) => {
          const grad = c.createLinearGradient(0, 0, 0, h);
          grad.addColorStop(0, seed % 2 === 0 ? '#3a2c1c' : '#33251f');
          grad.addColorStop(1, '#171009');
          c.fillStyle = grad;
          c.fillRect(0, 0, w, h);
          // silhouette de notable en contre-jour
          c.fillStyle = 'rgba(12,8,5,.94)';
          c.beginPath();
          c.ellipse(w / 2, h * 0.42, w * 0.2, w * 0.24, 0, 0, Math.PI * 2);
          c.fill();
          c.beginPath();
          c.ellipse(w / 2, h * 0.85, w * 0.34, h * 0.3, 0, 0, Math.PI * 2);
          c.fill();
          if (seed % 2 === 0) c.fillRect(w * 0.3, h * 0.3, w * 0.4, 6); // bord de chapeau
          c.fillStyle = 'rgba(210,170,90,.08)';
          c.fillRect(0, 0, w, 10);
        });
        const canvasMat = new B.StandardMaterial(`${name}-material`, scene);
        canvasMat.diffuseTexture = canvasTex;
        canvasMat.emissiveColor = new B.Color3(0.16, 0.13, 0.1);
        canvasMat.emissiveTexture = canvasTex;
        canvasMat.specularColor = B.Color3.Black();
        const canvasMesh = B.MeshBuilder.CreatePlane(name, { width, height }, scene);
        canvasMesh.position.copyFrom(position);
        canvasMesh.rotation.y = rotationY;
        canvasMesh.material = canvasMat;

        const frameGold = makeMaterial('painting-frame', '#6d4a1c', 0.4, '#1c1204');
        const fw = 0.12;
        const framePieces = [
          { w: width + fw * 2, h: fw, dy: height / 2 + fw / 2 },
          { w: width + fw * 2, h: fw, dy: -height / 2 - fw / 2 },
          { w: fw, h: height, dx: -width / 2 - fw / 2 },
          { w: fw, h: height, dx: width / 2 + fw / 2 },
        ];
        for (const piece of framePieces) {
          const bar = B.MeshBuilder.CreateBox(`${name}-frame-${piece.dx ?? 0}-${piece.dy ?? 0}`, { width: piece.w, height: piece.h, depth: 0.09 }, scene);
          const local = new B.Vector3(piece.dx ?? 0, piece.dy ?? 0, 0.01);
          const rotated = B.Vector3.TransformCoordinates(local, B.Matrix.RotationY(rotationY));
          bar.position.copyFrom(position.add(rotated));
          bar.rotation.y = rotationY;
          bar.material = frameGold;
        }
      };

      makePainting('painting-center', new B.Vector3(0, 4.8, 8.14), Math.PI, 0, 2.3, 3);
      makePainting('painting-left', new B.Vector3(-12.34, 4.6, 3.2), -Math.PI / 2, 1);
      makePainting('painting-right', new B.Vector3(12.34, 4.6, 3.2), Math.PI / 2, 2);

      // ── Appliques murales (purement émissives, pas de lumière ajoutée).
      // glow et bulbMaterials n'existent pas encore ici : on stocke, et le
      // raccordement se fait juste après la création du GlowLayer. ──
      const sconces = [];
      for (const x of [-8.6, 8.6]) {
        const plate = B.MeshBuilder.CreateBox(`sconce-plate-${x}`, { width: 0.16, height: 0.5, depth: 0.06 }, scene);
        plate.position.set(x, 5, 8.14);
        plate.material = makeMaterial('sconce-plate', '#3c2812', 0.3);
        const sconceBulb = B.MeshBuilder.CreateSphere(`sconce-bulb-${x}`, { diameter: 0.16, segments: 12 }, scene);
        sconceBulb.position.set(x, 5.2, 8.05);
        const sconceMat = new B.StandardMaterial(`sconce-material-${x}`, scene);
        sconceMat.diffuseColor = B.Color3.Black();
        sconceMat.emissiveColor = B.Color3.FromHexString('#ffbe6e');
        sconceBulb.material = sconceMat;
        sconces.push({ mesh: sconceBulb, material: sconceMat });
      }

      const ambient = new B.HemisphericLight('ambient', new B.Vector3(0, 1, -0.15), scene);
      ambient.diffuse = B.Color3.FromHexString(PHASES.jour.ambient);
      ambient.groundColor = B.Color3.FromHexString('#120d09');
      ambient.intensity = PHASES.jour.ambientI;

      const keyLight = new B.PointLight('key-light', new B.Vector3(0, 6.4, -0.2), scene);
      keyLight.diffuse = B.Color3.FromHexString(PHASES.jour.key);
      keyLight.intensity = PHASES.jour.keyI;
      keyLight.range = 15;

      const rimLight = new B.PointLight('rim-light', new B.Vector3(0, 3.6, 5.4), scene);
      rimLight.diffuse = B.Color3.FromHexString(PHASES.jour.rim);
      rimLight.intensity = PHASES.jour.rimI;
      rimLight.range = 13;

      const shadowLight = new B.DirectionalLight('shadow-light', new B.Vector3(0.18, -1, 0.28), scene);
      shadowLight.position = new B.Vector3(-2, 7, -4);
      shadowLight.diffuse = B.Color3.FromHexString('#ffd69b');
      shadowLight.intensity = 0.45;
      const shadows = new B.ShadowGenerator(1024, shadowLight);
      shadows.usePercentageCloserFiltering = true;
      shadows.filteringQuality = B.ShadowGenerator.QUALITY_MEDIUM;
      shadows.bias = 0.002;

      const glow = new B.GlowLayer('warm-glow', scene, { blurKernelSize: 32 });
      glow.intensity = 0.22;

      // Raccordement différé des appliques du décor (créées avant le glow).
      for (const sconce of sconces) glow.addIncludedOnlyMesh(sconce.mesh);

      const addShadow = (mesh) => {
        shadows.addShadowCaster(mesh);
        mesh.receiveShadows = true;
        return mesh;
      };

      const lampLights = [];
      const bulbMaterials = [];
      [-5.85, 5.85].forEach((x) => {
        const pole = addShadow(B.MeshBuilder.CreateCylinder(`lamp-pole-${x}`, { diameter: 0.075, height: 2.25, tessellation: 16 }, scene));
        pole.position.set(x, 1.12, 3.65);
        pole.material = makeMaterial('lamp-brass', '#5b3c1d', 0.42);
        const base = B.MeshBuilder.CreateCylinder(`lamp-base-${x}`, { diameterTop: 0.18, diameterBottom: 0.46, height: 0.12, tessellation: 24 }, scene);
        base.position.set(x, 0.06, 3.65);
        base.material = pole.material;
        const shade = B.MeshBuilder.CreateCylinder(`lamp-shade-${x}`, { diameterTop: 0.26, diameterBottom: 0.74, height: 0.42, tessellation: 32 }, scene);
        shade.position.set(x, 2.42, 3.65);
        shade.material = makeMaterial('lamp-shade', '#342015', 0.12);
        const bulb = B.MeshBuilder.CreateSphere(`lamp-bulb-${x}`, { diameter: 0.19, segments: 16 }, scene);
        bulb.position.set(x, 2.24, 3.65);
        const bulbMaterial = new B.StandardMaterial(`bulb-material-${x}`, scene);
        bulbMaterial.diffuseColor = B.Color3.Black();
        bulbMaterial.emissiveColor = B.Color3.FromHexString('#ffc36f');
        bulb.material = bulbMaterial;
        bulbMaterials.push(bulbMaterial);
        glow.addIncludedOnlyMesh(bulb);
        const lamp = new B.PointLight(`lamp-light-${x}`, new B.Vector3(x, 2.35, 3.55), scene);
        lamp.diffuse = B.Color3.FromHexString('#ffc36f');
        lamp.intensity = 3.8;
        lamp.range = 7;
        lampLights.push(lamp);
      });

      const tableRoot = new B.TransformNode('table-root', scene);
      const tableTop = addShadow(B.MeshBuilder.CreateCylinder('table-top', { diameter: 6.7, height: 0.32, tessellation: 96 }, scene));
      tableTop.parent = tableRoot;
      tableTop.position.y = 1.29;
      tableTop.scaling.z = 0.78;
      const tableMaterial = makeMaterial('walnut-table', '#593319', 0.28);
      tableMaterial.specularPower = 120;
      tableTop.material = tableMaterial;

      const lowerLip = B.MeshBuilder.CreateCylinder('table-lower-lip', { diameter: 6.95, height: 0.12, tessellation: 96 }, scene);
      lowerLip.parent = tableRoot;
      lowerLip.position.y = 1.16;
      lowerLip.scaling.z = 0.78;
      lowerLip.material = makeMaterial('dark-walnut', '#2b170c', 0.18);

      const leather = B.MeshBuilder.CreateCylinder('leather-inlay', { diameter: 5.2, height: 0.025, tessellation: 96 }, scene);
      leather.parent = tableRoot;
      leather.position.y = 1.474;
      leather.scaling.z = 0.77;
      leather.material = makeMaterial('leather', '#211611', 0.09);

      const brassRing = B.MeshBuilder.CreateTorus('brass-inlay', { diameter: 5.4, thickness: 0.035, tessellation: 96 }, scene);
      brassRing.parent = tableRoot;
      brassRing.position.y = 1.496;
      brassRing.scaling.z = 0.77;
      brassRing.material = makeMaterial('aged-brass', '#a0702d', 0.52, '#271504');

      const pedestal = addShadow(B.MeshBuilder.CreateCylinder('pedestal', {
        diameterTop: 1.8, diameterBottom: 2.7, height: 1.19, tessellation: 48,
      }, scene));
      pedestal.parent = tableRoot;
      pedestal.position.y = 0.6;
      pedestal.scaling.z = 0.74;
      pedestal.material = makeMaterial('pedestal-wood', '#2b190e', 0.16);

      const emblem = B.MeshBuilder.CreateCylinder('emblem', { diameter: 1.55, height: 0.035, tessellation: 64 }, scene);
      emblem.parent = tableRoot;
      emblem.position.y = 1.504;
      emblem.scaling.z = 0.77;
      emblem.material = makeMaterial('emblem', '#69451e', 0.35, '#251606');

      const logoMark = B.MeshBuilder.CreatePlane('table-logo', { size: 1.04 }, scene);
      logoMark.parent = tableRoot;
      logoMark.position.set(0, 1.527, 0);
      logoMark.rotation.x = Math.PI / 2;
      logoMark.scaling.y = 0.77;
      const logoMaterial = new B.StandardMaterial('table-logo-material', scene);
      const logoTexture = new B.Texture('/brand/mafia-logo-minimal.png', scene);
      logoTexture.hasAlpha = true;
      logoMaterial.diffuseTexture = logoTexture;
      logoMaterial.opacityTexture = logoTexture;
      logoMaterial.emissiveTexture = logoTexture;
      logoMaterial.emissiveColor = B.Color3.FromHexString('#7e5423');
      logoMaterial.backFaceCulling = false;
      logoMark.material = logoMaterial;

      const gui = B.GUI.AdvancedDynamicTexture.CreateFullscreenUI('player-ui', true, scene);

      // ── Personnages Quaternius (CC0) : riggés, squelette type UE.
      // Pas d'animation fournie → la pose ASSISE est composée en code, os
      // par os (SEATED_POSE ci-dessous, ajustable à la capture d'écran).
      const QUATERNIUS_ROOT = '/models/Base%20Characters/Godot%20-%20UE/';
      const TEX_ROOT = '/models/Base%20Characters/Textures/';
      const HAIR_ROOT = '/models/Hairstyles/Origin%20at%200/glTF%20(Godot)/';
      const OUTFIT_ROOT = '/models/outfit/outfits/Exports/glTF%20(Godot-Unreal)/Outfits/';
      const SKIN_TEXTURES = {
        male:   { light: `${TEX_ROOT}T_Superhero_Male_Ligh.png`, dark: `${QUATERNIUS_ROOT}T_Superhero_Male_Dark.png` },
        female: { light: `${TEX_ROOT}T_Superhero_Female_Light_BaseColor.png`, dark: `${QUATERNIUS_ROOT}T_Superhero_Female_Dark_BaseColor.png` },
      };
      const skinTextureCache = new Map();

      let characterAssets = null;
      try {
        if (!disposed) setStatus('Installation des joueurs autour de la table…');
        const containers = {};
        const loadContainer = async (key, rootUrl, file) => {
          containers[key] = await B.SceneLoader.LoadAssetContainerAsync(rootUrl, file, scene);
        };
        await Promise.all([
          loadContainer('body-male', QUATERNIUS_ROOT, 'Superhero_Male_FullBody.gltf'),
          loadContainer('body-female', QUATERNIUS_ROOT, 'Superhero_Female_FullBody.gltf'),
          loadContainer('Eyebrows_Regular', HAIR_ROOT, 'Eyebrows_Regular.gltf'),
          loadContainer('Eyebrows_Female', HAIR_ROOT, 'Eyebrows_Female.gltf'),
          loadContainer('Hair_Beard', HAIR_ROOT, 'Hair_Beard.gltf'),
          loadContainer('Hair_Buzzed', HAIR_ROOT, 'Hair_Buzzed.gltf'),
          loadContainer('Hair_SimpleParted', HAIR_ROOT, 'Hair_SimpleParted.gltf'),
          loadContainer('Hair_Long', HAIR_ROOT, 'Hair_Long.gltf'),
          loadContainer('Hair_Buns', HAIR_ROOT, 'Hair_Buns.gltf'),
          loadContainer('Hair_BuzzedFemale', HAIR_ROOT, 'Hair_BuzzedFemale.gltf'),
          loadContainer('outfit-male-Peasant', OUTFIT_ROOT, 'Male_Peasant.gltf'),
          loadContainer('outfit-male-Ranger', OUTFIT_ROOT, 'Male_Ranger.gltf'),
          loadContainer('outfit-female-Peasant', OUTFIT_ROOT, 'Female_Peasant.gltf'),
          loadContainer('outfit-female-Ranger', OUTFIT_ROOT, 'Female_Ranger.gltf'),
        ]);
        characterAssets = containers;
        if (disposed) { Object.values(containers).forEach((c) => c.dispose()); return; }
      } catch (error) {
        console.warn('Personnages Quaternius indisponibles — modèle maison utilisé.', error);
        characterAssets = null;
      }

      // Angles de la pose assise (radians), par os. Symétrie gauche/droite
      // automatique. À AJUSTER visuellement : c'est le seul endroit à toucher.
      const SEATED_POSE = {
        thigh:    { x: -1.5, mirrorZ: false }, // cuisses à l'horizontale
        calf:     { x: 1.42, mirrorZ: false }, // genoux pliés, tibias verticaux
        foot:     { x: 0.1,  mirrorZ: false },
        spine_01: { x: 0.1,  mirrorZ: false }, // léger penché vers la table
        spine_02: { x: 0.06, mirrorZ: false },
        upperarm: { x: 0.35, z: -1.05, mirrorZ: true }, // bras descendus le long du corps
        lowerarm: { x: 0.35, mirrorZ: false },        // avant-bras posés vers la table
      };
      const applySeatedPose = (avatarRoot) => {
        // IMPORTANT : corps ET tenue ont chacun leur squelette (mêmes noms
        // d'os). Il faut roter TOUS les homonymes, sinon l'un des deux reste
        // en T-pose debout pendant que l'autre s'assoit.
        const nodes = avatarRoot.getChildTransformNodes(false);
        const matchBones = (suffix) => nodes.filter((n) => n.name.endsWith(suffix));
        for (const [bone, conf] of Object.entries(SEATED_POSE)) {
          if (bone.startsWith('spine')) {
            for (const node of matchBones(bone)) {
              if (conf.x) node.rotate(B.Axis.X, conf.x, B.Space.LOCAL);
            }
            continue;
          }
          for (const side of ['_l', '_r']) {
            for (const node of matchBones(`${bone}${side}`)) {
              if (conf.x) node.rotate(B.Axis.X, conf.x, B.Space.LOCAL);
              if (conf.z) node.rotate(B.Axis.Z, conf.mirrorZ && side === '_r' ? -conf.z : conf.z, B.Space.LOCAL);
            }
          }
        }
      };

      const skinMaterials = new Map();
      const skinMaterial = (hex) => {
        if (!skinMaterials.has(hex)) skinMaterials.set(hex, makeMaterial('skin', hex, 0.06));
        return skinMaterials.get(hex);
      };

      const createPlayer = (player, index) => {
        const angle = (index / PLAYERS.length) * Math.PI * 2 - Math.PI / 2;
        const root = new B.TransformNode(`player-${index}`, scene);
        root.position.set(Math.cos(angle) * 3.85, 0, Math.sin(angle) * 3.05);
        root.lookAt(new B.Vector3(0, 0.98, 0));

        // Générateur pseudo-aléatoire DÉTERMINISTE par joueur : chaque
        // silhouette a sa posture propre, stable d'un rendu à l'autre.
        const rnd = (n) => {
          const v = Math.sin(index * 127.1 + n * 311.7) * 43758.5453;
          return v - Math.floor(v);
        };
        // Légère rotation du corps : personne n'est assis parfaitement droit.
        // (lookAt écrit en quaternion OU en Euler selon l'état du nœud.)
        const postureYaw = (rnd(1) - 0.5) * 0.18;
        if (root.rotationQuaternion) {
          root.rotationQuaternion = root.rotationQuaternion.multiply(
            B.Quaternion.RotationYawPitchRoll(postureYaw, 0, 0),
          );
        } else {
          root.rotation.y += postureYaw;
        }
        const isFemale = ['bob', 'wave', 'bun'].includes(player.style);

        const suitMaterial = makeMaterial(`suit-${index}`, player.suit, 0.1);
        const accentMaterial = makeMaterial(`accent-${index}`, player.accent, 0.22);
        const hairMaterial = makeMaterial(`hair-${index}`, player.hair, 0.07);
        const faceMaterial = skinMaterial(player.skin);
        const chairWood = makeMaterial('chair-wood', '#26140b', 0.16);
        const chairLeather = makeMaterial('chair-leather', '#321b14', 0.08);

        const seat = addShadow(B.MeshBuilder.CreateBox(`seat-${index}`, { width: 0.9, depth: 0.82, height: 0.13 }, scene));
        seat.parent = root;
        seat.position.set(0, 0.65, -0.14);
        seat.material = chairLeather;
        for (const sx of [-1, 1]) {
          for (const sz of [-1, 1]) {
            const leg = B.MeshBuilder.CreateCylinder(`chair-leg-${index}-${sx}-${sz}`, {
              diameterTop: 0.07, diameterBottom: 0.09, height: 0.6, tessellation: 12,
            }, scene);
            leg.parent = root;
            leg.position.set(sx * 0.38, 0.3, -0.14 + sz * 0.33);
            leg.material = chairWood;
          }
        }
        const chairBack = addShadow(B.MeshBuilder.CreateBox(`chair-back-${index}`, { width: 0.92, depth: 0.12, height: 1.42 }, scene));
        chairBack.parent = root;
        chairBack.position.set(0, 1.32, -0.59);
        chairBack.material = chairLeather;
        for (const side of [-1, 1]) {
          const post = B.MeshBuilder.CreateCylinder(`chair-post-${index}-${side}`, { diameter: 0.1, height: 1.62, tessellation: 16 }, scene);
          post.parent = root;
          post.position.set(side * 0.48, 1.34, -0.61);
          post.material = chairWood;
          const finial = B.MeshBuilder.CreateSphere(`chair-finial-${index}-${side}`, { diameter: 0.17, segments: 12 }, scene);
          finial.parent = root;
          finial.position.set(side * 0.48, 2.16, -0.61);
          finial.material = accentMaterial;
        }

        // Style low-poly assumé : volumes FACETTÉS (flat shading) plutôt
        // que primitives lisses — fini l'effet "tubes".
        const lowpoly = (mesh) => { mesh.convertToFlatShadedMesh(); return mesh; };

        const hips = addShadow(lowpoly(B.MeshBuilder.CreateSphere(`hips-${index}`, { diameter: 0.76, segments: 6 }, scene)));
        hips.parent = root;
        hips.position.set(0, 0.92, -0.02);
        hips.scaling.set(1.04, 0.66, 0.84);
        hips.material = suitMaterial;

        // ── Jambes ASSISES : cuisses à l'horizontale vers la table,
        // mollets à la verticale, chaussures au sol. C'est ce qui vend la
        // posture — plus besoin de cacher le bas du corps. ──
        const trouserMaterial = makeMaterial(`trousers-${index}`, player.suit, 0.07);
        const shoeMaterial = makeMaterial('shoes', '#181009', 0.3);
        for (const side of [-1, 1]) {
          const thigh = addShadow(lowpoly(B.MeshBuilder.CreateCylinder(`thigh-${index}-${side}`, { diameterTop: 0.2, diameterBottom: 0.27, height: 0.62, tessellation: 7 }, scene)));
          thigh.parent = root;
          thigh.position.set(side * 0.2, 0.82, 0.2);
          thigh.rotation.x = Math.PI / 2 - 0.08; // quasi horizontale, genou léger vers le haut
          thigh.material = trouserMaterial;

          const calf = addShadow(lowpoly(B.MeshBuilder.CreateCylinder(`calf-${index}-${side}`, { diameterTop: 0.19, diameterBottom: 0.14, height: 0.68, tessellation: 7 }, scene)));
          calf.parent = root;
          calf.position.set(side * 0.2, 0.42, 0.5);
          calf.rotation.x = 0.12; // presque verticale, léger recul du pied
          calf.material = trouserMaterial;

          const shoe = B.MeshBuilder.CreateBox(`shoe-${index}-${side}`, { width: 0.16, height: 0.1, depth: 0.34 }, scene);
          shoe.parent = root;
          shoe.position.set(side * 0.2, 0.06, 0.62);
          shoe.material = shoeMaterial;
        }

        // Profil de veston cintré : hanches larges (veste évasée), taille
        // marquée, poitrine bombée, épaules carrées, amorce de col.
        const torsoProfile = [
          new B.Vector3(0.42, 0, 0),
          new B.Vector3(0.44, 0.1, 0),
          new B.Vector3(0.37, 0.28, 0),
          new B.Vector3(0.315, 0.46, 0),
          new B.Vector3(0.35, 0.64, 0),
          new B.Vector3(0.40, 0.82, 0),
          new B.Vector3(0.42, 0.92, 0),
          new B.Vector3(0.34, 1.0, 0),
          new B.Vector3(0.16, 1.06, 0),
          new B.Vector3(0.12, 1.09, 0),
        ];
        const torso = addShadow(lowpoly(B.MeshBuilder.CreateLathe(`torso-${index}`, {
          shape: torsoProfile, tessellation: 9, cap: B.Mesh.CAP_ALL,
        }, scene)));
        torso.parent = root;
        torso.position.set(0, 0.9, 0.035);
        torso.scaling.z = 0.78;
        // Penché en avant (impliqué) ou en retrait (méfiant) selon le joueur.
        torso.rotation.x = 0.02 + rnd(2) * 0.09;
        if (isFemale) torso.scaling.x = 0.86;
        torso.material = suitMaterial;

        const shirt = B.MeshBuilder.CreateBox(`shirt-${index}`, { width: 0.24, height: 0.5, depth: 0.025 }, scene);
        shirt.parent = root;
        shirt.position.set(0, 1.56, 0.395);
        shirt.rotation.x = -0.02;
        shirt.material = makeMaterial('shirt', '#d7cdbd', 0.08);

        // Col de chemise blanc, boutons de gilet, pochette de costume.
        const collarMaterial = makeMaterial('collar', '#e6ddca', 0.1);
        for (const side of [-1, 1]) {
          const collarWing = B.MeshBuilder.CreateBox(`collar-${index}-${side}`, { width: 0.09, height: 0.07, depth: 0.03 }, scene);
          collarWing.parent = root;
          collarWing.position.set(side * 0.07, 1.85, 0.36);
          collarWing.rotation.z = side * 0.5;
          collarWing.material = collarMaterial;
        }
        const buttonMaterial = makeMaterial('buttons', '#c9a86a', 0.4, '#241605');
        for (let b = 0; b < 3; b++) {
          const button = B.MeshBuilder.CreateSphere(`button-${index}-${b}`, { diameter: 0.028, segments: 8 }, scene);
          button.parent = root;
          button.position.set(0.045, 1.66 - b * 0.13, 0.405 - b * 0.012);
          button.material = buttonMaterial;
        }
        const pocketSquare = B.MeshBuilder.CreateBox(`pocket-${index}`, { width: 0.07, height: 0.05, depth: 0.015 }, scene);
        pocketSquare.parent = root;
        pocketSquare.position.set(-0.21, 1.62, 0.4);
        pocketSquare.rotation.z = 0.2;
        pocketSquare.material = accentMaterial;

        if (!isFemale) {
          const tie = B.MeshBuilder.CreateCylinder(`tie-${index}`, { diameterTop: 0.03, diameterBottom: 0.09, height: 0.38, tessellation: 4 }, scene);
          tie.parent = root;
          tie.position.set(0, 1.53, 0.416);
          tie.material = accentMaterial;
        } else {
          // Collier de perles dorées en arc sur la poitrine.
          const pearlMaterial = makeMaterial('pearls', '#d8b56a', 0.5, '#2a1c08');
          for (let pearl = -2; pearl <= 2; pearl++) {
            const bead = B.MeshBuilder.CreateSphere(`bead-${index}-${pearl}`, { diameter: 0.045, segments: 6 }, scene);
            bead.parent = root;
            bead.position.set(pearl * 0.055, 1.8 - Math.abs(pearl) * -0.02 - 0.04 * (2 - Math.abs(pearl)), 0.38);
            bead.material = pearlMaterial;
          }
        }

        const collarLeft = B.MeshBuilder.CreateCylinder(`lapel-left-${index}`, { diameterTop: 0.04, diameterBottom: 0.13, height: 0.48, tessellation: 4 }, scene);
        collarLeft.parent = root;
        collarLeft.position.set(-0.15, 1.58, 0.42);
        collarLeft.rotation.z = -0.42;
        collarLeft.material = accentMaterial;
        const collarRight = collarLeft.clone(`lapel-right-${index}`);
        collarRight.parent = root;
        collarRight.position.x = 0.15;
        collarRight.rotation.z = 0.42;

        for (const side of [-1, 1]) {
          const deltoid = addShadow(lowpoly(B.MeshBuilder.CreateSphere(`deltoid-${index}-${side}`, { diameter: 0.26, segments: 5 }, scene)));
          deltoid.parent = root;
          deltoid.position.set(side * 0.36, 1.86, 0.05);
          deltoid.scaling.set(1.1, 0.82, 0.95);
          deltoid.material = suitMaterial;
        }
        const neck = lowpoly(B.MeshBuilder.CreateCylinder(`neck-${index}`, { diameter: 0.25, height: 0.28, tessellation: 7 }, scene));
        neck.parent = root;
        neck.position.set(0, 1.97, 0.05);
        neck.material = faceMaterial;

        const head = addShadow(lowpoly(B.MeshBuilder.CreateSphere(`head-${index}`, { diameter: 0.5, segments: 8 }, scene)));
        head.parent = root;
        head.position.set(0, 2.19, 0.07);
        head.scaling.set(0.9, 1.12, 0.88);
        head.material = faceMaterial;

        const nose = lowpoly(B.MeshBuilder.CreateSphere(`nose-${index}`, { diameter: 0.105, segments: 4 }, scene));
        nose.parent = root;
        nose.position.set(0, 2.18, 0.292);
        nose.scaling.set(0.72, 1.08, 1.05);
        nose.material = faceMaterial;

        // ── Visage expressif : sourcils, bouche, moustache pour certains ──
        for (const side of [-1, 1]) {
          const brow = B.MeshBuilder.CreateBox(`brow-${index}-${side}`, { width: 0.1, height: 0.022, depth: 0.03 }, scene);
          brow.parent = root;
          brow.position.set(side * 0.095, 2.295, 0.275);
          brow.rotation.z = side * -0.12;
          brow.material = hairMaterial;
        }
        const mouth = B.MeshBuilder.CreateBox(`mouth-${index}`, { width: 0.11, height: 0.018, depth: 0.02 }, scene);
        mouth.parent = root;
        mouth.position.set(0, 2.075, 0.283);
        mouth.material = makeMaterial('mouth', '#5e3028', 0.05);
        if (player.style === 'fedora' && index % 2 === 0) {
          const moustache = B.MeshBuilder.CreateBox(`moustache-${index}`, { width: 0.16, height: 0.035, depth: 0.03 }, scene);
          moustache.parent = root;
          moustache.position.set(0, 2.12, 0.288);
          moustache.material = hairMaterial;
        }

        const eyeMaterial = makeMaterial('eyes', '#18110d', 0.16);
        for (const side of [-1, 1]) {
          const eye = B.MeshBuilder.CreateSphere(`eye-${index}-${side}`, { diameter: 0.042, segments: 8 }, scene);
          eye.parent = root;
          eye.position.set(side * 0.095, 2.245, 0.29);
          eye.material = eyeMaterial;
          const ear = lowpoly(B.MeshBuilder.CreateSphere(`ear-${index}-${side}`, { diameter: 0.11, segments: 5 }, scene));
          ear.parent = root;
          ear.position.set(side * 0.235, 2.19, 0.06);
          ear.scaling.set(0.58, 1, 0.46);
          ear.material = faceMaterial;
        }

        if (player.style === 'fedora') {
          const brim = B.MeshBuilder.CreateCylinder(`hat-brim-${index}`, { diameter: 0.78, height: 0.045, tessellation: 40 }, scene);
          brim.parent = root;
          brim.position.set(0, 2.41, 0.04);
          brim.material = hairMaterial;
          const crown = B.MeshBuilder.CreateCylinder(`hat-crown-${index}`, { diameterTop: 0.39, diameterBottom: 0.48, height: 0.29, tessellation: 32 }, scene);
          crown.parent = root;
          crown.position.set(0, 2.54, 0.035);
          crown.material = hairMaterial;
          const band = B.MeshBuilder.CreateTorus(`hat-band-${index}`, { diameter: 0.46, thickness: 0.035, tessellation: 32 }, scene);
          band.parent = root;
          band.position.set(0, 2.43, 0.035);
          band.material = accentMaterial;
        } else {
          const hairCap = lowpoly(B.MeshBuilder.CreateSphere(`hair-cap-${index}`, { diameter: 0.535, segments: 8 }, scene));
          hairCap.parent = root;
          hairCap.position.set(0, 2.31, 0.04);
          hairCap.scaling.set(0.94, 0.62, 0.92);
          hairCap.material = hairMaterial;
          if (player.style === 'bob' || player.style === 'wave') {
            for (const side of [-1, 1]) {
              const lock = lowpoly(B.MeshBuilder.CreateSphere(`hair-lock-${index}-${side}`, { diameter: 0.25, segments: 6 }, scene));
              lock.parent = root;
              lock.position.set(side * 0.21, 2.17, 0.015);
              lock.scaling.set(0.75, 1.45, 0.72);
              lock.material = hairMaterial;
            }
          }
          if (player.style === 'wave') {
            const backHair = lowpoly(B.MeshBuilder.CreateSphere(`hair-back-${index}`, { diameter: 0.34, segments: 6 }, scene));
            backHair.parent = root;
            backHair.position.set(0, 2.05, -0.16);
            backHair.scaling.set(0.9, 1.9, 0.55);
            backHair.material = hairMaterial;
          }
          if (player.style === 'bun') {
            const bun = lowpoly(B.MeshBuilder.CreateSphere(`hair-bun-${index}`, { diameter: 0.27, segments: 6 }, scene));
            bun.parent = root;
            bun.position.set(0, 2.38, -0.2);
            bun.material = hairMaterial;
          }
        }

        for (const side of [-1, 1]) {
          const upperArm = addShadow(lowpoly(B.MeshBuilder.CreateCylinder(`upper-arm-${index}-${side}`, { diameterTop: 0.17, diameterBottom: 0.22, height: 0.68, tessellation: 7 }, scene)));
          upperArm.parent = root;
          upperArm.position.set(side * 0.39, 1.42, 0.15);
          upperArm.rotation.x = 0.42;
          upperArm.rotation.z = side * 0.13;
          upperArm.material = suitMaterial;

          const forearm = addShadow(lowpoly(B.MeshBuilder.CreateCylinder(`forearm-${index}-${side}`, { diameterTop: 0.16, diameterBottom: 0.13, height: 0.72, tessellation: 7 }, scene)));
          forearm.parent = root;
          forearm.position.set(side * 0.37, 1.22, 0.48);
          forearm.rotation.x = 1.17;
          forearm.rotation.z = side * 0.1;
          forearm.material = suitMaterial;

          const hand = lowpoly(B.MeshBuilder.CreateSphere(`hand-${index}-${side}`, { diameter: 0.17, segments: 6 }, scene));
          hand.parent = root;
          hand.position.set(side * 0.35, 1.23, 0.79);
          hand.scaling.set(0.82, 0.5, 1.15);
          hand.material = faceMaterial;
          // Manchette de chemise entre la manche et la main.
          const cuff = B.MeshBuilder.CreateCylinder(`cuff-${index}-${side}`, { diameter: 0.2, height: 0.06, tessellation: 14 }, scene);
          cuff.parent = root;
          cuff.position.set(side * 0.36, 1.235, 0.68);
          cuff.rotation.x = 1.17;
          cuff.material = makeMaterial('cuff', '#ddd3bf', 0.1);
        }

        const dossier = B.MeshBuilder.CreateBox(`dossier-${index}`, { width: 0.55, height: 0.025, depth: 0.36 }, scene);
        dossier.parent = root;
        dossier.position.set(0, 1.5, 1.12);
        dossier.material = makeMaterial('dossier', '#211711', 0.04);

        // ── Accessoires de mafieux : cigare fumant OU verre de whisky ──
        if (!isFemale && player.style === 'fedora' && rnd(5) < 0.55) {
          const cigar = B.MeshBuilder.CreateCylinder(`cigar-${index}`, { diameter: 0.035, height: 0.16, tessellation: 6 }, scene);
          cigar.parent = root;
          cigar.position.set(0.09, 2.09, 0.31);
          cigar.rotation.x = Math.PI / 2 - 0.25;
          cigar.rotation.z = -0.3;
          cigar.material = makeMaterial('cigar', '#4a2c14', 0.08);
          const ember = B.MeshBuilder.CreateSphere(`ember-${index}`, { diameter: 0.03, segments: 6 }, scene);
          ember.parent = root;
          ember.position.set(0.125, 2.115, 0.38);
          const emberMaterial = new B.StandardMaterial(`ember-material-${index}`, scene);
          emberMaterial.diffuseColor = B.Color3.Black();
          emberMaterial.emissiveColor = B.Color3.FromHexString('#ff5a24');
          ember.material = emberMaterial;
          glow.addIncludedOnlyMesh(ember);
        } else if (rnd(6) < 0.45) {
          const glass = B.MeshBuilder.CreateCylinder(`glass-${index}`, {
            diameterTop: 0.11, diameterBottom: 0.09, height: 0.12, tessellation: 8,
          }, scene);
          glass.parent = root;
          glass.position.set(0.4, 1.57, 1.02);
          const glassMaterial = new B.StandardMaterial(`glass-material-${index}`, scene);
          glassMaterial.diffuseColor = B.Color3.FromHexString('#9a8f7a');
          glassMaterial.alpha = 0.35;
          glassMaterial.specularColor = new B.Color3(0.5, 0.5, 0.45);
          glass.material = glassMaterial;
          const whisky = B.MeshBuilder.CreateCylinder(`whisky-${index}`, {
            diameter: 0.085, height: 0.05, tessellation: 8,
          }, scene);
          whisky.parent = root;
          whisky.position.set(0.4, 1.545, 1.02);
          whisky.material = makeMaterial('whisky', '#8a4d12', 0.3, '#3a1e05');
        }

        const tag = new B.GUI.Rectangle(`tag-${index}`);
        tag.height = '30px';
        tag.cornerRadius = 4;
        tag.thickness = 1;
        tag.color = 'rgba(224,178,90,.82)';
        tag.background = 'rgba(8,7,6,.9)';
        tag.adaptWidthToChildren = true;
        tag.shadowColor = 'rgba(0,0,0,.72)';
        tag.shadowBlur = 10;
        tag.paddingLeft = '2px';
        tag.paddingRight = '2px';
        gui.addControl(tag);
        tag.linkWithMesh(head);
        tag.linkOffsetY = player.style === 'fedora' ? -61 : -52;

        const label = new B.GUI.TextBlock(`label-${index}`);
        label.text = `  ${String(index + 1).padStart(2, '0')}  ${player.name}  `;
        label.color = '#f3e3c5';
        label.fontSize = 12;
        label.fontWeight = '700';
        label.fontFamily = 'Inter, sans-serif';
        label.resizeToFit = true;
        tag.addControl(label);

        const motionOffset = index * 0.61;
        scene.onBeforeRenderObservable.add(() => {
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
          const time = performance.now() / 1000;
          const breath = Math.sin(time * 1.05 + motionOffset) * 0.008;
          torso.scaling.y = 1 + breath;
          head.position.y = 2.19 + breath * 0.7;
        });
      };

      const createImportedPlayer = (player, index) => {
        const angle = (index / PLAYERS.length) * Math.PI * 2 - Math.PI / 2;
        const root = new B.TransformNode(`glb-player-${index}`, scene);
        root.position.set(Math.cos(angle) * 3.85, 0, Math.sin(angle) * 3.05);
        root.lookAt(new B.Vector3(0, 0, 0));

        const chairWood = makeMaterial('glb-chair-wood', '#25140b', 0.18);
        const chairLeather = makeMaterial('glb-chair-leather', '#301b15', 0.1);
        const chairAccent = makeMaterial(`glb-chair-accent-${index}`, player.accent, 0.24);

        // Assise rehaussée (0.86) : personnage plus haut, pieds au sol.
        const seat = addShadow(B.MeshBuilder.CreateBox(`glb-seat-${index}`, { width: 0.92, depth: 0.9, height: 0.15 }, scene));
        seat.parent = root;
        seat.position.set(0, 0.86, -0.18);
        seat.material = chairLeather;

        // Pieds de chaise : quatre pieds tournés + barreaux latéraux.
        for (const sx of [-1, 1]) {
          for (const sz of [-1, 1]) {
            const leg = B.MeshBuilder.CreateCylinder(`glb-chair-leg-${index}-${sx}-${sz}`, {
              diameterTop: 0.08, diameterBottom: 0.105, height: 0.82, tessellation: 12,
            }, scene);
            leg.parent = root;
            leg.position.set(sx * 0.39, 0.41, -0.18 + sz * 0.35);
            leg.material = chairWood;
          }
          const stretcher = B.MeshBuilder.CreateCylinder(`glb-chair-stretcher-${index}-${sx}`, {
            diameter: 0.05, height: 0.74, tessellation: 10,
          }, scene);
          stretcher.parent = root;
          stretcher.rotation.x = Math.PI / 2;
          stretcher.position.set(sx * 0.39, 0.3, -0.18);
          stretcher.material = chairWood;
        }

        const chairBack = addShadow(B.MeshBuilder.CreateBox(`glb-chair-back-${index}`, { width: 0.94, depth: 0.13, height: 1.28 }, scene));
        chairBack.parent = root;
        chairBack.position.set(0, 1.55, -0.52);
        chairBack.material = chairLeather;

        const topRail = B.MeshBuilder.CreateBox(`glb-chair-rail-${index}`, { width: 1.04, depth: 0.17, height: 0.12 }, scene);
        topRail.parent = root;
        topRail.position.set(0, 2.22, -0.52);
        topRail.material = chairWood;

        for (const side of [-1, 1]) {
          const post = B.MeshBuilder.CreateCylinder(`glb-chair-post-${index}-${side}`, { diameter: 0.11, height: 1.62, tessellation: 18 }, scene);
          post.parent = root;
          post.position.set(side * 0.49, 1.45, -0.53);
          post.material = chairWood;
          const finial = B.MeshBuilder.CreateSphere(`glb-chair-finial-${index}-${side}`, { diameter: 0.18, segments: 14 }, scene);
          finial.parent = root;
          finial.position.set(side * 0.49, 2.3, -0.53);
          finial.material = chairAccent;
        }

        // avatarRoot : ancre sur la chaise (orientation vers la table + assise).
        // fitNode : normalisation du modèle, MESURÉE EN ESPACE NEUTRE (à
        // l'origine, sans rotation) puis parentée — mélanger bornes monde et
        // position locale éparpillait les personnages loin des chaises.
        const isFemale = ['bob', 'wave', 'bun'].includes(player.style);

        // ── Combinaison de skin DÉTERMINISTE par joueur : tenue habillée,
        // teinte de peau, coiffure, barbe — stable d'un rendu à l'autre.
        const rndSkin = (n) => {
          const v = Math.sin(index * 91.7 + n * 47.3) * 43758.5453;
          return v - Math.floor(v);
        };
        const look = {
          outfit: rndSkin(1) < 0.5 ? 'Peasant' : 'Ranger',
          skinTone: rndSkin(2) < 0.72 ? 'light' : 'dark',
          hairstyle: isFemale
            ? ['Hair_BuzzedFemale', 'Hair_Long', 'Hair_Buns'][Math.floor(rndSkin(3) * 3)]
            : ['Hair_Buzzed', 'Hair_SimpleParted', 'Hair_Long'][Math.floor(rndSkin(3) * 3)],
          beard: !isFemale && rndSkin(4) < 0.4,
        };

        const avatarRoot = new B.TransformNode(`quaternius-avatar-${index}`, scene);
        avatarRoot.parent = root;
        avatarRoot.rotation.y = 0; // les Quaternius regardent déjà +Z → face à la table
        avatarRoot.position.set(0, 0, -0.12);

        const fitNode = new B.TransformNode(`quaternius-fit-${index}`, scene);
        const instance = characterAssets[`body-${isFemale ? 'female' : 'male'}`].instantiateModelsToScene(
          (sourceName) => `q-${index}-${sourceName}`,
          true,
          { doNotInstantiate: true },
        );
        instance.rootNodes.forEach((modelRoot) => { modelRoot.parent = fitNode; });

        // Tenue par-dessus le corps (même squelette, même espace modèle).
        const outfitContainer = characterAssets[`outfit-${isFemale ? 'female' : 'male'}-${look.outfit}`];
        if (outfitContainer) {
          const outfitInstance = outfitContainer.instantiateModelsToScene(
            (sourceName) => `qo-${index}-${sourceName}`,
            true,
            { doNotInstantiate: true },
          );
          outfitInstance.rootNodes.forEach((node) => { node.parent = fitNode; });
        }

        // Coiffure / sourcils / barbe : attachés à l'os de la tête (setParent
        // préserve la position monde) → ils suivront la pose assise.
        const headNode = fitNode.getChildTransformNodes(false)
          .find((node) => node.name.split('-').pop() === 'Head');
        const attachToHead = (key) => {
          const container = characterAssets[key];
          if (!container) return;
          const part = container.instantiateModelsToScene(
            (sourceName) => `qh-${index}-${key}-${sourceName}`,
            true,
            { doNotInstantiate: true },
          );
          part.rootNodes.forEach((node) => {
            node.parent = fitNode;
            if (headNode) node.setParent(headNode);
          });
        };
        attachToHead(look.hairstyle);
        attachToHead(isFemale ? 'Eyebrows_Female' : 'Eyebrows_Regular');
        if (look.beard) attachToHead('Hair_Beard');

        // 1. Normalisation en espace neutre. Taille volontairement généreuse
        // (2,25 m debout) : à l'échelle réelle, un humain assis derrière cette
        // grande table paraissait minuscule à la caméra.
        fitNode.computeWorldMatrix(true);
        let bounds = fitNode.getHierarchyBoundingVectors(true);
        const extentY = Math.max(0.001, bounds.max.y - bounds.min.y);
        const CHARACTER_HEIGHT = 2.8;
        const scaleFactor = CHARACTER_HEIGHT / extentY;
        fitNode.scaling.scaleInPlace(scaleFactor);
        fitNode.computeWorldMatrix(true);
        bounds = fitNode.getHierarchyBoundingVectors(true);
        fitNode.position.x -= (bounds.min.x + bounds.max.x) / 2;
        fitNode.position.z -= (bounds.min.z + bounds.max.z) / 2;
        fitNode.position.y -= bounds.min.y;
        fitNode.parent = avatarRoot;

        // 2. Pose ASSISE réelle : rotation des os du squelette (cuisses,
        // genoux, colonne, bras) — plus d'astuce de masquage.
        applySeatedPose(avatarRoot);
        // Une fois les jambes pliées, le bassin descend au niveau de l'assise
        // (les hanches sont à ~52 % de la taille debout).
        const SEAT_TOP = 0.94;
        avatarRoot.position.y = SEAT_TOP - CHARACTER_HEIGHT * 0.52;

        // 3. Matériaux : peau par TEXTURE (light/dark), tenue teintée aux
        // couleurs du joueur, coiffure intégrée du corps masquée, tranche au
        // cou (le corps musclé transpercerait la tenue).
        const suitTint = B.Color3.FromHexString(player.suit);
        const hairTint = B.Color3.FromHexString(player.hair);
        // Hauteur monde du cou en position ASSISE : bassin sur l'assise +
        // longueur de buste (le cou est à ~82,5 % de la taille debout).
        const clipY = 0.94 + (0.825 - 0.52) * CHARACTER_HEIGHT;
        avatarRoot.getChildMeshes(false).forEach((mesh) => {
          mesh.isPickable = false;
          // Boîte englobante des clones skinnés parfois fausse → anti-culling.
          mesh.alwaysSelectAsActiveMesh = true;
          shadows.addShadowCaster(mesh);
          mesh.receiveShadows = true;

          const material = mesh.material;
          if (!material) return;
          const materialName = material.name ?? '';

          // La coiffure moulée dans le corps est remplacée par nos attaches.
          if (/MI_Hair/i.test(materialName) && mesh.name.startsWith(`q-${index}`)) {
            mesh.setEnabled(false);
            return;
          }

          if (/Superhero/i.test(materialName)) {
            // Corps : texture de peau choisie + tranche sous le cou.
            const skinMat = material.clone(`skin-p${index}`);
            const url = SKIN_TEXTURES[isFemale ? 'female' : 'male'][look.skinTone];
            if (!skinTextureCache.has(url)) skinTextureCache.set(url, new B.Texture(url, scene, false, false));
            if ('albedoTexture' in skinMat) skinMat.albedoTexture = skinTextureCache.get(url);
            else if ('diffuseTexture' in skinMat) skinMat.diffuseTexture = skinTextureCache.get(url);
            // Rehaussement doux : les visages restaient noyés dans la pénombre.
            if ('emissiveColor' in skinMat) skinMat.emissiveColor = new B.Color3(0.085, 0.062, 0.045);
            if ('emissiveIntensity' in skinMat) skinMat.emissiveIntensity = 1;
            mesh.material = skinMat;
            mesh.onBeforeRenderObservable.add(() => { scene.clipPlane = new B.Plane(0, -1, 0, clipY); });
            mesh.onAfterRenderObservable.add(() => { scene.clipPlane = null; });
            return;
          }

          let tint = null;
          let strength = 0;
          if (/Peasant|Ranger/i.test(materialName)) { tint = suitTint; strength = 0.45; }
          else if (/Hair/i.test(materialName)) { tint = hairTint; strength = 0.7; }
          if (!tint) return;
          const tinted = material.clone(`${materialName}-p${index}`);
          if ('albedoColor' in tinted) {
            tinted.albedoColor = B.Color3.Lerp(B.Color3.White(), tint, strength);
          } else if ('diffuseColor' in tinted) {
            tinted.diffuseColor = B.Color3.Lerp(B.Color3.White(), tint, strength);
          }
          if ('roughness' in tinted) tinted.roughness = Math.max(tinted.roughness ?? 0, 0.5);
          mesh.material = tinted;
        });

        const dossier = B.MeshBuilder.CreateBox(`glb-dossier-${index}`, { width: 0.56, height: 0.025, depth: 0.38 }, scene);
        dossier.parent = root;
        dossier.position.set(0, 1.5, 1.1);
        dossier.material = makeMaterial('glb-dossier', '#201610', 0.05);

        const anchor = B.MeshBuilder.CreateSphere(`glb-tag-anchor-${index}`, { diameter: 0.01, segments: 4 }, scene);
        anchor.parent = root;
        anchor.position.set(0, 2.35, 0); // au-dessus de la tête assise
        anchor.visibility = 0;
        anchor.isPickable = false;

        const tag = new B.GUI.Rectangle(`glb-tag-${index}`);
        tag.height = '30px';
        tag.cornerRadius = 4;
        tag.thickness = 1;
        tag.color = `${player.accent}dd`;
        tag.background = 'rgba(8,7,6,.9)';
        tag.adaptWidthToChildren = true;
        tag.shadowColor = 'rgba(0,0,0,.76)';
        tag.shadowBlur = 11;
        tag.paddingLeft = '2px';
        tag.paddingRight = '2px';
        gui.addControl(tag);
        tag.linkWithMesh(anchor);
        tag.linkOffsetY = -26;

        const label = new B.GUI.TextBlock(`glb-label-${index}`);
        label.text = `  ${String(index + 1).padStart(2, '0')}  ${player.name}  `;
        label.color = '#f6ead5';
        label.fontSize = 12;
        label.fontWeight = '700';
        label.fontFamily = 'Inter, sans-serif';
        label.resizeToFit = true;
        tag.addControl(label);

        // Respiration : on oscille AUTOUR de la position normalisée calculée
        // plus haut (l'écraser figerait le personnage au mauvais endroit).
        const restingY = avatarRoot.position.y;
        const motionOffset = index * 0.61;
        scene.onBeforeRenderObservable.add(() => {
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
          avatarRoot.position.y = restingY + Math.sin(performance.now() / 1150 + motionOffset) * 0.006;
        });
      };

      if (characterAssets) PLAYERS.forEach(createImportedPlayer);
      else PLAYERS.forEach(createPlayer);

      const dust = new B.ParticleSystem('dust', 90, scene);
      dust.particleTexture = new B.Texture('https://assets.babylonjs.com/textures/flare.png', scene);
      dust.emitter = new B.Vector3(0, 2.4, 0.5);
      dust.minEmitBox = new B.Vector3(-7, -1.2, -5);
      dust.maxEmitBox = new B.Vector3(7, 2.6, 5);
      dust.color1 = new B.Color4(1, 0.68, 0.35, 0.045);
      dust.color2 = new B.Color4(0.7, 0.48, 0.28, 0.018);
      dust.minSize = 0.018;
      dust.maxSize = 0.07;
      dust.minLifeTime = 6;
      dust.maxLifeTime = 12;
      dust.emitRate = 8;
      dust.direction1 = new B.Vector3(-0.025, 0.005, -0.02);
      dust.direction2 = new B.Vector3(0.025, 0.04, 0.02);
      dust.start();

      const setPhaseLighting = (key) => {
        const next = PHASES[key] ?? PHASES.jour;
        ambient.diffuse = B.Color3.FromHexString(next.ambient);
        ambient.intensity = next.ambientI;
        keyLight.diffuse = B.Color3.FromHexString(next.key);
        keyLight.intensity = next.keyI;
        rimLight.diffuse = B.Color3.FromHexString(next.rim);
        rimLight.intensity = next.rimI;
        scene.fogColor = B.Color3.FromHexString(next.fog);
        scene.fogDensity = next.fogDensity;
        imageFx.exposure = next.exposure;
        // Le ciel des fenêtres est redessiné pour la phase (lune, étoiles,
        // couleurs), et la teinte du "verre" suit l'ambiance.
        for (const sky of skyTextures) {
          const size = sky.getSize();
          drawSky(sky.getContext(), size.width, size.height, next);
          sky.update();
        }
        for (const glassMat of glassMaterials) {
          glassMat.emissiveColor = new B.Color3(...next.glass);
        }
        lampLights.forEach((lamp) => {
          lamp.diffuse = B.Color3.FromHexString(next.key);
          lamp.intensity = key === 'nuit' ? 4.5 : 3.2;
        });
        bulbMaterials.forEach((material) => {
          material.emissiveColor = B.Color3.FromHexString(next.key);
        });
        sconces.forEach((sconce) => {
          sconce.material.emissiveColor = B.Color3.FromHexString(next.key);
        });
      };

      setPhaseLighting('jour');
      sceneApi.current = { setPhase: setPhaseLighting };

      const renderLoop = () => scene.render();
      const onResize = () => engine.resize();
      engine.runRenderLoop(renderLoop);
      window.addEventListener('resize', onResize);
      setStatus('');

      cleanup = () => {
        window.removeEventListener('resize', onResize);
        sceneApi.current = null;
        engine?.stopRenderLoop(renderLoop);
        engine?.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  const activePhase = PHASES[phase];

  return (
    <main className={`${styles.lab} ${styles[`phase_${phase}`]}`}>
      <canvas ref={canvasRef} className={styles.canvas} aria-label="Salle de conseil mafieuse interactive en trois dimensions" />

      <header className={styles.topbar}>
        <div className={styles.brand}>
          <Image src="/brand/mafia-logo-minimal.png" alt="MAFIA" width={123} height={40} priority />
          <span>LABORATOIRE 3D</span>
        </div>

        <div className={styles.roundStatus} aria-live="polite">
          <span className={styles.phaseIcon}>{activePhase.icon}</span>
          <div>
            <small>JOUR 3 · 10 JOUEURS</small>
            <strong>{activePhase.label}</strong>
            <p>{activePhase.kicker}</p>
          </div>
          <time>02:14</time>
        </div>

        <span style={{ display: 'flex', gap: 10 }}>
          <Link href="/lab3d/studio" className={styles.backLink}>🎨 STUDIO PERSONNAGE</Link>
          <Link href="/lobby" className={styles.backLink}>← RETOUR AU LOBBY</Link>
        </span>
      </header>

      <aside className={styles.partyCard}>
        <span className={styles.liveDot} />
        <div>
          <small>PARTIE #A7B2</small>
          <strong>Conseil du village</strong>
        </div>
      </aside>

      <aside className={styles.promptCard}>
        <small>DISCUSSION EN COURS</small>
        <strong>Qui cache son jeu ?</strong>
        <span>Observez les réactions autour de la table.</span>
      </aside>

      {status && (
        <div className={styles.loading} role="status">
          <span />
          <p>{status}</p>
        </div>
      )}

      <nav className={styles.phaseRail} aria-label="Changer l’ambiance de la scène">
        {Object.entries(PHASES).map(([key, item]) => (
          <button
            key={key}
            type="button"
            className={phase === key ? styles.active : ''}
            onClick={() => switchPhase(key)}
            aria-pressed={phase === key}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className={styles.controlsHint}>
        <span>↔</span> Glisser pour observer
        <i />
        <span>◎</span> Molette pour zoomer
      </div>

      <span className={styles.modelCredit}>
        Personnages low-poly maison · rendu Babylon.js
      </span>

      <div className={styles.cinematicShade} aria-hidden="true" />
    </main>
  );
}
