/**
 * buildings.ts - プロシージャルビル生成（リアルなスカイライン版 - 夕暮れ）
 * 複雑な形状のビルを生成し、夕暮れ時のリアルな街並みを作り出す
 */

import * as THREE from 'three';

// ビルのカラーパレット（夕暮れに映えるコンクリート・ガラス・鋼鉄）
const BUILDING_COLORS = [
  0x3a3a45, // やや明るめのコンクリート（夕日を受ける）
  0x2a2a35, // 標準的なビルグレー
  0x1a1a25, // ダークメタル
  0x202030, // 青みがかったグレー
  0x403530, // ほんのり赤みを帯びたグレー
];

// 窓設定（夕暮れの反射 + 点灯し始めた明かり）
const WINDOW_COLORS = [
  '#ff9966', // 夕日の強い反射
  '#ffccaa', // 淡い反射
  '#556688', // 空の反射
  '#2a2a40', // 暗い部屋
  '#ffebcd', // 点灯し始めた暖かい光
];

// チャンク設定
export const CHUNK_SIZE = 1000;
export const BUILDING_RANGE_X = 400;
export const ROAD_WIDTH = 50;

/**
 * ランダムな値を範囲内で生成
 */
function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 窓テクスチャをCanvasで動的に生成（高精細化）
 */
function createWindowTexture(
  width: number,
  height: number,
  windowLitChance: number = 0.5
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const scale = 2;
  canvas.width = 256; // 解像度アップ
  canvas.height = Math.round((height / width) * 256);

  // 背景（ビルの壁面）
  ctx.fillStyle = '#151515';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 窓のスタイル（縦長、横長、カーテンウォール）
  const style = Math.random();
  let windowW, windowH, gapX, gapY;

  if (style < 0.4) {
    // 標準的なオフィス窓
    windowW = 6; windowH = 10; gapX = 4; gapY = 6;
  } else if (style < 0.7) {
    // 横長連窓
    windowW = 20; windowH = 8; gapX = 4; gapY = 8;
  } else {
    // 全面ガラス張り風（隙間小）
    windowW = 12; windowH = 12; gapX = 2; gapY = 2;
  }

  const cols = Math.floor(canvas.width / (windowW + gapX));
  const rows = Math.floor(canvas.height / (windowH + gapY));

  for (let row = 0; row < rows; row++) {
    // 夕暮れなので、「反射」か「明かり」かのロジック
    // 上層階ほど反射が強い（空に近い）
    const isTop = row < rows * 0.3;

    for (let col = 0; col < cols; col++) {
      const x = col * (windowW + gapX) + gapX;
      const y = row * (windowH + gapY) + gapY;

      let color;
      if (Math.random() < 0.2) {
        // 点灯（まばら）
        color = '#ffebcd';
      } else if (Math.random() < 0.4) {
        // 夕日の反射 (西側を想定するのは難しいのでランダムに散らす)
        color = Math.random() < 0.5 ? '#ff9966' : '#556688';
      } else {
        // 暗い or 微弱な反射
        color = '#1a1a25';
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, y, windowW, windowH);
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
  // エミッシブマップは窓テクスチャをそのまま使うが、強さを抑える
  const emissiveTexture = windowTexture.clone();

  return new THREE.MeshStandardMaterial({
    color: baseColor,
    map: windowTexture,
    emissive: 0xffffff,
    emissiveMap: emissiveTexture,
    emissiveIntensity: 0.5, // 夕暮れなので自己発光は控えめに
    roughness: 0.2, // ガラス感強め
    metalness: 0.7, // 金属感強め
  });
}

/**
 * 複雑な形状のビル（超高層ビル）を作成 + 屋上ディテール
 */
function createSkyscraper(
  x: number,
  z: number,
  baseWidth: number,
  totalHeight: number,
  baseDepth: number
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const color = BUILDING_COLORS[Math.floor(Math.random() * BUILDING_COLORS.length)];
  const style = Math.random();

  // メイン構造
  if (style < 0.4) {
    // セットバック型
    const h1 = totalHeight * 0.6;
    const mesh1 = new THREE.Mesh(
      new THREE.BoxGeometry(baseWidth, h1, baseDepth),
      createBuildingMaterial(baseWidth, h1, color)
    );
    mesh1.position.y = h1 / 2;
    group.add(mesh1);

    const w2 = baseWidth * 0.7;
    const d2 = baseDepth * 0.7;
    const h2 = totalHeight * 0.4;
    const mesh2 = new THREE.Mesh(
      new THREE.BoxGeometry(w2, h2, d2),
      createBuildingMaterial(w2, h2, color)
    );
    mesh2.position.y = h1 + h2 / 2;
    group.add(mesh2);

    addRoofDetails(group, w2, d2, totalHeight);

  } else if (style < 0.7) {
    // ツインタワー
    const h1 = totalHeight;
    const w1 = baseWidth * 0.45;
    const d1 = baseDepth;

    const mesh1 = new THREE.Mesh(
      new THREE.BoxGeometry(w1, h1, d1),
      createBuildingMaterial(w1, h1, color)
    );
    mesh1.position.set(-baseWidth / 4, h1 / 2, 0);
    group.add(mesh1);
    addRoofDetails(group, w1, d1, h1, -baseWidth / 4);

    const mesh2 = new THREE.Mesh(
      new THREE.BoxGeometry(w1, h1 * 0.9, d1),
      createBuildingMaterial(w1, h1 * 0.9, color)
    );
    mesh2.position.set(baseWidth / 4, (h1 * 0.9) / 2, 0);
    group.add(mesh2);
    addRoofDetails(group, w1, d1, h1 * 0.9, baseWidth / 4);

    const hCenter = h1 * 0.3;
    const meshCenter = new THREE.Mesh(
      new THREE.BoxGeometry(baseWidth * 0.2, hCenter, d1 * 0.8),
      createBuildingMaterial(baseWidth * 0.2, hCenter, color)
    );
    meshCenter.position.set(0, hCenter / 2, 0);
    group.add(meshCenter);

  } else {
    // シンプルタワー
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(baseWidth, totalHeight, baseDepth),
      createBuildingMaterial(baseWidth, totalHeight, color)
    );
    mesh.position.y = totalHeight / 2;
    group.add(mesh);
    addRoofDetails(group, baseWidth, baseDepth, totalHeight);
  }

  return group;
}

/**
 * 屋上のディテールを追加（ACユニット、給水塔、アンテナなど）
 * カメラが高いので、屋上が見える
 */
function addRoofDetails(group: THREE.Group, width: number, depth: number, floorHeight: number, xOffset: number = 0) {
  const detailCount = Math.floor(randomRange(2, 5));
  const roofColor = 0x555555;
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.9, metalness: 0.1 });

  for (let i = 0; i < detailCount; i++) {
    const type = Math.random();

    if (type < 0.5) {
      // ACユニットっぽい箱
      const w = randomRange(2, 5);
      const h = randomRange(2, 4);
      const d = randomRange(2, 5);
      const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), roofMat);

      const px = randomRange(-width / 2 + w, width / 2 - w) + xOffset;
      const pz = randomRange(-depth / 2 + d, depth / 2 - d);
      box.position.set(px, floorHeight + h / 2, pz);
      group.add(box);
    } else {
      // アンテナ/ポール
      const h = randomRange(5, 20);
      const r = randomRange(0.2, 0.5);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8), roofMat);

      const px = randomRange(-width / 2 + 2, width / 2 - 2) + xOffset;
      const pz = randomRange(-depth / 2 + 2, depth / 2 - 2);
      pole.position.set(px, floorHeight + h / 2, pz);
      group.add(pole);

      // 航空障害灯（赤く点滅しないが、赤い球をつけておく）
      const lightGeo = new THREE.SphereGeometry(1, 8, 8);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const light = new THREE.Mesh(lightGeo, lightMat);
      light.position.set(px, floorHeight + h, pz);
      group.add(light);
    }
  }
}

