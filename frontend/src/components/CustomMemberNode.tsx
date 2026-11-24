import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { User } from 'lucide-react';
import type { FamilyMemberNode } from '../utils/treeLayout';

function CustomMemberNode({ data, selected }: NodeProps<FamilyMemberNode>) {
  const isHighlighted = Boolean(data.isHighlighted);

  const statusText = data.is_alive
    ? 'Còn sống'
    : data.birth_year || data.death_year
      ? `${data.birth_year || '?'} - ${data.death_year || '?'}`
      : 'Đã mất';

  return (
    <div
      className={`w-[220px] min-h-[90px] rounded-xl px-3 py-2.5 shadow-md border-2 transition-all ${
        isHighlighted
          ? 'bg-amber-50 border-crimson ring-4 ring-gold shadow-lg scale-[1.03]'
          : selected
            ? 'bg-white border-crimson ring-2 ring-gold/70'
            : 'bg-white border-gold/80 hover:border-crimson'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-wood !border-white"
      />

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

        <div className="min-w-0 flex-1">
          {data.branch_name && (
            <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-amber-50 text-wood border-gold/50 truncate max-w-full mb-0.5">
              {data.branch_name}
            </span>
          )}

          <p className="font-serif font-bold text-sm text-stone-900 truncate leading-snug">
            {data.full_name}
          </p>

          <p className="text-[11px] text-stone-500 mt-0.5 truncate">{statusText}</p>
        </div>
      </div>

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