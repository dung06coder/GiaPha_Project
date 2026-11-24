import dagre from 'dagre';
import { Position, type Edge, type Node } from '@xyflow/react';

export interface MemberNodeData extends Record<string, unknown> {
  full_name: string;
  alias_name?: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  generation: number;
  is_alive: boolean;
  branch_id?: number | null;
  branch_name?: string | null;
  birth_order?: number | null;
  marriage_order?: number | null;
  birth_year?: string | number | null;
  death_year?: string | number | null;
  avatar_url?: string | null;
  isHighlighted?: boolean;
}

export type FamilyMemberNode = Node<MemberNodeData, 'customMemberNode'>;

const NODE_WIDTH = 220;
const NODE_HEIGHT = 96;
const HORIZONTAL_GAP = 64;
const GENERATION_ROW_GAP = 185;
const STEP_X = NODE_WIDTH + HORIZONTAL_GAP;

export function getLayoutedElements(
  nodes: FamilyMemberNode[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: FamilyMemberNode[]; edges: Edge[] } {
  if (nodes.length === 0) {
    return { nodes: [], edges };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: HORIZONTAL_GAP,
    ranksep: 120,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    if (edge.type !== 'spouseEdge') {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  const nodeById = new Map<string, FamilyMemberNode>(nodes.map((n) => [n.id, n]));

  // Gom danh sách vợ cho từng chồng (theo marriage_order)
  const wivesByHusband = new Map<string, FamilyMemberNode[]>();
  const allWivesSet = new Set<string>();

  edges.forEach((edge) => {
    if (edge.type === 'spouseEdge') {
      const wifeNode = nodeById.get(edge.target);
      if (wifeNode) {
        const list = wivesByHusband.get(edge.source) || [];
        if (!list.some((w) => w.id === wifeNode.id)) {
          list.push(wifeNode);
        }
        wivesByHusband.set(edge.source, list);
        allWivesSet.add(wifeNode.id);
      }
    }
  });

  // Gom danh sách con theo từng người cha/mẹ
  const childrenByParent = new Map<string, FamilyMemberNode[]>();
  edges.forEach((edge) => {
    if (edge.type !== 'spouseEdge') {
      const childNode = nodeById.get(edge.target);
      if (childNode) {
        const list = childrenByParent.get(edge.source) || [];
        if (!list.some((c) => c.id === childNode.id)) {
          list.push(childNode);
        }
        childrenByParent.set(edge.source, list);
      }
    }
  });

  // Nhóm thành viên theo từng đời (generation)
  const nodesByGen = new Map<number, FamilyMemberNode[]>();
  nodes.forEach((node) => {
    const gen = Math.max(1, Number(node.data.generation) || 1);
    const arr = nodesByGen.get(gen) || [];
    arr.push(node);
    nodesByGen.set(gen, arr);
  });

  const sortedGens = Array.from(nodesByGen.keys()).sort((a, b) => a - b);
  const positionedMap = new Map<string, { x: number; y: number }>();

  sortedGens.forEach((gen) => {
    const genNodes = nodesByGen.get(gen) || [];
    const sortedByDagreX = [...genNodes].sort((a, b) => {
      const ax = dagreGraph.node(a.id)?.x ?? 0;
      const bx = dagreGraph.node(b.id)?.x ?? 0;
      if (ax !== bx) return ax - bx;
      return Number(a.data.birth_order ?? 99) - Number(b.data.birth_order ?? 99);
    });

    // Xây dựng các cụm (couple group hoặc đơn) trong đời
    const groups: { ids: string[]; anchorParentIds: string[] }[] = [];
    const placedInRow = new Set<string>();

    sortedByDagreX.forEach((node) => {
      if (placedInRow.has(node.id)) return;

      const rawWives = (wivesByHusband.get(node.id) || []).filter(
        (w) => !placedInRow.has(w.id)
      );

      if (rawWives.length > 0) {
        const orderedWives = [...rawWives].sort((a, b) => {
          const orderA = Number(a.data.marriage_order ?? 1);
          const orderB = Number(b.data.marriage_order ?? 1);
          if (orderA !== orderB) return orderA - orderB;
          return Number(a.id) - Number(b.id);
        });

        const leftWives = orderedWives.filter((_, idx) => idx % 2 === 0);
        const rightWives = orderedWives.filter((_, idx) => idx % 2 === 1);

        const groupIds: string[] = [];
        leftWives.forEach((w) => {
          groupIds.push(w.id);
          placedInRow.add(w.id);
        });
        groupIds.push(node.id);
        placedInRow.add(node.id);
        rightWives.forEach((w) => {
          groupIds.push(w.id);
          placedInRow.add(w.id);
        });

        groups.push({
          ids: groupIds,
          anchorParentIds: [node.id, ...orderedWives.map((w) => w.id)],
        });
      } else if (!allWivesSet.has(node.id)) {
        groups.push({
          ids: [node.id],
          anchorParentIds: [node.id],
        });
        placedInRow.add(node.id);
      }
    });

    sortedByDagreX.forEach((node) => {
      if (!placedInRow.has(node.id)) {
        groups.push({
          ids: [node.id],
          anchorParentIds: [node.id],
        });
        placedInRow.add(node.id);
      }
    });

    const rowY = (gen - 1) * GENERATION_ROW_GAP;

    if (gen === sortedGens[0]) {
      // Hàng đầu tiên: xếp liên tiếp từ trái sang phải
      let cursorX = 0;
      groups.forEach((grp) => {
        grp.ids.forEach((id) => {
          positionedMap.set(id, { x: cursorX, y: rowY });
          cursorX += STEP_X;
        });
      });
      return;
    }

    // Các đời sau: căn đối xứng tâm từng nhóm con theo tâm của cha/mẹ ở đời trên
    const placedIds = new Set<string>();
    const desiredPositions: { id: string; x: number }[] = [];

    groups.forEach((grp) => {
      const childGroupIds = grp.ids.filter((id) => !placedIds.has(id));
      if (childGroupIds.length === 0) return;

      // Tìm các cha/mẹ đã có tọa độ ở đời trên
      const parentCenters: number[] = [];
      childGroupIds.forEach((childId) => {
        nodes.forEach((n) => {
          const kids = childrenByParent.get(n.id) || [];
          if (kids.some((k) => k.id === childId) && positionedMap.has(n.id)) {
            parentCenters.push(positionedMap.get(n.id)!.x + NODE_WIDTH / 2);
          }
        });
      });

      const groupWidth =
        childGroupIds.length * NODE_WIDTH +
        (childGroupIds.length - 1) * HORIZONTAL_GAP;

      let startX: number;
      if (parentCenters.length > 0) {
        const avgCenterX =
          parentCenters.reduce((acc, v) => acc + v, 0) / parentCenters.length;
        startX = avgCenterX - groupWidth / 2;
      } else {
        const prevMaxX =
          desiredPositions.length > 0
            ? Math.max(...desiredPositions.map((p) => p.x)) + STEP_X
            : 0;
        startX = prevMaxX;
      }

      childGroupIds.forEach((id, idx) => {
        desiredPositions.push({ id, x: startX + idx * STEP_X });
        placedIds.add(id);
      });
    });

    // Sắp xếp theo x mong muốn và đẩy giãn nếu bị chạm/đè nhau giữa các cụm
    desiredPositions.sort((a, b) => a.x - b.x);
    for (let i = 1; i < desiredPositions.length; i++) {
      if (desiredPositions[i].x < desiredPositions[i - 1].x + STEP_X) {
        desiredPositions[i].x = desiredPositions[i - 1].x + STEP_X;
      }
    }

    desiredPositions.forEach((item) => {
      positionedMap.set(item.id, { x: item.x, y: rowY });
    });
  });

  const layoutedNodes: FamilyMemberNode[] = nodes.map((node) => {
    const pos = positionedMap.get(node.id) || { x: 0, y: 0 };
    return {
      ...node,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      position: pos,
    };
  });

  return { nodes: layoutedNodes, edges };
}