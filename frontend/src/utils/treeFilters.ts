import type { Edge } from '@xyflow/react';
import type { FamilyMemberNode } from './treeLayout';

export type ViewMode = 'ALL' | 'BRANCH' | 'BLOODLINE';

export function filterTreeByBranch(
  nodes: FamilyMemberNode[],
  edges: Edge[],
  branchId: number | null
): { nodes: FamilyMemberNode[]; edges: Edge[] } {
  if (!branchId) {
    return { nodes, edges };
  }

  const filteredNodes = nodes.filter((node) => node.data.branch_id === branchId);
  const allowedIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = edges.filter(
    (edge) => allowedIds.has(edge.source) && allowedIds.has(edge.target)
  );

  return { nodes: filteredNodes, edges: filteredEdges };
}

/**
 * Lọc Cây cận huyết: tối đa 3 đời trên (tổ tiên) và 3 đời dưới (hậu duệ)
 * tính từ node trung tâm `centerNodeId`.
 */
export function filterBloodlineTree(
  nodes: FamilyMemberNode[],
  edges: Edge[],
  centerNodeId: string | null,
  maxGenerationsUp = 3,
  maxGenerationsDown = 3
): { nodes: FamilyMemberNode[]; edges: Edge[] } {
  if (!centerNodeId) {
    return { nodes, edges };
  }

  const nodeMap = new Map<string, FamilyMemberNode>(nodes.map((n) => [n.id, n]));
  const centerNode = nodeMap.get(centerNodeId);
  if (!centerNode) {
    return { nodes, edges };
  }

  const bloodlineEdges = edges.filter((e) => e.type !== 'spouseEdge');
  const includedIds = new Set<string>([centerNodeId]);

  // Duyệt lên tối đa `maxGenerationsUp` đời (từ con -> cha/mẹ)
  let currentUpIds = new Set<string>([centerNodeId]);
  for (let step = 0; step < maxGenerationsUp; step++) {
    const nextUpIds = new Set<string>();
    bloodlineEdges.forEach((edge) => {
      if (currentUpIds.has(edge.target) && !includedIds.has(edge.source)) {
        const parentNode = nodeMap.get(edge.source);
        if (
          parentNode &&
          centerNode.data.generation - parentNode.data.generation <= maxGenerationsUp
        ) {
          includedIds.add(edge.source);
          nextUpIds.add(edge.source);
        }
      }
    });
    if (nextUpIds.size === 0) break;
    currentUpIds = nextUpIds;
  }

  // Duyệt xuống tối đa `maxGenerationsDown` đời (từ cha/mẹ -> con)
  let currentDownIds = new Set<string>([centerNodeId]);
  for (let step = 0; step < maxGenerationsDown; step++) {
    const nextDownIds = new Set<string>();
    bloodlineEdges.forEach((edge) => {
      if (currentDownIds.has(edge.source) && !includedIds.has(edge.target)) {
        const childNode = nodeMap.get(edge.target);
        if (
          childNode &&
          childNode.data.generation - centerNode.data.generation <= maxGenerationsDown
        ) {
          includedIds.add(edge.target);
          nextDownIds.add(edge.target);
        }
      }
    });
    if (nextDownIds.size === 0) break;
    currentDownIds = nextDownIds;
  }

  const filteredNodes = nodes.filter((n) => includedIds.has(n.id));
  const filteredEdges = edges.filter(
    (e) => includedIds.has(e.source) && includedIds.has(e.target)
  );

  return { nodes: filteredNodes, edges: filteredEdges };
}