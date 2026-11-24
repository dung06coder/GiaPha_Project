import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  User,
  Calendar,
  MapPin,
  ScrollText,
  Heart,
  Baby,
  UserPlus,
  Pencil,
} from 'lucide-react';
import type { Edge } from '@xyflow/react';
import axiosClient from '../api/axiosClient';
import type { FamilyMemberNode } from '../utils/treeLayout';

interface MemberDetailData {
  id: number;
  full_name: string;
  alias_name?: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  generation: number;
  branch?: number | null;
  branch_name?: string | null;
  father?: number | null;
  father_name?: string | null;
  mother?: number | null;
  mother_name?: string | null;
  birth_order?: number | null;
  is_adopted?: boolean;
  birth_date_solar?: string | null;
  is_alive: boolean;
  death_date_lunar_day?: number | null;
  death_date_lunar_month?: number | null;
  death_date_solar?: string | null;
  avatar_url?: string | null;
  burial_info?: string | null;
  biography?: string | null;
}

interface MemberDetailDrawerProps {
  memberId: string | null;
  onClose: () => void;
  onSelectMember: (nextMemberId: string) => void;
  allNodes: FamilyMemberNode[];
  allEdges: Edge[];
  onEditFullMember?: (member: MemberDetailData) => void;
}

type QuickActionMode = 'NONE' | 'ADD_CHILD' | 'ADD_SPOUSE';

