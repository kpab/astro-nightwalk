/**
 * buildings.ts - プロシージャルビル生成（リアルなスカイライン版 - 真夜中）
 * 闇と光のコントラストで魅せる：シルエット重視
 */

import * as THREE from 'three';

// ビルのカラーパレット（ほぼ黒、わずかに素材ごとの違い）
const BUILDING_COLORS = [
  0x050505, // 漆黒
  0x0a0a0a, // ダークグレー
  0x080810, // 青みがかった黒
  0x100808, // 赤みがかった黒
  0x020202, // 限界まで黒
];

// 窓設定（高コントラスト：完全に光るか、完全に消えるか）
const WINDOW_COLORS = [
  '#ffeedd', // 暖かい白（オフィス明かり）
  '#ffffff', // 強烈な白
  '#ccddff', // クールな白
  '#000000', // 消灯
  '#000000', // 消灯（多めに設定して密度を下げる）
  '#000000',
  '#000000',
];

// チャンク設定
export const CHUNK_SIZE = 1000;
export const BUILDING_RANGE_X = 500;
export const ROAD_WIDTH = 40;

/**
 * ランダムな値を範囲内で生成
 */
function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 高精細な窓テクスチャをCanvasで生成
 * 闇に浮かぶ光のグリッドを作成
 */
function createWindowTexture(
  width: number,
  height: number,
  baseColorStr: string // ビルのベース色
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const resolution = 256;
  canvas.width = resolution;
  canvas.height = Math.round((height / width) * resolution);

  // ベース（壁面）：完全な闇に近い色
  ctx.fillStyle = '#020202';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 窓パターン
  const style = Math.random();
  let winW, winH, gapX, gapY;

  if (style < 0.4) {
    // 標準オフィス
    winW = 4; winH = 8; gapX = 4; gapY = 6;
  } else if (style < 0.7) {
    // スリット
    winW = 2; winH = 20; gapX = 6; gapY = 4;
  } else {
    // グリッド
    winW = 8; winH = 8; gapX = 4; gapY = 4;
  }

  const cols = Math.floor(canvas.width / (winW + gapX));
  const rows = Math.floor(canvas.height / (winH + gapY));

  // 夜なのでグラデーション反射はほぼ無し。自己発光のみで勝負。

  for (let row = 0; row < rows; row++) {
    // フロアごとに点灯パターンを変える（オフィスビルらしさ）
    const floorActive = Math.random() < 0.4; // 40%のフロアが活動中

    for (let col = 0; col < cols; col++) {
      const x = col * (winW + gapX) + gapX;
      const y = row * (winH + gapY) + gapY;

      let color = '#000000';
      if (floorActive) {
        // そのフロア内でもランダムに消灯
        if (Math.random() < 0.7) {
          color = randomWindowColor();
        }
      } else {
        // 活動していないフロアでも稀に点いている（掃除のおじさん等）
        if (Math.random() < 0.05) {
          color = randomWindowColor();
        }
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, y, winW, winH);
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

function randomWindowColor(): string {
  const c = WINDOW_COLORS[Math.floor(Math.random() * 3)]; // 黒以外を選ぶ
  return c || '#ffffff';
}

/**
 * ビル用マテリアルを作成
 */
function createBuildingMaterial(
  width: number,
  height: number,
  baseColor: number
): THREE.MeshStandardMaterial {
  const colorStr = '#' + baseColor.toString(16).padStart(6, '0');

  const windowTexture = createWindowTexture(width, height, colorStr);
  const emissiveTexture = windowTexture.clone();

  return new THREE.MeshStandardMaterial({
    color: 0x000000, // ベースカラーは黒
    map: windowTexture, // マップで窓だけ色が出る
    emissive: 0xffffff,
    emissiveMap: emissiveTexture,
    emissiveIntensity: 2.0, // 光を強くして、闇の中に浮かび上がらせる
    roughness: 0.9, // 粗くして、変な反射を消す（シルエット重視）
    metalness: 0.1, // 金属感も落として黒く沈める
  });
}

/**
 * 複雑な形状のビルを生成
 * 単なるBoxではなく、複数のジオメトリをマージ、あるいはグループ化して複雑さを出す
 */
function createComplexAvailableBuilding(
  x: number,
  z: number,
  width: number,
  height: number,
  depth: number
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const color = BUILDING_COLORS[Math.floor(Math.random() * BUILDING_COLORS.length)];
  const mat = createBuildingMaterial(width, height, color);

  const type = Math.random();

  if (type < 0.4) {
    // L字型 / 組み合わせ型
    // メイン
    const mainGeo = new THREE.BoxGeometry(width, height, depth * 0.6);
    const mainMesh = new THREE.Mesh(mainGeo, mat);
    mainMesh.position.set(0, height / 2, -depth * 0.2);
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    group.add(mainMesh);

    // サブ（低層部）
    const subH = height * randomRange(0.3, 0.7);
    const subGeo = new THREE.BoxGeometry(width * 0.6, subH, depth * 0.4);
    // マテリアル再生成は高負荷なので使い回すが、UVが合うかは微妙。
    // 本当はUV調整が必要だが、今回は簡易的に同じマテリアル
    const subMesh = new THREE.Mesh(subGeo, mat);
    subMesh.position.set(width * 0.2, subH / 2, depth * 0.3);
    subMesh.castShadow = true;
    subMesh.receiveShadow = true;
    group.add(subMesh);

    addRoofDetails(group, width, depth * 0.6, height, 0, -depth * 0.2);
    addRoofDetails(group, width * 0.6, depth * 0.4, subH, width * 0.2, depth * 0.3);

  } else if (type < 0.7) {
    // テーパー（上に行くほど細い）はBoxGeometryでは無理なので、
    // 3段積み重ねセットバック
    const h1 = height * 0.4;
    const h2 = height * 0.35;
    const h3 = height * 0.25;

    // 下段
    const m1 = new THREE.Mesh(new THREE.BoxGeometry(width, h1, depth), mat);
    m1.position.y = h1 / 2;
    m1.castShadow = true;
    m1.receiveShadow = true;
    group.add(m1);

    // 中段
    const w2 = width * 0.8;
    const d2 = depth * 0.8;
    const m2 = new THREE.Mesh(new THREE.BoxGeometry(w2, h2, d2), mat);
    m2.position.y = h1 + h2 / 2;
    m2.castShadow = true;
    m2.receiveShadow = true;
    group.add(m2);

    // 上段
    const w3 = width * 0.6;
    const d3 = depth * 0.6;
    const m3 = new THREE.Mesh(new THREE.BoxGeometry(w3, h3, d3), mat);
    m3.position.y = h1 + h2 + h3 / 2;
    m3.castShadow = true;
    m3.receiveShadow = true;
    group.add(m3);

    addRoofDetails(group, w3, d3, height);
  } else {
    // スタンダード + 縦ルーバー（フィン）表現
    // 実際にはテクスチャでやるのが軽量だが、ジオメトリで薄い板を置く
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // フィンを追加（数個）
    if (Math.random() < 0.5) {
      const finCount = 4;
      const finMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
      const finW = width / finCount;
      for (let i = 0; i < finCount; i++) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(1, height, depth + 2), finMat);
        fin.position.set(-width / 2 + finW * i + finW / 2, height / 2, 0);
        group.add(fin);
      }
    }

    addRoofDetails(group, width, depth, height);
  }

  return group;
}


/**
 * 屋上ディテール
 */
function addRoofDetails(group: THREE.Group, w: number, d: number, h: number, xOff: number = 0, zOff: number = 0) {
  const count = Math.floor(randomRange(1, 4));
  const mat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });

  for (let i = 0; i < count; i++) {
    const size = randomRange(2, 6);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mat);
    mesh.position.set(
      xOff + randomRange(-w / 2 + size, w / 2 - size),
      h + size / 2,
      zOff + randomRange(-d / 2 + size, d / 2 - size)
    );
    group.add(mesh);
  }

  // 航空障害灯
  if (h > 150) {
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    light.position.set(xOff, h + 2, zOff);
    group.add(light);
  }
}

