import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { User } from 'lucide-react';
import type { FamilyMemberNode } from '../utils/treeLayout';

function CustomMemberNode({ data, selected }: NodeProps<FamilyMemberNode>) {
  const isMale = data.gender === 'MALE';
  const isFemale = data.gender === 'FEMALE';

  const badgeClass = isMale
    ? 'bg-sky-100 text-sky-900 border-sky-300'
    : isFemale
      ? 'bg-rose-100 text-rose-900 border-rose-300'
      : 'bg-stone-100 text-stone-700 border-stone-300';

  const statusText = data.is_alive
    ? 'Còn sống'
    : data.birth_year || data.death_year
      ? `${data.birth_year || '?'} - ${data.death_year || '?'}`
      : 'Đã mất';

  return (
    <div
      className={`w-[220px] min-h-[90px] rounded-xl bg-white px-3 py-2.5 shadow-md border-2 transition-all ${
        selected
          ? 'border-crimson ring-2 ring-gold/70'
          : 'border-gold/80 hover:border-crimson'
      }`}
    >
      {/* Điểm nối từ trên xuống (Cha/Mẹ -> Con) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-wood !border-white"
      />

      {/* Điểm nối ngang cho Vợ - Chồng */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-rose-700 !border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-rose-700 !border-white"
      />

      <div className="flex items-center gap-3">
        {/* Ảnh đại diện tròn 48x48px */}
        <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden border-2 border-gold bg-parchment flex items-center justify-center text-wood">
          {data.avatar_url ? (
            <img
              src={data.avatar_url}
              alt={data.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-6 h-6 text-crimson/80" />
          )}
        </div>

        {/* Thông tin bên phải */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span
              className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border ${badgeClass}`}
            >
              Đời thứ {data.generation}
            </span>
            {data.branch_name && (
              <span className="text-[10px] text-wood/80 truncate max-w-[85px]">
                • {data.branch_name}
              </span>
            )}
          </div>

          <p className="font-serif font-bold text-sm text-stone-900 truncate leading-snug">
            {data.full_name}
          </p>

          <p className="text-[11px] text-stone-500 mt-0.5 truncate">{statusText}</p>
        </div>
      </div>

      {/* Điểm nối xuống đời dưới (Cha/Mẹ -> Con) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-wood !border-white"
      />
    </div>
  );
}

export default memo(CustomMemberNode);