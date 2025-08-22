import * as THREE from "three";

// ジオメトリ生成ユーティリティ
export class OctagonalGeometryUtils {
  static createOctagonalVertices(l1: number, l2: number, scale: number, height: number): {
    topVertices: THREE.Vector3[],
    bottomVertices: THREE.Vector3[],
    squareSide: number
  } {
    const longSide = l1 * scale;
    const shortSide = l2 * scale;
    const squareSide = longSide + shortSide * Math.sqrt(2);
    const halfSquare = squareSide / 2;
    const offset = shortSide / Math.sqrt(2);

    const topVertices = [
      new THREE.Vector3(-halfSquare + offset, height / 2, -halfSquare),
      new THREE.Vector3(halfSquare - offset, height / 2, -halfSquare),
      new THREE.Vector3(halfSquare, height / 2, -halfSquare + offset),
      new THREE.Vector3(halfSquare, height / 2, halfSquare - offset),
      new THREE.Vector3(halfSquare - offset, height / 2, halfSquare),
      new THREE.Vector3(-halfSquare + offset, height / 2, halfSquare),
      new THREE.Vector3(-halfSquare, height / 2, halfSquare - offset),
      new THREE.Vector3(-halfSquare, height / 2, -halfSquare + offset)
    ];

    const bottomVertices = topVertices.map(v =>
      new THREE.Vector3(v.x, -height / 2, v.z)
    );

    return { topVertices, bottomVertices, squareSide };
  }

