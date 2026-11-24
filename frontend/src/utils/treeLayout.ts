import dagre from 'dagre';
import {Position, type Edge,type  Node } from '@xyflow/react';

export interface MemberNodeData extends Record<string, unknown> {
  full_name: string;
  alias_name?: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  generation: number;
  is_alive: boolean;
  branch_id?: number | null;
  branch_name?: string | null;
  birth_year?: string | number | null;
  death_year?: string | number | null;
  avatar_url?: string | null;
}

export type FamilyMemberNode = Node<MemberNodeData, 'customMemberNode'>;

// Kích thước node khớp quy chuẩn DESIGN.md (width: 220px, min-height ~ 90px)
const NODE_WIDTH = 220;
const NODE_HEIGHT = 96;

export function getLayoutedElements(
  nodes: FamilyMemberNode[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: FamilyMemberNode[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction, // 'TB': từ trên xuống (Top to Bottom)
    nodesep: 36,        // Khoảng cách ngang giữa các thẻ cùng đời
    ranksep: 110,        // Khoảng cách dọc giữa các đời
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Chỉ đưa cạnh huyết thống/phân cấp vào Dagre để giữ thứ tự tầng đời chuẩn;
  // cạnh vợ chồng (spouseEdge) giữ ngang hàng ở cùng tầng đời
  edges.forEach((edge) => {
    if (edge.type !== 'spouseEdge') {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  const layoutedNodes: FamilyMemberNode[] = nodes.map((node) => {
  const nodeWithPosition = dagreGraph.node(node.id);
  return {
    ...node,
    targetPosition: direction === 'TB' ? Position.Top : Position.Left,
    sourcePosition: direction === 'TB' ? Position.Bottom : Position.Right,
    position: {
      x: nodeWithPosition.x - NODE_WIDTH / 2,
      y: nodeWithPosition.y - NODE_HEIGHT / 2,
    },
  };
});

  return { nodes: layoutedNodes, edges };
}