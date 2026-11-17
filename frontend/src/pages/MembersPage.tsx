import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Plus, Filter } from 'lucide-react';
import axiosClient from '../api/axiosClient';

// Định nghĩa kiểu dữ liệu (Interfaces)
interface Member {
  id: number;
  full_name: string;
  gender: string;
  generation: number;
  is_alive: boolean;
  birth_date_solar: string | null;
  branch_name?: string;
}

export default function MembersPage() {
  const [generationFilter, setGenerationFilter] = useState('');
  
  // Dùng React Query gọi API Lấy danh sách thành viên
  const { data: members, isLoading, isError } = useQuery({
    queryKey: ['members', generationFilter],
    queryFn: async () => {
      const url = generationFilter ? `/members/?generation=${generationFilter}` : '/members/';
      const response = await axiosClient.get(url);
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Header của trang */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-gold/40">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <div className="p-2 bg-crimson/10 rounded-lg">
            <Users className="w-6 h-6 text-crimson" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-wood">Sổ Đinh Dòng Họ</h2>
            <p className="text-sm text-stone-500 italic">Quản lý danh sách thành viên các đời</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Bộ lọc theo Đời */}
          <div className="relative flex-1 sm:w-40">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-stone-400" />
            </div>
            <select
              value={generationFilter}
              onChange={(e) => setGenerationFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-parchment border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-crimson outline-none"
            >
              <option value="">Tất cả các đời</option>
              <option value="1">Đời thứ 1 (Thủy tổ)</option>
              <option value="2">Đời thứ 2</option>
              <option value="3">Đời thứ 3</option>
              <option value="4">Đời thứ 4</option>
            </select>
          </div>

          <button className="flex items-center space-x-2 bg-crimson hover:bg-crimson/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm mới</span>
          </button>
        </div>
      </div>

      {/* Bảng Dữ Liệu */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-parchment border-b-2 border-gold/50 text-wood font-serif text-sm">
                <th className="p-4 font-bold">Họ và Tên</th>
                <th className="p-4 font-bold">Giới tính</th>
                <th className="p-4 font-bold">Đời thứ</th>
                <th className="p-4 font-bold">Trạng thái</th>
                <th className="p-4 font-bold">Ngày sinh</th>
                <th className="p-4 font-bold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-stone-100">
              {isLoading && (
                <tr><td colSpan={6} className="p-8 text-center text-stone-500">Đang tải sổ đinh...</td></tr>
              )}
              {isError && (
                <tr><td colSpan={6} className="p-8 text-center text-red-500">Lỗi kết nối Sổ đinh!</td></tr>
              )}
              {members?.map((member: Member) => (
                <tr key={member.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-4 font-semibold text-stone-800">{member.full_name}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${member.gender === 'MALE' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'}`}>
                      {member.gender === 'MALE' ? 'Nam' : 'Nữ'}
                    </span>
                  </td>
                  <td className="p-4 text-stone-600 font-medium">Đời {member.generation}</td>
                  <td className="p-4">
                     {member.is_alive ? (
                        <span className="text-emerald-600 font-medium flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>Còn sống</span>
                     ) : (
                        <span className="text-stone-500 italic">Đã mất</span>
                     )}
                  </td>
                  <td className="p-4 text-stone-600">
                     {member.birth_date_solar ? member.birth_date_solar : '---'}
                  </td>
                  <td className="p-4 text-center">
                    <button className="text-crimson hover:text-crimson/70 font-medium text-sm">Sửa</button>
                  </td>
                </tr>
              ))}
              {members?.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-stone-500 italic">Chưa có dữ liệu thành viên.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}