import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export interface BranchItem {
  id: number;
  name: string;
}

export interface MemberItem {
  id?: number;
  full_name: string;
  alias_name?: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  generation: number;
  branch?: number | null;
  branch_name?: string | null;
  birth_order?: number | null;
  is_alive: boolean;
  birth_date_solar?: string | null;
  biography?: string | null;
}

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMember: MemberItem | null;
  branches: BranchItem[];
}

const buildInitialForm = (editingMember: MemberItem | null): MemberItem => {
  if (editingMember) {
    return {
      id: editingMember.id,
      full_name: editingMember.full_name || '',
      alias_name: editingMember.alias_name || '',
      gender: editingMember.gender || 'MALE',
      generation: editingMember.generation || 1,
      branch: editingMember.branch ?? null,
      birth_order: editingMember.birth_order ?? 1,
      is_alive: editingMember.is_alive ?? true,
      birth_date_solar: editingMember.birth_date_solar || '',
      biography: editingMember.biography || '',
    };
  }
  return {
    full_name: '',
    alias_name: '',
    gender: 'MALE',
    generation: 1,
    branch: null,
    birth_order: 1,
    is_alive: true,
    birth_date_solar: '',
    biography: '',
  };
};

export default function MemberModal({
  isOpen,
  onClose,
  editingMember,
  branches,
}: MemberModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<MemberItem>(() => buildInitialForm(editingMember));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: MemberItem) => {
      const cleanPayload = {
        full_name: payload.full_name.trim(),
        alias_name: payload.alias_name?.trim() || null,
        gender: payload.gender,
        generation: payload.generation,
        branch: payload.branch || null,
        birth_order: payload.birth_order || null,
        is_alive: payload.is_alive,
        birth_date_solar: payload.birth_date_solar || null,
        biography: payload.biography?.trim() || null,
      };

      if (editingMember?.id) {
        const res = await axiosClient.patch(`/members/${editingMember.id}/`, cleanPayload);
        return res.data;
      }
      const res = await axiosClient.post('/members/', cleanPayload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onClose();
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setErrorMsg(
        apiErr?.response?.data?.detail ||
          'Không thể lưu hồ sơ. Vui lòng kiểm tra quyền (Admin/Editor) và dữ liệu nhập.'
      );
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      setErrorMsg('Vui lòng nhập Họ và tên thành viên.');
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border-2 border-gold bg-parchment shadow-xl overflow-hidden">
        <div className="flex items-center justify-between bg-crimson px-5 py-3.5 text-parchment border-b-2 border-gold">
          <h3 className="font-serif text-lg font-bold">
            {editingMember ? 'Cập Nhật Hồ Sơ Thành Viên' : 'Thêm Thành Viên Mới'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-white/10 transition-colors"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-white">
          {errorMsg && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-wood mb-1">
                Họ và Tên *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="VD: Nguyễn Văn A"
                className="w-full rounded-lg border border-stone-300 bg-parchment px-3 py-2 text-sm focus:border-crimson focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-wood mb-1">
                Tên tự / Tên hiệu / Tên thụy
              </label>
              <input
                type="text"
                value={formData.alias_name || ''}
                onChange={(e) => setFormData({ ...formData, alias_name: e.target.value })}
                placeholder="Tùy chọn"
                className="w-full rounded-lg border border-stone-300 bg-parchment px-3 py-2 text-sm focus:border-crimson focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-wood mb-1">Giới tính</label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER',
                  })
                }
                className="w-full rounded-lg border border-stone-300 bg-parchment px-3 py-2 text-sm focus:border-crimson focus:outline-none"
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-wood mb-1">Đời thứ *</label>
              <input
                type="number"
                min={1}
                required
                value={formData.generation}
                onChange={(e) =>
                  setFormData({ ...formData, generation: Number(e.target.value) || 1 })
                }
                className="w-full rounded-lg border border-stone-300 bg-parchment px-3 py-2 text-sm focus:border-crimson focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-wood mb-1">Chi / Phái</label>
              <select
                value={formData.branch ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    branch: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full rounded-lg border border-stone-300 bg-parchment px-3 py-2 text-sm focus:border-crimson focus:outline-none"
              >
                <option value="">-- Chưa chọn --</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-wood mb-1">
                Ngày sinh (Dương lịch)
              </label>
              <input
                type="date"
                value={formData.birth_date_solar || ''}
                onChange={(e) =>
                  setFormData({ ...formData, birth_date_solar: e.target.value })
                }
                className="w-full rounded-lg border border-stone-300 bg-parchment px-3 py-2 text-sm focus:border-crimson focus:outline-none"
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="inline-flex items-center space-x-2 text-sm font-medium text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_alive}
                  onChange={(e) => setFormData({ ...formData, is_alive: e.target.checked })}
                  className="h-4 w-4 rounded border-stone-300 text-crimson focus:ring-crimson"
                />
                <span>Đang còn sống</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-wood mb-1">
              Tiểu sử / Công đức
            </label>
            <textarea
              rows={3}
              value={formData.biography || ''}
              onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
              placeholder="Ghi chú tiểu sử, nghề nghiệp, đóng góp..."
              className="w-full rounded-lg border border-stone-300 bg-parchment px-3 py-2 text-sm focus:border-crimson focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-crimson px-4 py-2 text-sm font-medium text-white hover:bg-crimson/90 disabled:opacity-60"
            >
              {mutation.isPending ? 'Đang lưu...' : 'Lưu hồ sơ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}