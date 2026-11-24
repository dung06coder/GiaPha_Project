import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ReactFlow, Background, Controls, MiniMap, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitFork } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import CustomMemberNode from '../components/CustomMemberNode';
import SpouseEdge from '../components/SpouseEdge';
import { getLayoutedElements, type FamilyMemberNode } from '../utils/treeLayout';

interface TreeApiResponse {
  nodes: FamilyMemberNode[];
  edges: Edge[];
}

const nodeTypes = {
  customMemberNode: CustomMemberNode,
};

const edgeTypes = {
  spouseEdge: SpouseEdge,
};

export default function FamilyTreePage() {
  const { data, isLoading, isError } = useQuery<TreeApiResponse>({
    queryKey: ['family-tree'],
    queryFn: async () => {
      const res = await axiosClient.get('/tree/');
      return res.data;
    },
  });

  const { nodes, edges } = useMemo(() => {
    const rawNodes = data?.nodes || [];
    const rawEdges = (data?.edges || []).map((edge) => {
      // Nếu cạnh nối vợ-chồng (từ backend tạo dạng edge-h...-w... hoặc strokeDasharray)
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

    return getLayoutedElements(rawNodes, rawEdges, 'TB');
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border border-gold/40">
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