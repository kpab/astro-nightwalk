/**
 * buildings.ts - プロシージャルビル生成（無限フライスルー版）
 * まっすぐな道に沿ってビルを生成
 */

import * as THREE from 'three';
import { skylineConfig } from '../config/skyline.config';

// ビルのカラーパレット（サイバーパンク/夜景風）
const BUILDING_COLORS = [
  0x1a1a2e, // 濃い青紫
  0x16213e, // 深い紺
  0x1f1f3d, // 暗い紫
  0x252540, // グレー紫
  0x0a0a1a, // ほぼ黒
];

// 窓設定
const WINDOW_COLORS = [
  '#ffcc66', // 暖かい黄色
  '#ffe4a0', // 淡い黄色
  '#66ccff', // シアン（サイバー感）
  '#ff3366', // ピンク（ネオン感）
];

// チャンク設定
export const CHUNK_SIZE = 1000; // 1チャンクの長さ
export const BUILDING_RANGE_X = 300; // 道路の左右の広がり
export const ROAD_WIDTH = 40; // 道路の幅（ビルを置かないエリア）

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
  windowLitChance: number = 0.3
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const scale = 2; // テクスチャ解像度調整
  canvas.width = 128;
  canvas.height = Math.round((height / width) * 128);
  
  // 背景（ビルの壁面）
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const windowW = 8;
  const windowH = 12;
  const gapX = 6;
  const gapY = 8;

  const cols = Math.floor(canvas.width / (windowW + gapX));
  const rows = Math.floor(canvas.height / (windowH + gapY));

  // ネオンボーダーを描く（たまに）
  if (Math.random() < 0.2) {
    ctx.strokeStyle = Math.random() > 0.5 ? '#00ffff' : '#ff00ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // 窓が光る確率
      if (Math.random() < windowLitChance) {
        const x = col * (windowW + gapX) + gapX;
        const y = row * (windowH + gapY) + gapY;
        
        const color = WINDOW_COLORS[Math.floor(Math.random() * WINDOW_COLORS.length)];
        ctx.fillStyle = color;
        ctx.fillRect(x, y, windowW, windowH);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;

  // GPUアップロード最適化
  texture.needsUpdate = true;

  return texture;
}

/**
 * ビル用マテリアルを作成
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
    emissive: 0xffffff,
    emissiveMap: emissiveTexture,
    emissiveIntensity: 1.0, 
    roughness: 0.2,
    metalness: 0.8,
  });
}

/**
 * 単体のビルを作成
 */
function createBuilding(
  x: number,
  z: number,
  width: number,
  height: number,
  depth: number
): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const color = BUILDING_COLORS[Math.floor(Math.random() * BUILDING_COLORS.length)];
  const material = createBuildingMaterial(width, height, color);

  const mesh = new THREE.Mesh(geometry, material);
  
  // 位置設定（yは底辺基準）
  mesh.position.set(x, height / 2, z);

  return mesh;
}

/**
 * 1チャンク分の街並みを生成
 * Groupを返して、後でZ位置をずらせるようにする
 */
export function createCityChunk(chunkIndex: number, isMobile: boolean): THREE.Group {
  const group = new THREE.Group();
  
  // チャンク設定
  const buildingCount = isMobile ? 30 : 60; // 1チャンクあたりのビル数
  const zStart = -chunkIndex * CHUNK_SIZE; // 前方に向かって伸びる（マイナスZ）
  const zEnd = zStart - CHUNK_SIZE;

  for (let i = 0; i < buildingCount; i++) {
    // 道路（X=0付近）を避けて配置
    let x = randomRange(-BUILDING_RANGE_X, BUILDING_RANGE_X);
    if (Math.abs(x) < ROAD_WIDTH) {
      x = x > 0 ? x + ROAD_WIDTH : x - ROAD_WIDTH;
    }

    // 遠くほど高くする、あるいはランダム
    // 手前ほど低くすると圧迫感が減るが、今回はランダムで
    const width = randomRange(20, 50);
    const depth = randomRange(20, 50);
    const height = randomRange(50, 300); // 摩天楼

    // Z座標はチャンク内でランダム
    const z = randomRange(zEnd, zStart);

    const building = createBuilding(x, z, width, height, depth);
    group.add(building);
  }

  // 地面（道路）もチャンクに含める
  const floorGeo = new THREE.PlaneGeometry(BUILDING_RANGE_X * 2, CHUNK_SIZE);
  const floorMat = new THREE.MeshStandardMaterial({ 
    color: 0x111111, 
    roughness: 0.1, 
    metalness: 0.5 
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, zStart - CHUNK_SIZE / 2);
  group.add(floor);
  
  // グリッド線（サイバーパンク感）
  const gridHelper = new THREE.GridHelper(CHUNK_SIZE, 20, 0x00ffff, 0x222222);
  gridHelper.position.set(0, 0.5, zStart - CHUNK_SIZE / 2);
  gridHelper.scale.set(BUILDING_RANGE_X * 2 / CHUNK_SIZE, 1, 1); // 幅に合わせる
  group.add(gridHelper);

  return group;
}

