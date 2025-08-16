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
}
