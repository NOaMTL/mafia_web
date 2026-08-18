'use client';

/**
 * STUDIO DE PERSONNAGE — concepteur de skins.
 * Un personnage Quaternius sur un plateau tournant, et tous les curseurs :
 * corps, teinte de peau, couleur de costume, coiffure, couleur de cheveux,
 * barbe, chapeau. C'est le banc d'essai du futur système de skins boutique.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const BASE_ROOT = '/models/Base%20Characters/Godot%20-%20UE/';
const TEX_ROOT = '/models/Base%20Characters/Textures/';
const HAIR_ROOT = '/models/Hairstyles/Origin%20at%200/glTF%20(Godot)/';

/** Teintes de peau : textures officielles du pack (le mâle "Light" a une faute
 * de frappe dans le pack : "Ligh"). */
const SKINS = {
  male:   { light: `${TEX_ROOT}T_Superhero_Male_Ligh.png`, dark: `${BASE_ROOT}T_Superhero_Male_Dark.png` },
  female: { light: `${TEX_ROOT}T_Superhero_Female_Light_BaseColor.png`, dark: `${BASE_ROOT}T_Superhero_Female_Dark_BaseColor.png` },
};

const OUTFIT_ROOT = '/models/outfit/outfits/Exports/glTF%20(Godot-Unreal)/Outfits/';

/** Tenues modulaires : personnages complets habillés, même gabarit/squelette. */
const OUTFITS = [
  { id: 'base',    label: 'Combinaison' },
  { id: 'Peasant', label: 'Paysan' },
  { id: 'Ranger',  label: 'Rôdeur' },
];

const HAIRSTYLES = [
  { id: 'none',         label: 'Aucune' },
  { id: 'Hair_Buzzed',       label: 'Rasé' },
  { id: 'Hair_SimpleParted', label: 'Raie classique' },
  { id: 'Hair_Long',         label: 'Longs' },
  { id: 'Hair_Buns',         label: 'Chignons' },
  { id: 'Hair_BuzzedFemale', label: 'Court féminin' },
];

const SUIT_COLORS = ['#262728', '#5b2026', '#263141', '#293a31', '#493425', '#3c2d42', '#6b6b6b', '#8a6d3b'];
const HAIR_COLORS = ['#201711', '#5a3618', '#8a281c', '#b8933f', '#3a3a3a', '#e0e0e0'];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${src}"]`);
    if (script) {
      if (script.dataset.loaded === '1' || window.BABYLON) { resolve(); return; }
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', () => reject(new Error(`Impossible de charger ${src}`)), { once: true });
      return;
    }
    script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.addEventListener('load', () => { script.dataset.loaded = '1'; resolve(); }, { once: true });
    script.addEventListener('error', () => reject(new Error(`Impossible de charger ${src}`)), { once: true });
    document.head.appendChild(script);
  });
}