export default function MemberDetailDrawer({
  memberId,
  onClose,
  onSelectMember,
  allNodes,
  allEdges,
  onEditFullMember,
}: MemberDetailDrawerProps) {
  const queryClient = useQueryClient();
  const [quickMode, setQuickMode] = useState<QuickActionMode>('NONE');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [birthOrder, setBirthOrder] = useState<number>(1);
  const [marriageOrder, setMarriageOrder] = useState<number>(1);
  const [otherParentId, setOtherParentId] = useState<string>('');
  const [isAlive, setIsAlive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: member,
    isLoading,
    isError,
  } = useQuery<MemberDetailData>({
    queryKey: ['member-detail', memberId],
    enabled: Boolean(memberId),
    queryFn: async () => {
      const res = await axiosClient.get(`/members/${memberId}/`);
      return res.data;
    },
  });

  // Suy ra danh sách Vợ/Chồng và Con cái trực tiếp từ dữ liệu đồ thị hiện có
  const nodeMap = new Map<string, FamilyMemberNode>(allNodes.map((n) => [n.id, n]));

  const spouses: FamilyMemberNode[] = [];
  const children: FamilyMemberNode[] = [];

  if (memberId) {
    allEdges.forEach((edge) => {
      if (edge.type === 'spouseEdge') {
        if (edge.source === memberId && nodeMap.has(edge.target)) {
          spouses.push(nodeMap.get(edge.target)!);
        } else if (edge.target === memberId && nodeMap.has(edge.source)) {
          spouses.push(nodeMap.get(edge.source)!);
        }
      } else if (edge.source === memberId && nodeMap.has(edge.target)) {
        children.push(nodeMap.get(edge.target)!);
      }
    });
  }

  const resetQuickForm = () => {
    setQuickMode('NONE');
    setFullName('');
    setFormError(null);
  };

  const openAddChildForm = () => {
    setQuickMode('ADD_CHILD');
    setFullName('');
    setGender('MALE');
    setBirthOrder(children.length + 1);
    setOtherParentId(spouses.length === 1 ? spouses[0].id : '');
    setIsAlive(true);
    setFormError(null);
  };

  const openAddSpouseForm = () => {
    setQuickMode('ADD_SPOUSE');
    setFullName('');
    setGender(member?.gender === 'MALE' ? 'FEMALE' : 'MALE');
    setMarriageOrder(spouses.length + 1);
    setIsAlive(true);
    setFormError(null);
  };

  // Mutation Thêm nhanh Con
  const addChildMutation = useMutation({
    mutationFn: async () => {
      if (!member) return;
      const isFather = member.gender === 'MALE';
      const fatherId = isFather ? member.id : otherParentId ? Number(otherParentId) : null;
      const motherId = !isFather ? member.id : otherParentId ? Number(otherParentId) : null;

      const payload = {
        full_name: fullName.trim(),
        gender,
        generation: member.generation + 1,
        branch: member.branch ?? null,
        father: fatherId,
        mother: motherId,
        birth_order: birthOrder || 1,
        is_alive: isAlive,
      };

      const res = await axiosClient.post('/members/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-tree'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member-detail', memberId] });
      resetQuickForm();
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setFormError(
        apiErr?.response?.data?.detail ||
          'Không thể thêm con. Kiểm tra quyền Admin/Editor hoặc dữ liệu nhập.'
      );
    },
  });

  // Mutation Thêm nhanh Vợ / Chồng (tạo Member + tạo Marriage)
  const addSpouseMutation = useMutation({
    mutationFn: async () => {
      if (!member) return;

      // 1. Tạo bản ghi Member cho người phối ngẫu ở cùng đời
      const memberRes = await axiosClient.post('/members/', {
        full_name: fullName.trim(),
        gender,
        generation: member.generation,
        branch: member.branch ?? null,
        is_alive: isAlive,
      });
      const createdSpouseId = memberRes.data.id;

      // 2. Tạo liên kết trong bảng marriages
      const husbandId = member.gender === 'MALE' ? member.id : createdSpouseId;
      const wifeId = member.gender === 'MALE' ? createdSpouseId : member.id;

      await axiosClient.post('/marriages/', {
        husband: husbandId,
        wife: wifeId,
        marriage_order: marriageOrder || 1,
        status: 'MARRIED',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-tree'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member-detail', memberId] });
      resetQuickForm();
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setFormError(
        apiErr?.response?.data?.detail ||
          'Không thể thêm vợ/chồng. Kiểm tra quyền Admin/Editor hoặc quan hệ hôn nhân đã tồn tại.'
      );
    },
  });

  if (!memberId) return null;

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Vui lòng nhập Họ và tên.');
      return;
    }
    if (quickMode === 'ADD_CHILD') {
      addChildMutation.mutate();
    } else if (quickMode === 'ADD_SPOUSE') {
      addSpouseMutation.mutate();
    }
  };

  const isSubmitting = addChildMutation.isPending || addSpouseMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
      {/* Vùng bấm bên ngoài để đóng Drawer */}
      <div className="flex-1" onClick={onClose} />

      {/* Ngăn kéo trượt từ bên phải */}
      <aside className="w-full max-w-md bg-parchment border-l-4 border-gold shadow-2xl h-full flex flex-col overflow-hidden">
        {/* Header Drawer */}
        <div className="bg-crimson text-parchment px-5 py-4 flex items-center justify-between border-b-2 border-gold">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gold font-semibold">
              Hồ Sơ Phả Hệ
            </p>
            <h3 className="font-serif text-lg font-bold truncate">
              {member?.full_name || 'Đang tải thông tin...'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Đóng ngăn kéo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung cuộn */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading && (
            <div className="py-12 text-center text-sm text-wood">
              Đang tải chi tiết hồ sơ thành viên...
            </div>
          )}

          {isError && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
              Không thể tải thông tin chi tiết thành viên này.
            </div>
          )}

          {member && (
            <>
              {/* Thẻ tóm tắt đầu hồ sơ */}
              <div className="bg-white rounded-xl p-4 border border-gold/60 shadow-sm flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-gold bg-parchment flex items-center justify-center overflow-hidden shrink-0">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-crimson" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-crimson/10 text-crimson border border-crimson/20">
                      Đời thứ {member.generation}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-700">
                      {member.gender === 'MALE'
                        ? 'Nam'
                        : member.gender === 'FEMALE'
                          ? 'Nữ'
                          : 'Khác'}
                    </span>
                    {member.branch_name && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-wood border border-gold/40">
                        {member.branch_name}
                      </span>
                    )}
                  </div>

                  <h4 className="font-serif text-lg font-bold text-stone-900">
                    {member.full_name}
                  </h4>
                  {member.alias_name && (
                    <p className="text-xs text-wood italic">
                      Tên tự / hiệu / thụy: {member.alias_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Nút thao tác nhanh: Thêm Con / Thêm Vợ-Chồng / Sửa */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={openAddChildForm}
                  className="flex items-center justify-center gap-1.5 bg-crimson hover:bg-crimson/90 text-white px-3 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  <Baby className="w-4 h-4" />
                  <span>+ Thêm nhanh Con</span>
                </button>

                <button
                  type="button"
                  onClick={openAddSpouseForm}
                  className="flex items-center justify-center gap-1.5 bg-wood hover:bg-wood/90 text-parchment px-3 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  <Heart className="w-4 h-4 text-gold" />
                  <span>
                    {member.gender === 'MALE' ? '+ Thêm Vợ' : '+ Thêm Chồng'}
                  </span>
                </button>
              </div>

              {onEditFullMember && (
                <button
                  type="button"
                  onClick={() => onEditFullMember(member)}
                  className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-amber-50 text-wood border border-gold px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa hồ sơ đầy đủ</span>
                </button>
              )}

              {/* Form Thêm nhanh Con / Vợ / Chồng */}
              {quickMode !== 'NONE' && (
                <form
                  onSubmit={handleQuickSubmit}
                  className="bg-white rounded-xl p-4 border-2 border-crimson/70 shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <h5 className="font-serif font-bold text-sm text-crimson flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4" />
                      <span>
                        {quickMode === 'ADD_CHILD'
                          ? `Thêm Con cho ${member.full_name} (Đời ${member.generation + 1})`
                          : `Thêm ${member.gender === 'MALE' ? 'Vợ' : 'Chồng'} cho ${member.full_name}`}
                      </span>
                    </h5>
                    <button
                      type="button"
                      onClick={resetQuickForm}
                      className="text-xs text-stone-400 hover:text-stone-700"
                    >
                      Đóng
                    </button>
                  </div>

                  {formError && (
                    <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-wood mb-1">
                      Họ và Tên *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên..."
                      className="w-full rounded-lg border border-stone-300 bg-parchment px-3 py-2 text-sm focus:border-crimson focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-wood mb-1">
                        Giới tính
                      </label>
                      <select
                        value={gender}
                        onChange={(e) =>
                          setGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')
                        }
                        className="w-full rounded-lg border border-stone-300 bg-parchment px-3 py-2 text-sm focus:border-crimson focus:outline-none"
                      >
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </div>

                    {quickMode === 'ADD_CHILD' ? (
                      <div>
                        <label className="block text-xs font-semibold text-wood mb-1">
                          Con thứ mấy
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={birthOrder}
                          onChange={(e) => setBirthOrder(Number(e.target.value) || 1)}
                          className="w-full rounded-lg border border-stone-300 bg-parchment px-3 py-2 text-sm focus:border-crimson focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-wood mb-1">
                          Thứ tự hôn nhân
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={marriageOrder}
                          onChange={(e) => setMarriageOrder(Number(e.target.value) || 1)}
                          className="w-full rounded-lg border border-stone-300 bg-parchment px-3 py-2 text-sm focus:border-crimson focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {quickMode === 'ADD_CHILD' && spouses.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-wood mb-1">
                        {member.gender === 'MALE' ? 'Mẹ của bé' : 'Cha của bé'}
                      </label>
                      <select
                        value={otherParentId}
                        onChange={(e) => setOtherParentId(e.target.value)}
                        className="w-full rounded-lg border border-stone-300 bg-parchment px-3 py-2 text-sm focus:border-crimson focus:outline-none"
                      >
                        <option value="">-- Chưa xác định --</option>
                        {spouses.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.data.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <label className="inline-flex items-center space-x-2 text-xs font-medium text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAlive}
                      onChange={(e) => setIsAlive(e.target.checked)}
                      className="h-4 w-4 rounded border-stone-300 text-crimson focus:ring-crimson"
                    />
                    <span>Đang còn sống</span>
                  </label>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={resetQuickForm}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-medium text-stone-600 hover:bg-stone-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-1.5 rounded-lg bg-crimson text-white text-xs font-semibold hover:bg-crimson/90 disabled:opacity-60"
                    >
                      {isSubmitting ? 'Đang lưu...' : 'Lưu vào phả đồ'}
                    </button>
                  </div>
                </form>
              )}

              {/* Thông tin Sinh - Tử & Mộ phần */}
              <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-3 text-sm">
                <h5 className="font-serif font-bold text-wood border-b border-stone-100 pb-2">
                  Thông Tin Sinh Tử & Mộ Phần
                </h5>

                <div className="flex items-start gap-2.5 text-stone-700">
                  <Calendar className="w-4 h-4 text-crimson shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <p>
                      <span className="font-semibold">Trạng thái:</span>{' '}
                      {member.is_alive ? (
                        <span className="text-emerald-700 font-medium">Còn sống</span>
                      ) : (
                        <span className="text-stone-600">Đã mất</span>
                      )}
                    </p>
                    <p>
                      <span className="font-semibold">Ngày sinh (DL):</span>{' '}
                      {member.birth_date_solar || 'Chưa cập nhật'}
                    </p>
                    {!member.is_alive && (
                      <p>
                        <span className="font-semibold">Ngày giỗ (ÂL):</span>{' '}
                        {member.death_date_lunar_day && member.death_date_lunar_month
                          ? `${member.death_date_lunar_day}/${member.death_date_lunar_month} Âm lịch`
                          : 'Chưa cập nhật'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-stone-700">
                  <MapPin className="w-4 h-4 text-crimson shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-semibold">Nơi an táng / Mộ phần:</span>{' '}
                    <span>{member.burial_info || 'Chưa có thông tin'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-stone-700">
                  <ScrollText className="w-4 h-4 text-crimson shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <span className="font-semibold">Tiểu sử / Công đức:</span>
                    <p className="mt-1 text-stone-600 whitespace-pre-line">
                      {member.biography || 'Chưa có ghi chép tiểu sử.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quan hệ Gia đình (Cha Mẹ, Vợ Chồng, Con Cái) */}
              <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-3 text-xs">
                <h5 className="font-serif font-bold text-sm text-wood border-b border-stone-100 pb-2">
                  Quan Hệ Gia Đình
                </h5>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-parchment border border-stone-200">
                    <p className="text-stone-500">Cha:</p>
                    {member.father ? (
                      <button
                        type="button"
                        onClick={() => {
                          resetQuickForm();
                          onSelectMember(String(member.father));
                        }}
                        className="font-semibold text-crimson hover:underline text-left mt-0.5"
                      >
                        {member.father_name || `ID #${member.father}`}
                      </button>
                    ) : (
                      <p className="font-medium text-stone-700 mt-0.5">---</p>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-parchment border border-stone-200">
                    <p className="text-stone-500">Mẹ:</p>
                    {member.mother ? (
                      <button
                        type="button"
                        onClick={() => {
                          resetQuickForm();
                          onSelectMember(String(member.mother));
                        }}
                        className="font-semibold text-crimson hover:underline text-left mt-0.5"
                      >
                        {member.mother_name || `ID #${member.mother}`}
                      </button>
                    ) : (
                      <p className="font-medium text-stone-700 mt-0.5">---</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-wood mb-1.5">
                    Vợ / Chồng ({spouses.length}):
                  </p>
                  {spouses.length === 0 ? (
                    <p className="text-stone-400 italic">Chưa ghi nhận hôn nhân.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {spouses.map((sp) => (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => {
                            resetQuickForm();
                            onSelectMember(sp.id);
                          }}
                          className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100 font-medium"
                        >
                          {sp.data.full_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-semibold text-wood mb-1.5">
                    Con cái ({children.length}):
                  </p>
                  {children.length === 0 ? (
                    <p className="text-stone-400 italic">Chưa có dữ liệu con cái.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {children.map((ch) => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => {
                            resetQuickForm();
                            onSelectMember(ch.id);
                          }}
                          className="px-2.5 py-1 rounded-full bg-parchment text-wood border border-gold/60 hover:bg-amber-100 font-medium"
                        >
                          {ch.data.full_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}