/**
 * 1チャンク生成
 */
export function createCityChunk(chunkIndex: number, isMobile: boolean): THREE.Group {
  const group = new THREE.Group();

  const buildingCount = isMobile ? 30 : 60; // 密度アップ
  const zStart = -chunkIndex * CHUNK_SIZE;
  const zEnd = zStart - CHUNK_SIZE;

  // 地面（道路 + 基盤）
  // 隙間が見えないように、少し長く作ってオーバーラップさせる
  const overlap = 5;
  const floorGeo = new THREE.PlaneGeometry(BUILDING_RANGE_X * 2.5, CHUNK_SIZE + overlap);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x101015,
    roughness: 0.6,
    metalness: 0.4
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  // 位置はずらさず、サイズでカバーするか、つなぎ目を考慮
  // zStart - CHUNK_SIZE/2 の中心位置に対して、長さが CHUNK_SIZE + overlap
  floor.position.set(0, -0.1, zStart - CHUNK_SIZE / 2); // 少し下げて、ちらつき防止したかったが逆か？
  // Y=0だとビル底面と干渉するが、ビルはY=0から生える。地面はY=0以下が良いが、カメラが見下ろすと隙間？
  // Y=0に置く。
  floor.position.y = -0.2;
  group.add(floor);

  // 道路装飾
  const roadW = ROAD_WIDTH;
  const roadGeo = new THREE.PlaneGeometry(roadW, CHUNK_SIZE + overlap);
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.2 });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -0.15, zStart - CHUNK_SIZE / 2);
  group.add(road);

  for (let i = 0; i < buildingCount; i++) {
    // 配置ロジック：完全ランダムではなく、ある程度「街区」を意識したいが、
    // コスト高いのでランダムかつコリジョン（重なり）緩和は今回はなし。
    // ただし、道路幅は守る。

    let x = randomRange(-BUILDING_RANGE_X, BUILDING_RANGE_X);
    // 道路回避
    if (Math.abs(x) < ROAD_WIDTH + 10) {
      if (x > 0) x += ROAD_WIDTH;
      else x -= ROAD_WIDTH;
    }

    const width = randomRange(40, 90);
    const depth = randomRange(40, 90);
    // 大きさがリアルじゃない -> 全体的にもっと高く、デカく
    let height = randomRange(100, 500);
    if (Math.random() < 0.05) height = randomRange(600, 800); // ランドマーク級

    const z = randomRange(zEnd, zStart);

    const building = createComplexAvailableBuilding(x, z, width, height, depth);
    group.add(building);
  }

  return group;
}