  static createOctagonalTopGeometry(
    vertices: THREE.Vector3[],
    squareSide: number,
    height: number
  ): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];

    const center = new THREE.Vector3(0, height / 2, 0);
    const halfSquare = squareSide / 2;

    // 中心頂点
    positions.push(center.x, center.y, center.z);
    uvs.push(0.5, 0.5);

    // 八角形の頂点
    for (let i = 0; i < 8; i++) {
      positions.push(vertices[i].x, vertices[i].y, vertices[i].z);
      const u = (vertices[i].x + halfSquare) / squareSide;
      const v = 1 - (vertices[i].z + halfSquare) / squareSide;
      uvs.push(u, v);
    }

    // 三角形インデックス
    for (let i = 0; i < 8; i++) {
      indices.push(0, i + 1, ((i + 1) % 8) + 1);
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();

    return geometry;
  }

  static createOctagonalSideGeometry(
    topVertices: THREE.Vector3[],
    bottomVertices: THREE.Vector3[],
    l1: number,
    l2: number,
    scale: number
  ): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];

    const longSide = l1 * scale;
    let vertexIndex = 0;
    let uOffset = 0;

    for (let i = 0; i < 8; i++) {
      const nextI = (i + 1) % 8;
      const topVertex1 = topVertices[i];
      const topVertex2 = topVertices[nextI];
      const bottomVertex1 = bottomVertices[i];
      const bottomVertex2 = bottomVertices[nextI];

      const edgeLength = topVertex1.distanceTo(topVertex2);
      const isLongSide = Math.abs(edgeLength - longSide) < 0.001;
      const repeatCount = isLongSide ? l1 : l2;

      // 頂点追加
      positions.push(
        topVertex1.x, topVertex1.y, topVertex1.z,
        topVertex2.x, topVertex2.y, topVertex2.z,
        bottomVertex2.x, bottomVertex2.y, bottomVertex2.z,
        bottomVertex1.x, bottomVertex1.y, bottomVertex1.z
      );

      // UV座標
      uvs.push(
        uOffset, 1,
        uOffset + repeatCount, 1,
        uOffset + repeatCount, 0,
        uOffset, 0
      );

      // インデックス
      indices.push(
        vertexIndex, vertexIndex + 1, vertexIndex + 2,
        vertexIndex, vertexIndex + 2, vertexIndex + 3
      );

      vertexIndex += 4;
      uOffset += repeatCount;
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();

    return geometry;
  }

  // 中空八角形ジオメトリ作成（上面）
  static createHollowOctagonalTopGeometry(
    outerVertices: THREE.Vector3[],
    squareSide: number,
    height: number,
    holeSize: number
  ): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const halfSquare = squareSide / 2;
    const halfHole = holeSize / 2;

    // 外側の八角形頂点を追加
    outerVertices.forEach((vertex) => {
      positions.push(vertex.x, vertex.y, vertex.z);
      // UV座標を正規化（-1から1の範囲を0から1にマッピング）
      uvs.push((vertex.x + halfSquare) / squareSide, (vertex.z + halfSquare) / squareSide);
    });

    // 内側の正方形頂点を追加
    const innerVertices = [
      new THREE.Vector3(-halfHole, height / 2, -halfHole), // 0
      new THREE.Vector3(halfHole, height / 2, -halfHole),  // 1
      new THREE.Vector3(halfHole, height / 2, halfHole),   // 2
      new THREE.Vector3(-halfHole, height / 2, halfHole)   // 3
    ];

    innerVertices.forEach((vertex) => {
      positions.push(vertex.x, vertex.y, vertex.z);
      uvs.push((vertex.x + halfSquare) / squareSide, (vertex.z + halfSquare) / squareSide);
    });

    // 中空八角形を作るため、外側から内側へ向かって帯状に分割
    // 各八角形の辺から最も近い内側正方形の頂点/辺を特定して三角形を作成
    
    // 八角形頂点: 0=上左, 1=上右, 2=右上, 3=右下, 4=下右, 5=下左, 6=左下, 7=左上
    // 正方形頂点: 8=左上(-,-), 9=右上(+,-), 10=右下(+,+), 11=左下(-,+)
    
    const triangles = [
      // 上辺エリア (八角形頂点0,1 → 正方形上辺8,9)
      [0, 1, 9], [0, 9, 8],
      
      // 右上エリア (八角形頂点1,2 → 正方形右上頂点9)  
      [1, 2, 9],
      
      // 右辺エリア (八角形頂点2,3 → 正方形右辺9,10)
      [2, 3, 10], [2, 10, 9],
      
      // 右下エリア (八角形頂点3,4 → 正方形右下頂点10)
      [3, 4, 10],
      
      // 下辺エリア (八角形頂点4,5 → 正方形下辺10,11)
      [4, 5, 11], [4, 11, 10],
      
      // 左下エリア (八角形頂点5,6 → 正方形左下頂点11)
      [5, 6, 11],
      
      // 左辺エリア (八角形頂点6,7 → 正方形左辺11,8)
      [6, 7, 8], [6, 8, 11],
      
      // 左上エリア (八角形頂点7,0 → 正方形左上頂点8)
      [7, 0, 8]
    ];

    triangles.forEach(triangle => {
      indices.push(...triangle);
    });

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();

    return geometry;
  }

  // 中空八角形ジオメトリ作成（側面）
  static createHollowOctagonalSideGeometry(
    topVertices: THREE.Vector3[],
    bottomVertices: THREE.Vector3[],
    l1: number,
    l2: number,
    scale: number,
    holeSize: number,
    height: number
  ): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const longSide = l1 * scale;
    const halfHole = holeSize / 2;
    let vertexIndex = 0;
    let uOffset = 0;

    // 外側八角形の側面
    for (let i = 0; i < 8; i++) {
      const nextI = (i + 1) % 8;
      const topVertex1 = topVertices[i];
      const topVertex2 = topVertices[nextI];
      const bottomVertex1 = bottomVertices[i];
      const bottomVertex2 = bottomVertices[nextI];

      const edgeLength = topVertex1.distanceTo(topVertex2);
      const isLongSide = Math.abs(edgeLength - longSide) < 0.001;
      const repeatCount = isLongSide ? l1 : l2;

      // 外側面の頂点追加
      positions.push(topVertex1.x, topVertex1.y, topVertex1.z);
      positions.push(topVertex2.x, topVertex2.y, topVertex2.z);
      positions.push(bottomVertex1.x, bottomVertex1.y, bottomVertex1.z);
      positions.push(bottomVertex2.x, bottomVertex2.y, bottomVertex2.z);

      // UV座標
      uvs.push(uOffset, 1);
      uvs.push(uOffset + repeatCount, 1);
      uvs.push(uOffset, 0);
      uvs.push(uOffset + repeatCount, 0);

      // インデックス
      indices.push(vertexIndex, vertexIndex + 2, vertexIndex + 1);
      indices.push(vertexIndex + 1, vertexIndex + 2, vertexIndex + 3);

      vertexIndex += 4;
      uOffset += repeatCount;
    }

    // 内側正方形の側面（穴の壁面）
    const innerTop = [
      new THREE.Vector3(-halfHole, height / 2, -halfHole),
      new THREE.Vector3(halfHole, height / 2, -halfHole),
      new THREE.Vector3(halfHole, height / 2, halfHole),
      new THREE.Vector3(-halfHole, height / 2, halfHole)
    ];

    const innerBottom = innerTop.map(v => 
      new THREE.Vector3(v.x, -height / 2, v.z)
    );

    for (let i = 0; i < 4; i++) {
      const nextI = (i + 1) % 4;
      
      // 内側面の頂点（法線が内向き）
      positions.push(innerTop[nextI].x, innerTop[nextI].y, innerTop[nextI].z);
      positions.push(innerTop[i].x, innerTop[i].y, innerTop[i].z);
      positions.push(innerBottom[nextI].x, innerBottom[nextI].y, innerBottom[nextI].z);
      positions.push(innerBottom[i].x, innerBottom[i].y, innerBottom[i].z);

      // UV座標
      uvs.push(0, 1);
      uvs.push(1, 1);
      uvs.push(0, 0);
      uvs.push(1, 0);

      // インデックス
      indices.push(vertexIndex, vertexIndex + 2, vertexIndex + 1);
      indices.push(vertexIndex + 1, vertexIndex + 2, vertexIndex + 3);

      vertexIndex += 4;
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();

    return geometry;
  }
}