/**
 * 1チャンク分の街並みを生成
 */
export function createCityChunk(chunkIndex: number, isMobile: boolean): THREE.Group {
  const group = new THREE.Group();

  const buildingCount = isMobile ? 25 : 50;
  const zStart = -chunkIndex * CHUNK_SIZE;
  const zEnd = zStart - CHUNK_SIZE;

  for (let i = 0; i < buildingCount; i++) {
    let x = randomRange(-BUILDING_RANGE_X, BUILDING_RANGE_X);
    if (Math.abs(x) < ROAD_WIDTH) {
      x = x > 0 ? x + ROAD_WIDTH : x - ROAD_WIDTH;
    }

    const width = randomRange(30, 80);
    const depth = randomRange(30, 80);
    let height = randomRange(80, 400);
    if (Math.random() < 0.1) height += 200;

    const z = randomRange(zEnd, zStart);

    const building = createSkyscraper(x, z, width, height, depth);
    group.add(building);
  }

  // 地面（道路）: 少し濡れたアスファルト（夕日を反射）
  const floorGeo = new THREE.PlaneGeometry(BUILDING_RANGE_X * 2, CHUNK_SIZE);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a20,
    roughness: 0.4, // 反射強め
    metalness: 0.3
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, zStart - CHUNK_SIZE / 2);
  group.add(floor);

  // センターライン
  const roadLineGeo = new THREE.BoxGeometry(2, 0.1, CHUNK_SIZE);
  const roadLineMat = new THREE.MeshBasicMaterial({ color: 0x666666 });
  const roadLine = new THREE.Mesh(roadLineGeo, roadLineMat);
  roadLine.position.set(0, 0.1, zStart - CHUNK_SIZE / 2);
  group.add(roadLine);

  return group;
}
