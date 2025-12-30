/**
 * buildings.ts - プロシージャルビル生成（球体版）
 * 球体の表面にビルを配置
 */

import * as THREE from 'three';
import { skylineConfig } from '../config/skyline.config';

// ビルのカラーパレット（夕方のシルエット用）
const BUILDING_COLORS = [
  0x1a1a2e, // 濃い青紫
  0x16213e, // 深い紺
  0x1f1f3d, // 暗い紫
  0x252540, // グレー紫
  0x2d2d4a, // 中間紫
];

// 窓の明かりの色
const WINDOW_COLORS = [
  '#ffcc66', // 暖かい黄色
  '#ffe4a0', // 淡い黄色
  '#ffb366', // オレンジがかった黄色
  '#fff5cc', // 白に近い黄色
];

// 球体の設定
const SPHERE_RADIUS = 80; // 惑星の半径

/**
 * ランダムな値を範囲内で生成
 */
function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 窓テクスチャをCanvasで動的に生成
 */
function createWindowTexture(
  width: number,
  height: number,
  windowLitChance: number = 0.4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const scale = 4;
  canvas.width = 64 * scale;
  canvas.height = Math.round((height / width) * 64) * scale;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const windowWidth = 6 * scale;
  const windowHeight = 8 * scale;
  const windowGapX = 4 * scale;
  const windowGapY = 5 * scale;

  const cols = Math.floor(canvas.width / (windowWidth + windowGapX));
  const rows = Math.floor(canvas.height / (windowHeight + windowGapY));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * (windowWidth + windowGapX) + windowGapX / 2;
      const y = row * (windowHeight + windowGapY) + windowGapY / 2;

      if (Math.random() < windowLitChance) {
        const color = WINDOW_COLORS[Math.floor(Math.random() * WINDOW_COLORS.length)];

        const gradient = ctx.createRadialGradient(
          x + windowWidth / 2,
          y + windowHeight / 2,
          0,
          x + windowWidth / 2,
          y + windowHeight / 2,
          windowWidth
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color + '88');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(x - windowWidth / 2, y - windowHeight / 2, windowWidth * 2, windowHeight * 2);

        ctx.fillStyle = color;
        ctx.fillRect(x, y, windowWidth, windowHeight);
      } else {
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(x, y, windowWidth, windowHeight);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;

  return texture;
}

/**
 * ビル用マテリアルを作成（窓テクスチャ付き）
 */
function createBuildingMaterial(
  width: number,
  height: number,
  baseColor: number
): THREE.MeshStandardMaterial {
  const windowTexture = createWindowTexture(width, height);
  const emissiveTexture = windowTexture.clone();

  return new THREE.MeshStandardMaterial({
    color: baseColor,
    map: windowTexture,
    emissive: 0xffaa44,
    emissiveMap: emissiveTexture,
    emissiveIntensity: 0.8,
    roughness: 0.9,
    metalness: 0.1,
  });
}

/**
 * 球体表面上の位置を計算
 */
function getPositionOnSphere(theta: number, phi: number, radius: number): THREE.Vector3 {
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

/**
 * ビルを球体表面に配置
 */
function createBuildingOnSphere(
  theta: number,
  phi: number,
  width: number,
  height: number,
  depth: number
): THREE.Group {
  const group = new THREE.Group();

  const color = BUILDING_COLORS[Math.floor(Math.random() * BUILDING_COLORS.length)];
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = createBuildingMaterial(width, height, color);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = height / 2; // ビルの底を基準点に

  group.add(mesh);

  // 球体表面の位置を計算
  const surfacePosition = getPositionOnSphere(theta, phi, SPHERE_RADIUS);
  group.position.copy(surfacePosition);

  // ビルを球体の中心から外側に向ける
  group.lookAt(0, 0, 0);
  group.rotateX(Math.PI / 2); // ビルを外側に向ける

  return group;
}

/**
 * 球体惑星を生成
 */
function createPlanetCore(scene: THREE.Scene): void {
  // 惑星の核（地面）
  const coreGeometry = new THREE.SphereGeometry(SPHERE_RADIUS - 0.5, 64, 64);
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0a14,
    roughness: 1,
    metalness: 0,
  });

  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  scene.add(core);
}

/**
 * 街並み全体を球体上に生成
 */
export function generateCityscape(scene: THREE.Scene, isMobile: boolean): void {
  const config = skylineConfig.buildings;
  const buildingCount = isMobile ? skylineConfig.performance.mobileBuildingCount : config.count;

  // 惑星の核を作成
  createPlanetCore(scene);

  // ビルを球体全体に配置
  for (let i = 0; i < buildingCount; i++) {
    // 球体全体にランダムに配置
    const theta = Math.random() * Math.PI * 2; // 0 ~ 2π
    const phi = Math.acos(2 * Math.random() - 1); // 均一な球面分布

    const width = randomRange(config.minWidth * 0.5, config.maxWidth * 0.6);
    const height = randomRange(config.minHeight * 0.4, config.maxHeight * 0.5);
    const depth = randomRange(config.minDepth * 0.5, config.maxDepth * 0.6);

    const building = createBuildingOnSphere(theta, phi, width, height, depth);
    scene.add(building);
  }
}

/**
 * 球体の半径を取得（外部から参照用）
 */
export function getSphereRadius(): number {
  return SPHERE_RADIUS;
}
