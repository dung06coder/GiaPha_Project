import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitFork, Search, RotateCcw } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import CustomMemberNode from '../components/CustomMemberNode';
import SpouseEdge from '../components/SpouseEdge';
import { getLayoutedElements, type FamilyMemberNode } from '../utils/treeLayout';
import {
  filterBloodlineTree,
  filterTreeByBranch,
  type ViewMode,
} from '../utils/treeFilters';

interface TreeApiResponse {
  nodes: FamilyMemberNode[];
  edges: Edge[];
}

interface BranchOption {
  id: number;
  name: string;
}

const nodeTypes = {
  customMemberNode: CustomMemberNode,
};

const edgeTypes = {
  spouseEdge: SpouseEdge,
};

const NODE_WIDTH = 220;
const NODE_HEIGHT = 96;

function FamilyTreeCanvas() {
  const { setCenter, fitView } = useReactFlow();

  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('ALL');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [centerMemberId, setCenterMemberId] = useState<string>('');

  const { data: branches = [] } = useQuery<BranchOption[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axiosClient.get('/branches/');
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  const { data, isLoading, isError } = useQuery<TreeApiResponse>({
    queryKey: ['family-tree'],
    queryFn: async () => {
      const res = await axiosClient.get('/tree/');
      return res.data;
    },
  });

  const branchNameMap = useMemo(
    () => new Map<number, string>(branches.map((b) => [b.id, b.name])),
    [branches]
  );

  // Chuẩn hóa node & edge cơ bản từ API /tree/
  const { baseNodes, baseEdges } = useMemo(() => {
    const rawNodes: FamilyMemberNode[] = (data?.nodes || []).map((node) => ({
      ...node,
      type: 'customMemberNode',
      data: {
        ...node.data,
        branch_name:
          node.data.branch_name ||
          (node.data.branch_id ? branchNameMap.get(node.data.branch_id) || null : null),
      },
    }));

    const rawEdges: Edge[] = (data?.edges || []).map((edge) => {
      const isSpouse =
        edge.type === 'spouseEdge' ||
        edge.id.startsWith('edge-h') ||
        Boolean(edge.style?.strokeDasharray);

      if (isSpouse) {
        return {
          ...edge,
          type: 'spouseEdge',
          sourceHandle: edge.sourceHandle || 'right',
          targetHandle: edge.targetHandle || 'left',
        };
      }

      return {
        ...edge,
        type: edge.type || 'smoothstep',
        sourceHandle: edge.sourceHandle || 'bottom',
        targetHandle: edge.targetHandle || 'top',
        style: {
          stroke: '#78716C',
          strokeWidth: 2,
          ...edge.style,
        },
      };
    });

    return { baseNodes: rawNodes, baseEdges: rawEdges };
  }, [data, branchNameMap]);

  // Danh sách gợi ý theo từ khóa tìm kiếm
  const searchSuggestions = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return [];
    return baseNodes
      .filter((n) => n.data.full_name.toLowerCase().includes(keyword))
      .slice(0, 6);
  }, [baseNodes, searchQuery]);

  // Áp dụng bộ lọc (Tất cả / Theo Chi / Cây cận huyết 3 đời trên - 3 đời dưới) + Dagre layout
  const { nodes, edges } = useMemo(() => {
    let filtered = { nodes: baseNodes, edges: baseEdges };

    if (viewMode === 'BRANCH' && selectedBranchId) {
      filtered = filterTreeByBranch(baseNodes, baseEdges, Number(selectedBranchId));
    } else if (viewMode === 'BLOODLINE') {
      const targetCenter = centerMemberId || baseNodes[0]?.id || null;
      filtered = filterBloodlineTree(baseNodes, baseEdges, targetCenter, 3, 3);
    }

    const layouted = getLayoutedElements(filtered.nodes, filtered.edges, 'TB');
    const activeCenter = viewMode === 'BLOODLINE' ? centerMemberId || baseNodes[0]?.id : null;

    const styledNodes = layouted.nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        isHighlighted: n.id === highlightedNodeId || n.id === activeCenter,
      },
    }));

    return { nodes: styledNodes, edges: layouted.edges };
  }, [
    baseNodes,
    baseEdges,
    viewMode,
    selectedBranchId,
    centerMemberId,
    highlightedNodeId,
  ]);

  const handleFocusNode = (targetNode: FamilyMemberNode) => {
    setHighlightedNodeId(targetNode.id);
    setSearchQuery(targetNode.data.full_name);

    const layoutNode = nodes.find((n) => n.id === targetNode.id) || targetNode;
    const centerX = layoutNode.position.x + NODE_WIDTH / 2;
    const centerY = layoutNode.position.y + NODE_HEIGHT / 2;

    setCenter(centerX, centerY, { zoom: 1.15, duration: 600 });
  };

  const handleResetFilters = () => {
    setViewMode('ALL');
    setSelectedBranchId('');
    setCenterMemberId('');
    setHighlightedNodeId(null);
    setSearchQuery('');
    setTimeout(() => {
      fitView({ duration: 400 });
    }, 50);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 bg-white p-4 rounded-xl shadow-sm border border-gold/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-crimson/10 rounded-lg border border-gold/40">
              <GitFork className="w-6 h-6 text-crimson" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-wood">Phả Đồ Dòng Họ</h2>
              <p className="text-xs text-stone-500">
                Nét liền nâu xám (#78716C): Cha/Mẹ - Con • Nét đứt đỏ hồng (#BE123C): Vợ - Chồng
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-medium text-wood hover:bg-parchment transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xem toàn bộ cây</span>
          </button>
        </div>

        {/* Thanh Tìm kiếm + Bộ lọc Chi / Cây cận huyết */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-stone-100">
          {/* Ô tìm kiếm & focus camera */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) setHighlightedNodeId(null);
              }}
              placeholder="Tìm tên thành viên & focus camera..."
              className="w-full pl-9 pr-3 py-2 bg-parchment border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-crimson outline-none"
            />
            {searchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gold rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {searchSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleFocusNode(item)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-parchment flex items-center justify-between border-b border-stone-100 last:border-b-0"
                  >
                    <span className="font-medium text-stone-800">{item.data.full_name}</span>
                    <span className="text-xs text-wood">Đời {item.data.generation}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chọn chế độ xem */}
          <div>
            <select
              value={viewMode}
              onChange={(e) => {
                const nextMode = e.target.value as ViewMode;
                setViewMode(nextMode);
                if (nextMode === 'BLOODLINE' && !centerMemberId && baseNodes[0]) {
                  setCenterMemberId(baseNodes[0].id);
                }
              }}
              className="w-full px-3 py-2 bg-parchment border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-crimson outline-none"
            >
              <option value="ALL">Chế độ: Toàn bộ dòng họ</option>
              <option value="BRANCH">Chế độ: Lọc theo Chi / Nhánh</option>
              <option value="BLOODLINE">Chế độ: Cây cận huyết (3 đời trên - 3 đời dưới)</option>
            </select>
          </div>

          {/* Điều kiện phụ theo chế độ xem */}
          <div>
            {viewMode === 'BRANCH' && (
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-3 py-2 bg-parchment border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-crimson outline-none"
              >
                <option value="">-- Chọn Chi / Nhánh --</option>
                {branches.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            {viewMode === 'BLOODLINE' && (
              <select
                value={centerMemberId || baseNodes[0]?.id || ''}
                onChange={(e) => setCenterMemberId(e.target.value)}
                className="w-full px-3 py-2 bg-parchment border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-crimson outline-none"
              >
                {baseNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    Trung tâm: {n.data.full_name} (Đời {n.data.generation})
                  </option>
                ))}
              </select>
            )}

            {viewMode === 'ALL' && (
              <div className="h-full flex items-center px-3 py-2 rounded-lg bg-parchment/60 border border-stone-200 text-xs text-stone-500">
                Đang hiển thị {nodes.length} thành viên • {edges.length} liên kết
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-[620px] w-full rounded-xl border-2 border-gold/50 bg-parchment shadow-sm overflow-hidden">
        {isLoading && (
          <div className="h-full flex items-center justify-center text-wood text-sm">
            Đang dựng sơ đồ cây gia phả...
          </div>
        )}
        {isError && (
          <div className="h-full flex items-center justify-center text-red-600 text-sm">
            Không thể tải dữ liệu cây từ API /api/v1/tree/.
          </div>
        )}
        {!isLoading && !isError && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
          >
            <Background gap={20} color="#E7E0D3" />
            <Controls />
            <MiniMap />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}

export default function FamilyTreePage() {
  return (
    <ReactFlowProvider>
      <FamilyTreeCanvas />
    </ReactFlowProvider>
  );
}