async function ensureBabylon() {
  await loadScript('https://cdn.jsdelivr.net/npm/babylonjs@7.54.1/babylon.min.js');
  await loadScript('https://cdn.jsdelivr.net/npm/babylonjs-loaders@7.54.1/babylonjs.loaders.min.js');
  const startedAt = Date.now();
  while (!window.BABYLON?.Engine) {
    if (Date.now() - startedAt > 8000) throw new Error('Le moteur 3D ne répond pas.');
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
}

const DEFAULT_CONFIG = {
  gender: 'male',
  outfit: 'base',
  skinTone: 'light',
  suit: SUIT_COLORS[0],
  hairstyle: 'Hair_SimpleParted',
  hairColor: HAIR_COLORS[0],
  beard: false,
  hat: false,
  spin: true,
};

export default function CharacterStudioPage() {
  const canvasRef = useRef(null);
  const sceneApi = useRef(null);
  const [status, setStatus] = useState('Ouverture du studio…');
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const update = (patch) => setConfig((current) => ({ ...current, ...patch }));

  // Reconstruit le personnage quand la config change.
  useEffect(() => { sceneApi.current?.rebuild(config); }, [config]);

  useEffect(() => {
    let engine;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      try { await ensureBabylon(); } catch (error) {
        if (!disposed) setStatus(error.message);
        return;
      }
      if (disposed || !canvasRef.current) return;

      const B = window.BABYLON;
      engine = new B.Engine(canvasRef.current, true, { antialias: true });
      const scene = new B.Scene(engine);
      scene.clearColor = B.Color4.FromHexString('#0a0709ff');

      const imageFx = scene.imageProcessingConfiguration;
      imageFx.toneMappingEnabled = true;
      imageFx.toneMappingType = B.ImageProcessingConfiguration.TONEMAPPING_ACES;
      imageFx.exposure = 1.05;
      imageFx.contrast = 1.15;
      imageFx.vignetteEnabled = true;
      imageFx.vignetteWeight = 1.4;

      const camera = new B.ArcRotateCamera('camera', -Math.PI / 2, 1.32, 4.6, new B.Vector3(0, 1.05, 0), scene);
      camera.attachControl(canvasRef.current, true);
      camera.lowerRadiusLimit = 2.4;
      camera.upperRadiusLimit = 8;
      camera.lowerBetaLimit = 0.6;
      camera.upperBetaLimit = 1.5;
      camera.wheelDeltaPercentage = 0.015;
      camera.panningSensibility = 0;

      const ambient = new B.HemisphericLight('ambient', new B.Vector3(0, 1, 0), scene);
      ambient.diffuse = B.Color3.FromHexString('#9a8672');
      ambient.groundColor = B.Color3.FromHexString('#1c130c');
      ambient.intensity = 0.55;
      const keyLight = new B.PointLight('key', new B.Vector3(2.4, 3.4, -2.6), scene);
      keyLight.diffuse = B.Color3.FromHexString('#ffd9a5');
      keyLight.intensity = 12;
      keyLight.range = 14;
      const rimLight = new B.PointLight('rim', new B.Vector3(-2.2, 2.6, 2.6), scene);
      rimLight.diffuse = B.Color3.FromHexString('#7a90b8');
      rimLight.intensity = 5;
      rimLight.range = 12;

      // Sol + plateau tournant
      const floor = B.MeshBuilder.CreateGround('floor', { width: 30, height: 30 }, scene);
      const floorMaterial = new B.StandardMaterial('floor-material', scene);
      floorMaterial.diffuseColor = B.Color3.FromHexString('#15100b');
      floorMaterial.specularColor = new B.Color3(0.05, 0.04, 0.03);
      floor.material = floorMaterial;
      const pedestal = B.MeshBuilder.CreateCylinder('pedestal', { diameter: 2.3, height: 0.16, tessellation: 48 }, scene);
      pedestal.position.y = 0.08;
      const pedestalMaterial = new B.StandardMaterial('pedestal-material', scene);
      pedestalMaterial.diffuseColor = B.Color3.FromHexString('#2c1c0e');
      pedestalMaterial.specularColor = new B.Color3(0.2, 0.15, 0.1);
      pedestal.material = pedestalMaterial;
      const ring = B.MeshBuilder.CreateTorus('ring', { diameter: 2.3, thickness: 0.045, tessellation: 48 }, scene);
      ring.position.y = 0.165;
      const ringMaterial = new B.StandardMaterial('ring-material', scene);
      ringMaterial.emissiveColor = B.Color3.FromHexString('#8a6a2c');
      ringMaterial.diffuseColor = B.Color3.Black();
      ring.material = ringMaterial;

      // ── Chargement des conteneurs (corps + coiffures + sourcils + barbe) ──
      setStatus('Chargement des modèles…');
      const containers = {};
      const loadContainer = async (key, rootUrl, file) => {
        try { containers[key] = await B.SceneLoader.LoadAssetContainerAsync(rootUrl, file, scene); }
        catch (error) { console.warn(`Modèle indisponible : ${file}`, error); }
      };
      await Promise.all([
        loadContainer('body-male', BASE_ROOT, 'Superhero_Male_FullBody.gltf'),
        loadContainer('body-female', BASE_ROOT, 'Superhero_Female_FullBody.gltf'),
        loadContainer('Eyebrows_Regular', HAIR_ROOT, 'Eyebrows_Regular.gltf'),
        loadContainer('Eyebrows_Female', HAIR_ROOT, 'Eyebrows_Female.gltf'),
        loadContainer('Hair_Beard', HAIR_ROOT, 'Hair_Beard.gltf'),
        ...HAIRSTYLES.filter((h) => h.id !== 'none').map((h) => loadContainer(h.id, HAIR_ROOT, `${h.id}.gltf`)),
        ...['Male', 'Female'].flatMap((genderKey) => ['Peasant', 'Ranger'].map((outfitKey) =>
          loadContainer(`outfit-${genderKey.toLowerCase()}-${outfitKey}`, OUTFIT_ROOT, `${genderKey}_${outfitKey}.gltf`),
        )),
      ]);
      if (disposed) { Object.values(containers).forEach((c) => c.dispose()); return; }
      if (!containers['body-male'] || !containers['body-female']) {
        setStatus('Corps introuvables — vérifie public/models/Base Characters.');
        return;
      }

      const skinTextures = new Map(); // cache des textures de peau

      let currentRoot = null;
      let spinning = true;
      let buildStamp = 0;

      const rebuild = (cfg) => {
        const stamp = ++buildStamp;
        spinning = cfg.spin;
        // dispose(…, disposeMaterialAndTextures: FALSE) impérativement :
        // les instances partagent les matériaux des conteneurs sources — les
        // détruire casserait toutes les reconstructions suivantes.
        currentRoot?.dispose(false, false);
        if (stamp !== buildStamp) return;

        const root = new B.TransformNode('character-root', scene);
        currentRoot = root;
        const fit = new B.TransformNode('character-fit', scene);

        const tintClone = (mesh, tintHex, strength, tag) => {
          const material = mesh.material;
          if (!material) return;
          const tinted = material.clone(`${material.name}-${tag}-${stamp}`);
          const tint = B.Color3.FromHexString(tintHex);
          if ('albedoColor' in tinted) tinted.albedoColor = B.Color3.Lerp(B.Color3.White(), tint, strength);
          else if ('diffuseColor' in tinted) tinted.diffuseColor = B.Color3.Lerp(B.Color3.White(), tint, strength);
          if ('roughness' in tinted) tinted.roughness = Math.max(tinted.roughness ?? 0, 0.5);
          mesh.material = tinted;
        };

        // ── Corps de base : TOUJOURS présent (les tenues Quaternius n'ont
        // pas de tête — elle vient du corps, que la tenue recouvre). ──
        const body = containers[`body-${cfg.gender}`].instantiateModelsToScene((n) => `body-${stamp}-${n}`, true, { doNotInstantiate: true });
        body.rootNodes.forEach((node) => { node.parent = fit; });
        if (cfg.outfit !== 'base') {
          const outfitContainer = containers[`outfit-${cfg.gender}-${cfg.outfit}`];
          if (outfitContainer) {
            const outfit = outfitContainer.instantiateModelsToScene((n) => `outfit-${stamp}-${n}`, true, { doNotInstantiate: true });
            outfit.rootNodes.forEach((node) => { node.parent = fit; });
          }
        }
        fit.getChildMeshes(false).forEach((mesh) => {
          mesh.isPickable = false;
          mesh.alwaysSelectAsActiveMesh = true;
          const materialName = mesh.material?.name ?? '';
          // La coiffure intégrée du modèle est masquée : le studio la remplace.
          if (/MI_Hair/i.test(materialName)) { mesh.setEnabled(false); return; }
          if (/Peasant|Ranger/i.test(materialName)) {
            // Vêtements de la tenue : teinte costume par-dessus la texture.
            const material = mesh.material.clone(`outfit-${stamp}`);
            const tint = B.Color3.Lerp(B.Color3.White(), B.Color3.FromHexString(cfg.suit), 0.4);
            if ('albedoColor' in material) material.albedoColor = tint;
            else if ('diffuseColor' in material) material.diffuseColor = tint;
            mesh.material = material;
            return;
          }
          if (/Superhero/i.test(materialName)) {
            // Quand une tenue est portée, ce mesh sera tranché au cou plus bas.
            if (cfg.outfit !== 'base') mesh.metadata = { ...(mesh.metadata ?? {}), clipToHead: true };
            const material = mesh.material.clone(`skin-${stamp}`);
            // Teinte de peau : échange de la texture officielle Light/Dark.
            const url = SKINS[cfg.gender][cfg.skinTone];
            if (!skinTextures.has(url)) skinTextures.set(url, new B.Texture(url, scene, false, false));
            if ('albedoTexture' in material) material.albedoTexture = skinTextures.get(url);
            else if ('diffuseTexture' in material) material.diffuseTexture = skinTextures.get(url);
            // Couleur du costume : teinte multiplicative par-dessus la texture.
            const tint = B.Color3.Lerp(B.Color3.White(), B.Color3.FromHexString(cfg.suit), 0.45);
            if ('albedoColor' in material) material.albedoColor = tint;
            else if ('diffuseColor' in material) material.diffuseColor = tint;
            mesh.material = material;
          }
        });

        // ── Attaches : coiffure, sourcils, barbe (même espace modèle) ──
        const attach = (key, tintHex, strength) => {
          const container = containers[key];
          if (!container) return;
          const part = container.instantiateModelsToScene((n) => `${key}-${stamp}-${n}`, true, { doNotInstantiate: true });
          part.rootNodes.forEach((node) => { node.parent = fit; });
          part.rootNodes.forEach((node) => {
            node.getChildMeshes(false).concat(node.getClassName?.() === 'Mesh' ? [node] : []).forEach((mesh) => {
              if (mesh.material) tintClone(mesh, tintHex, strength, key);
              mesh.isPickable = false;
              mesh.alwaysSelectAsActiveMesh = true;
            });
          });
        };
        if (cfg.hairstyle !== 'none') attach(cfg.hairstyle, cfg.hairColor, 0.75);
        attach(cfg.gender === 'female' ? 'Eyebrows_Female' : 'Eyebrows_Regular', cfg.hairColor, 0.8);
        if (cfg.beard && cfg.gender === 'male') attach('Hair_Beard', cfg.hairColor, 0.75);

        // ── Normalisation : 1,80 m debout, pieds sur le plateau ──
        fit.computeWorldMatrix(true);
        let bounds = fit.getHierarchyBoundingVectors(true);
        const scaleFactor = 1.8 / Math.max(0.001, bounds.max.y - bounds.min.y);
        fit.scaling.scaleInPlace(scaleFactor);
        fit.computeWorldMatrix(true);
        bounds = fit.getHierarchyBoundingVectors(true);
        fit.position.x -= (bounds.min.x + bounds.max.x) / 2;
        fit.position.z -= (bounds.min.z + bounds.max.z) / 2;
        fit.position.y += 0.16 - bounds.min.y;
        fit.parent = root;

        // ── Tenue portée : le corps musclé de base transpercerait l'habit
        // (il est plus épais que le corps "Regular" pour lequel les tenues
        // sont taillées). On le TRANCHE au niveau du cou avec un plan de
        // découpe : seule la tête est rendue, les mains venant de la tenue. ──
        if (cfg.outfit !== 'base') {
          const NECK_RATIO = 0.825; // coupe sous le col : le cou reste visible
          const clipY = 0.16 + 1.8 * NECK_RATIO;
          fit.getChildMeshes(false).forEach((mesh) => {
            if (!mesh.metadata?.clipToHead) return;
            mesh.onBeforeRenderObservable.add(() => {
              scene.clipPlane = new B.Plane(0, -1, 0, clipY);
            });
            mesh.onAfterRenderObservable.add(() => {
              scene.clipPlane = null;
            });
          });
        }

        // ── Chapeau fedora procédural, posé au sommet réel du crâne ──
        if (cfg.hat) {
          const topY = bounds.max.y - bounds.min.y + 0.16;
          const hatMaterial = new B.StandardMaterial(`hat-${stamp}`, scene);
          hatMaterial.diffuseColor = B.Color3.FromHexString(cfg.suit);
          hatMaterial.specularColor = new B.Color3(0.12, 0.1, 0.08);
          const brim = B.MeshBuilder.CreateCylinder(`hat-brim-${stamp}`, { diameter: 0.42, height: 0.025, tessellation: 32 }, scene);
          brim.parent = root;
          brim.position.set(0, topY - 0.06, 0.01);
          brim.material = hatMaterial;
          const crown = B.MeshBuilder.CreateCylinder(`hat-crown-${stamp}`, { diameterTop: 0.21, diameterBottom: 0.26, height: 0.17, tessellation: 32 }, scene);
          crown.parent = root;
          crown.position.set(0, topY + 0.02, 0.01);
          crown.material = hatMaterial;
          const band = B.MeshBuilder.CreateTorus(`hat-band-${stamp}`, { diameter: 0.25, thickness: 0.022, tessellation: 32 }, scene);
          band.parent = root;
          band.position.set(0, topY - 0.035, 0.01);
          const bandMaterial = new B.StandardMaterial(`band-${stamp}`, scene);
          bandMaterial.diffuseColor = B.Color3.FromHexString('#1a1208');
          band.material = bandMaterial;
        }
      };

      scene.onBeforeRenderObservable.add(() => {
        if (spinning && currentRoot) currentRoot.rotation.y += engine.getDeltaTime() / 4200;
      });

      sceneApi.current = { rebuild };
      rebuild(DEFAULT_CONFIG);

      engine.runRenderLoop(() => scene.render());
      const onResize = () => engine.resize();
      window.addEventListener('resize', onResize);
      setStatus('');

      cleanup = () => {
        window.removeEventListener('resize', onResize);
        sceneApi.current = null;
        engine?.dispose();
      };
    })();

    return () => { disposed = true; cleanup(); };
  }, []);

  // ── UI ──
  const S = {
    panel: { position: 'absolute', top: 70, left: 16, width: 280, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', background: 'rgba(7,8,11,.92)', border: '1px solid rgba(210,167,82,.35)', borderRadius: 14, padding: '16px 18px', backdropFilter: 'blur(12px)' },
    section: { margin: '14px 0 6px', fontSize: 11, letterSpacing: 2, color: '#d2a752', fontFamily: 'var(--font-cinzel, serif)' },
    row: { display: 'flex', flexWrap: 'wrap', gap: 7 },
    chip: (active) => ({ padding: '7px 12px', fontSize: 12, borderRadius: 8, cursor: 'pointer', border: `1px solid ${active ? '#d2a752' : 'rgba(255,255,255,.18)'}`, background: active ? 'rgba(210,167,82,.16)' : 'transparent', color: active ? '#e9bc5d' : 'rgba(255,255,255,.7)' }),
    swatch: (hex, active) => ({ width: 30, height: 30, borderRadius: 8, cursor: 'pointer', background: hex, border: `2px solid ${active ? '#e9bc5d' : 'rgba(255,255,255,.15)'}` }),
  };

  return (
    <main style={{ position: 'fixed', inset: 0, background: '#0a0709' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', outline: 'none' }} />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', pointerEvents: 'none' }}>
        <div style={{ color: '#f2e5c8', fontFamily: 'var(--font-cinzel, serif)', letterSpacing: 2, fontSize: 13 }}>
          STUDIO DE PERSONNAGE <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 11 }}>skins & essayage</span>
        </div>
        <Link href="/lab3d" style={{ pointerEvents: 'auto', color: '#e9bc5d', textDecoration: 'none', border: '1px solid rgba(210,167,82,.5)', borderRadius: 8, padding: '8px 14px', fontSize: 11, letterSpacing: 1.5, background: 'rgba(5,6,9,.7)' }}>← TABLE RONDE</Link>
      </div>

      <aside style={S.panel}>
        <div style={S.section}>CORPS</div>
        <div style={S.row}>
          <button style={S.chip(config.gender === 'male')} onClick={() => update({ gender: 'male', hairstyle: config.hairstyle === 'Hair_BuzzedFemale' ? 'Hair_SimpleParted' : config.hairstyle })}>Homme</button>
          <button style={S.chip(config.gender === 'female')} onClick={() => update({ gender: 'female', beard: false })}>Femme</button>
        </div>

        <div style={S.section}>TENUE</div>
        <div style={S.row}>
          {OUTFITS.map((o) => (
            <button key={o.id} style={S.chip(config.outfit === o.id)} onClick={() => update({ outfit: o.id })}>{o.label}</button>
          ))}
        </div>

        <div style={S.section}>TEINTE DE PEAU</div>
        <div style={S.row}>
          <button style={S.chip(config.skinTone === 'light')} onClick={() => update({ skinTone: 'light' })}>Claire</button>
          <button style={S.chip(config.skinTone === 'dark')} onClick={() => update({ skinTone: 'dark' })}>Foncée</button>
        </div>

        <div style={S.section}>COSTUME</div>
        <div style={S.row}>
          {SUIT_COLORS.map((hex) => (
            <button key={hex} style={S.swatch(hex, config.suit === hex)} onClick={() => update({ suit: hex })} aria-label={`Costume ${hex}`} />
          ))}
        </div>

        <div style={S.section}>COIFFURE</div>
        <div style={S.row}>
          {HAIRSTYLES.map((h) => (
            <button key={h.id} style={S.chip(config.hairstyle === h.id)} onClick={() => update({ hairstyle: h.id })}>{h.label}</button>
          ))}
        </div>

        <div style={S.section}>COULEUR DE CHEVEUX</div>
        <div style={S.row}>
          {HAIR_COLORS.map((hex) => (
            <button key={hex} style={S.swatch(hex, config.hairColor === hex)} onClick={() => update({ hairColor: hex })} aria-label={`Cheveux ${hex}`} />
          ))}
        </div>

        <div style={S.section}>OPTIONS</div>
        <div style={S.row}>
          {config.gender === 'male' && (
            <button style={S.chip(config.beard)} onClick={() => update({ beard: !config.beard })}>🧔 Barbe</button>
          )}
          <button style={S.chip(config.hat)} onClick={() => update({ hat: !config.hat })}>🎩 Fedora</button>
          <button style={S.chip(config.spin)} onClick={() => update({ spin: !config.spin })}>↻ Rotation</button>
        </div>
      </aside>

      {status && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(242,229,200,.75)', fontSize: 14 }}>{status}</div>
      )}
    </main>
  );
}
