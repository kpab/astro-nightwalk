/**
 * buildings.ts - プロシージャルビル生成
 * 様々な形状のビルを動的に生成（窓の明かり付き）
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

// ビルタイプ定義
type BuildingType = 'box' | 'tower' | 'wide' | 'stepped';

interface BuildingParams {
  width: number;
  height: number;
  depth: number;
  type: BuildingType;
}

// テクスチャキャッシュ
const textureCache: Map<string, THREE.Texture> = new Map();

/**
 * ランダムな値を範囲内で生成
 */
function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * ビルタイプをランダムに選択
 */
function getRandomBuildingType(): BuildingType {
  const types: BuildingType[] = ['box', 'box', 'tower', 'wide', 'stepped'];
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * 窓テクスチャをCanvasで動的に生成
 */
function createWindowTexture(
  width: number,
  height: number,
  windowLitChance: number = 0.4
): THREE.CanvasTexture {
  const cacheKey = `${Math.round(width)}_${Math.round(height)}_${Math.random().toString(36).substr(2, 5)}`;

  // キャッシュチェック（同じサイズなら再利用）
  // ただし、各ビルでユニークにするため、毎回新しいテクスチャを生成
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // 解像度設定
  const scale = 4; // テクスチャの解像度
  canvas.width = 64 * scale;
  canvas.height = Math.round((height / width) * 64) * scale;

  // 背景（ビルの壁）
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 窓のグリッド設定
  const windowWidth = 6 * scale;
  const windowHeight = 8 * scale;
  const windowGapX = 4 * scale;
  const windowGapY = 5 * scale;

  const cols = Math.floor(canvas.width / (windowWidth + windowGapX));
  const rows = Math.floor(canvas.height / (windowHeight + windowGapY));

  // 窓を描画
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * (windowWidth + windowGapX) + windowGapX / 2;
      const y = row * (windowHeight + windowGapY) + windowGapY / 2;

      if (Math.random() < windowLitChance) {
        // 点灯している窓
        const color = WINDOW_COLORS[Math.floor(Math.random() * WINDOW_COLORS.length)];

        // グロー効果
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

        // 窓本体
        ctx.fillStyle = color;
        ctx.fillRect(x, y, windowWidth, windowHeight);
      } else {
        // 消灯している窓（暗い）
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

  // 放射テクスチャも同じものを使用（明るい窓が光る）
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
 * 基本的なボックスビルを生成
 */
function createBoxBuilding(params: BuildingParams): THREE.Group {
  const group = new THREE.Group();

  const geometry = new THREE.BoxGeometry(params.width, params.height, params.depth);
  const color = BUILDING_COLORS[Math.floor(Math.random() * BUILDING_COLORS.length)];
  const material = createBuildingMaterial(params.width, params.height, color);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = params.height / 2;
  group.add(mesh);

  return group;
}

/**
 * タワー型ビルを生成（高くて細い）
 */
function createTowerBuilding(params: BuildingParams): THREE.Group {
  const group = new THREE.Group();

  // メインタワー
  const towerWidth = params.width * 0.7;
  const towerDepth = params.depth * 0.7;
  const geometry = new THREE.BoxGeometry(towerWidth, params.height, towerDepth);
  const color = BUILDING_COLORS[Math.floor(Math.random() * BUILDING_COLORS.length)];
  const material = createBuildingMaterial(towerWidth, params.height, color);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = params.height / 2;
  group.add(mesh);

  // 屋上構造物（窓なし）
  const roofHeight = params.height * 0.08;
  const roofGeometry = new THREE.BoxGeometry(towerWidth * 0.6, roofHeight, towerDepth * 0.6);
  const roofMaterial = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.85,
    metalness: 0.15,
  });
  const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
  roofMesh.position.y = params.height + roofHeight / 2;
  group.add(roofMesh);

  return group;
}

/**
 * 幅広ビルを生成（横長）
 */
function createWideBuilding(params: BuildingParams): THREE.Group {
  const group = new THREE.Group();

  const wideWidth = params.width * 1.5;
  const wideHeight = params.height * 0.6;
  const geometry = new THREE.BoxGeometry(wideWidth, wideHeight, params.depth);
  const color = BUILDING_COLORS[Math.floor(Math.random() * BUILDING_COLORS.length)];
  const material = createBuildingMaterial(wideWidth, wideHeight, color);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = wideHeight / 2;
  group.add(mesh);

  return group;
}

/**
 * 段差ビルを生成（複数のボックスを積み重ね）
 */
function createSteppedBuilding(params: BuildingParams): THREE.Group {
  const group = new THREE.Group();

  const color = BUILDING_COLORS[Math.floor(Math.random() * BUILDING_COLORS.length)];

  const steps = Math.floor(randomRange(2, 4));
  let currentY = 0;
  let currentWidth = params.width;
  let currentDepth = params.depth;

  for (let i = 0; i < steps; i++) {
    const stepHeight = params.height / steps;
    const geometry = new THREE.BoxGeometry(currentWidth, stepHeight, currentDepth);
    const material = createBuildingMaterial(currentWidth, stepHeight, color);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = currentY + stepHeight / 2;
    group.add(mesh);

    currentY += stepHeight;
    currentWidth *= 0.85;
    currentDepth *= 0.85;
  }

  return group;
}

/**
 * ビルを生成（タイプに基づく）
 */
function createBuilding(params: BuildingParams): THREE.Group {
  switch (params.type) {
    case 'tower':
      return createTowerBuilding(params);
    case 'wide':
      return createWideBuilding(params);
    case 'stepped':
      return createSteppedBuilding(params);
    default:
      return createBoxBuilding(params);
  }
}

/**
 * 配置位置の衝突チェック
 */
function checkCollision(
  position: THREE.Vector2,
  size: THREE.Vector2,
  placed: Array<{ position: THREE.Vector2; size: THREE.Vector2 }>
): boolean {
  const spacing = skylineConfig.buildings.spacing;

  for (const building of placed) {
    const minDistX = (size.x + building.size.x) / 2 + spacing;
    const minDistZ = (size.y + building.size.y) / 2 + spacing;

    if (
      Math.abs(position.x - building.position.x) < minDistX &&
      Math.abs(position.y - building.position.y) < minDistZ
    ) {
      return true;
    }
  }
  return false;
}

/**
 * 街並み全体を生成
 */
export function generateCityscape(scene: THREE.Scene, isMobile: boolean): void {
  const config = skylineConfig.buildings;
  const buildingCount = isMobile ? skylineConfig.performance.mobileBuildingCount : config.count;

  const placed: Array<{ position: THREE.Vector2; size: THREE.Vector2 }> = [];
  let attempts = 0;
  const maxAttempts = buildingCount * 10;

  while (placed.length < buildingCount && attempts < maxAttempts) {
    attempts++;

    // ランダムなビルパラメータを生成
    const width = randomRange(config.minWidth, config.maxWidth);
    const height = randomRange(config.minHeight, config.maxHeight);
    const depth = randomRange(config.minDepth, config.maxDepth);
    const type = getRandomBuildingType();

    // 中央付近は高いビルを配置する傾向
    const gridHalf = config.gridSize / 2;
    const x = randomRange(-gridHalf, gridHalf);
    const z = randomRange(-gridHalf * 0.3, gridHalf * 0.8); // 手前に多く配置

    const position = new THREE.Vector2(x, z);
    const size = new THREE.Vector2(width, depth);

    // 衝突チェック
    if (!checkCollision(position, size, placed)) {
      // 中央に近いほど高くする
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      const heightMultiplier = 1 + (1 - distanceFromCenter / gridHalf) * 0.5;

      const buildingParams: BuildingParams = {
        width,
        height: height * heightMultiplier,
        depth,
        type,
      };

      const building = createBuilding(buildingParams);
      building.position.set(x, 0, z);
      scene.add(building);

      placed.push({ position, size });
    }
  }

  // 地面を追加
  createGround(scene);
}

/**
 * 地面を生成
 */
function createGround(scene: THREE.Scene): void {
  const gridSize = skylineConfig.buildings.gridSize * 2;
  const geometry = new THREE.PlaneGeometry(gridSize, gridSize);
  const material = new THREE.MeshStandardMaterial({
    color: 0x0a0a14,
    roughness: 1,
    metalness: 0,
  });

  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  scene.add(ground);
}
