/**
 * buildings.ts - プロシージャルビル生成（リアルなスカイライン版）
 * 複雑な形状のビルを生成し、リアルな夜景を作り出す
 */

import * as THREE from 'three';

// ビルのカラーパレット（リアルなコンクリート・ガラス・鋼鉄）
const BUILDING_COLORS = [
  0x2a2a35, // ダークグレー（コンクリート）
  0x1a1a25, // ブラックメタル
  0x303040, // 鉄骨系
  0x151520, // 深いガラス
  0x252530, // 都会的なグレー
  0x0a0a12, // 漆黒
];

// 窓設定（リアルなオフィス光）
const WINDOW_COLORS = [
  '#fff8e7', // 暖かいオフィスライト
  '#f0f8ff', // クールな蛍光灯
  '#e6e6fa', // 少し青みがかった白
  '#ffecd1', // オレンジ系
];

// チャンク設定
export const CHUNK_SIZE = 1000;
export const BUILDING_RANGE_X = 400; // 少し広げる
export const ROAD_WIDTH = 50;

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

  const scale = 2;
  canvas.width = 128;
  canvas.height = Math.round((height / width) * 128);

  // 背景（ビルの壁面）
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 窓のサイズ比率
  const windowW = 4;
  const windowH = 8;
  const gapX = 4;
  const gapY = 6;

  const cols = Math.floor(canvas.width / (windowW + gapX));
  const rows = Math.floor(canvas.height / (windowH + gapY));

  // たまに航空障害灯のような赤い点滅ライトを描画したいが、
  // 静的テクスチャなので、赤いライトを少し混ぜるだけに留める

  for (let row = 0; row < rows; row++) {
    // フロアごとの点灯パターン（オフィスビルっぽく、フロア単位で明るかったり暗かったり）
    const floorActive = Math.random() < 0.7;

    for (let col = 0; col < cols; col++) {
      // 窓が光る確率
      if (floorActive && Math.random() < windowLitChance) {
        const x = col * (windowW + gapX) + gapX;
        const y = row * (windowH + gapY) + gapY;

        ctx.fillStyle = WINDOW_COLORS[Math.floor(Math.random() * WINDOW_COLORS.length)];
        ctx.fillRect(x, y, windowW, windowH);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
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
    emissiveIntensity: 1.5, // 輝きを強める
    roughness: 0.1, // ガラス質
    metalness: 0.6, // 金属感
  });
}

/**
 * 複雑な形状のビル（超高層ビル）を作成
 */
function createSkyscraper(
  x: number,
  z: number,
  baseWidth: number,
  totalHeight: number,
  baseDepth: number
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0, z); // グループの原点は地面

  const color = BUILDING_COLORS[Math.floor(Math.random() * BUILDING_COLORS.length)];

  // スタイル決定
  const style = Math.random();

  if (style < 0.4) {
    // タイプA: セットバック（階段状）
    // 下層
    const h1 = totalHeight * 0.6;
    const mesh1 = new THREE.Mesh(
      new THREE.BoxGeometry(baseWidth, h1, baseDepth),
      createBuildingMaterial(baseWidth, h1, color)
    );
    mesh1.position.y = h1 / 2;
    group.add(mesh1);

    // 上層
    const w2 = baseWidth * 0.7;
    const d2 = baseDepth * 0.7;
    const h2 = totalHeight * 0.4;
    const mesh2 = new THREE.Mesh(
      new THREE.BoxGeometry(w2, h2, d2),
      createBuildingMaterial(w2, h2, color)
    );
    mesh2.position.y = h1 + h2 / 2;
    group.add(mesh2);

  } else if (style < 0.7) {
    // タイプB: ツインタワー風 or 凹凸
    const h1 = totalHeight;
    const w1 = baseWidth * 0.45;
    const d1 = baseDepth;

    // 左棟
    const mesh1 = new THREE.Mesh(
      new THREE.BoxGeometry(w1, h1, d1),
      createBuildingMaterial(w1, h1, color)
    );
    mesh1.position.set(-baseWidth / 4, h1 / 2, 0);
    group.add(mesh1);

    // 右棟
    const mesh2 = new THREE.Mesh(
      new THREE.BoxGeometry(w1, h1 * 0.9, d1),
      createBuildingMaterial(w1, h1 * 0.9, color)
    );
    mesh2.position.set(baseWidth / 4, (h1 * 0.9) / 2, 0);
    group.add(mesh2);

    // 連結部（低層）
    const hCenter = h1 * 0.3;
    const meshCenter = new THREE.Mesh(
      new THREE.BoxGeometry(baseWidth * 0.2, hCenter, d1 * 0.8),
      createBuildingMaterial(baseWidth * 0.2, hCenter, color)
    );
    meshCenter.position.set(0, hCenter / 2, 0);
    group.add(meshCenter);

  } else {
    // タイプC: シンプルなマッシブタワー
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(baseWidth, totalHeight, baseDepth),
      createBuildingMaterial(baseWidth, totalHeight, color)
    );
    mesh.position.y = totalHeight / 2;
    group.add(mesh);

    // アンテナ的なもの
    if (Math.random() < 0.5) {
      const antennaH = totalHeight * 0.15;
      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, antennaH, 8),
        new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 1.0, roughness: 0.2 })
      );
      antenna.position.y = totalHeight + antennaH / 2;
      group.add(antenna);
    }
  }

  return group;
}

/**
 * 1チャンク分の街並みを生成
 */
export function createCityChunk(chunkIndex: number, isMobile: boolean): THREE.Group {
  const group = new THREE.Group();

  // チャンク設定
  // リアルさを出すために数を調整
  const buildingCount = isMobile ? 25 : 50;
  const zStart = -chunkIndex * CHUNK_SIZE;
  const zEnd = zStart - CHUNK_SIZE;

  for (let i = 0; i < buildingCount; i++) {
    let x = randomRange(-BUILDING_RANGE_X, BUILDING_RANGE_X);
    if (Math.abs(x) < ROAD_WIDTH) {
      x = x > 0 ? x + ROAD_WIDTH : x - ROAD_WIDTH;
    }

    // リアルなスケール感
    // 手前と奥で分布を変える（より自然に）
    // 中心に近いほど高くする、というロジックも良いが、とりあえずランダム配置
    const width = randomRange(30, 80);
    const depth = randomRange(30, 80);

    // 高さは極端にばらつかせる
    let height = randomRange(80, 400);
    if (Math.random() < 0.1) height += 200; // たまに超高層ビル

    const z = randomRange(zEnd, zStart);

    const building = createSkyscraper(x, z, width, height, depth);
    group.add(building);
  }

  // 地面（道路）: アスファルト
  const floorGeo = new THREE.PlaneGeometry(BUILDING_RANGE_X * 2, CHUNK_SIZE);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.8,
    metalness: 0.2
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, zStart - CHUNK_SIZE / 2);
  group.add(floor);

  // 道路の白線などのディテール（簡易的）
  // センターライン
  const roadLineGeo = new THREE.BoxGeometry(2, 0.1, CHUNK_SIZE);
  const roadLineMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
  const roadLine = new THREE.Mesh(roadLineGeo, roadLineMat);
  roadLine.position.set(0, 0.1, zStart - CHUNK_SIZE / 2);
  group.add(roadLine);

  return group;
}

