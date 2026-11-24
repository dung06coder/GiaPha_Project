import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Plus, Filter, Pencil } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import MemberModal, { type BranchItem, type MemberItem } from '../components/MemberModal';

export default function MembersPage() {
  const [generationFilter, setGenerationFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberItem | null>(null);

  const { data: branches = [] } = useQuery<BranchItem[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axiosClient.get('/branches/');
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  const branchMap = new Map<number, string>(branches.map((b) => [b.id, b.name]));

  const {
    data: members = [],
    isLoading,
    isError,
  } = useQuery<MemberItem[]>({
    queryKey: ['members', generationFilter, branchFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (generationFilter) params.append('generation', generationFilter);
      if (branchFilter) params.append('branch', branchFilter);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await axiosClient.get(`/members/${queryString}`);
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  const handleOpenCreate = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: MemberItem) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gold/40">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-crimson/10 rounded-lg border border-gold/40">
            <Users className="w-6 h-6 text-crimson" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-wood">Sổ Đinh Dòng Họ</h2>
            <p className="text-sm text-stone-500 italic">
              Quản lý danh sách thành viên theo Đời và Chi/Phái
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Bộ lọc theo Đời */}
          <div className="relative flex-1 sm:w-44">
            <Filter className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={generationFilter}
              onChange={(e) => setGenerationFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-parchment border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-crimson outline-none"
            >
              <option value="">Tất cả các đời</option>
              <option value="1">Đời thứ 1 (Thủy tổ)</option>
              <option value="2">Đời thứ 2</option>
              <option value="3">Đời thứ 3</option>
              <option value="4">Đời thứ 4</option>
              <option value="5">Đời thứ 5</option>
            </select>
          </div>

          {/* Bộ lọc theo Chi */}
          <div className="flex-1 sm:w-44">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-3 py-2 bg-parchment border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-crimson outline-none"
            >
              <option value="">Tất cả các Chi</option>
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 bg-crimson hover:bg-crimson/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm mới</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-parchment border-b-2 border-gold/50 text-wood font-serif text-sm">
                <th className="p-4 font-bold">Họ và Tên</th>
                <th className="p-4 font-bold">Giới tính</th>
                <th className="p-4 font-bold">Đời thứ</th>
                <th className="p-4 font-bold">Chi / Phái</th>
                <th className="p-4 font-bold">Trạng thái</th>
                <th className="p-4 font-bold">Ngày sinh</th>
                <th className="p-4 font-bold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-stone-100">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-500">
                    Đang tải sổ đinh...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-red-600">
                    Không thể tải danh sách thành viên. Hãy kiểm tra Backend API.
                  </td>
                </tr>
              )}
              {!isLoading &&
                !isError &&
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 font-semibold text-stone-800">{member.full_name}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          member.gender === 'MALE'
                            ? 'bg-sky-100 text-sky-800'
                            : member.gender === 'FEMALE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {member.gender === 'MALE'
                          ? 'Nam'
                          : member.gender === 'FEMALE'
                            ? 'Nữ'
                            : 'Khác'}
                      </span>
                    </td>
                    <td className="p-4 text-stone-700 font-medium">Đời {member.generation}</td>
                    <td className="p-4 text-stone-600">
                      {member.branch ? branchMap.get(member.branch) || `Chi #${member.branch}` : '---'}
                    </td>
                    <td className="p-4">
                      {member.is_alive ? (
                        <span className="text-emerald-700 font-medium inline-flex items-center">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                          Còn sống
                        </span>
                      ) : (
                        <span className="text-stone-500 italic">Đã mất</span>
                      )}
                    </td>
                    <td className="p-4 text-stone-600">
                      {member.birth_date_solar || '---'}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(member)}
                        className="inline-flex items-center space-x-1 text-crimson hover:text-crimson/75 font-medium text-sm"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                    </td>
                  </tr>
                ))}
              {!isLoading && !isError && members.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-500 italic">
                    Không tìm thấy thành viên phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

     <MemberModal
        key={editingMember ? `edit-${editingMember.id}` : `create-${isModalOpen}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingMember={editingMember}
        branches={branches}
      />
    </div>
  );
}