import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Flame, ScrollText, Plus, Clock } from 'lucide-react';
import axiosClient from '../api/axiosClient';

interface AnniversaryItem {
  member_id: number;
  full_name: string;
  lunar_death_date: string;
  solar_anniversary_date: string;
  days_left: number;
  generation: number;
}

interface UpcomingAnniversariesResponse {
  message: string;
  data: AnniversaryItem[];
}

interface ClanEventItem {
  id: number;
  title: string;
  event_type: 'DEATH_ANNIVERSARY' | 'CLAN_MEETING' | 'SCHOLARSHIP' | 'LONGEVITY' | 'OTHER';
  lunar_day?: number | null;
  lunar_month?: number | null;
  solar_date?: string | null;
  description?: string | null;
}

const EVENT_TYPE_LABELS: Record<ClanEventItem['event_type'], string> = {
  DEATH_ANNIVERSARY: 'Giỗ tổ / Giỗ chạp',
  CLAN_MEETING: 'Họp họ thường niên',
  SCHOLARSHIP: 'Khuyến học',
  LONGEVITY: 'Mừng thọ',
  OTHER: 'Sự kiện khác',
};

export default function EventsHistoryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'EVENTS' | 'HISTORY'>('EVENTS');
  const [showAddForm, setShowAddForm] = useState(false);

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<ClanEventItem['event_type']>('CLAN_MEETING');
  const [solarDate, setSolarDate] = useState('');
  const [lunarDay, setLunarDay] = useState('');
  const [lunarMonth, setLunarMonth] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: anniversariesData,
    isLoading: isLoadingAnniv,
    isError: isErrorAnniv,
  } = useQuery<UpcomingAnniversariesResponse>({
    queryKey: ['upcoming-anniversaries'],
    queryFn: async () => {
      const res = await axiosClient.get('/events/upcoming-anniversaries/');
      return res.data;
    },
  });

  const {
    data: events = [],
    isLoading: isLoadingEvents,
  } = useQuery<ClanEventItem[]>({
    queryKey: ['clan-events'],
    queryFn: async () => {
      const res = await axiosClient.get('/events/');
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosClient.post('/events/', {
        title: title.trim(),
        event_type: eventType,
        solar_date: solarDate || null,
        lunar_day: lunarDay ? Number(lunarDay) : null,
        lunar_month: lunarMonth ? Number(lunarMonth) : null,
        description: description.trim() || null,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clan-events'] });
      setTitle('');
      setSolarDate('');
      setLunarDay('');
      setLunarMonth('');
      setDescription('');
      setFormError(null);
      setShowAddForm(false);
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setFormError(
        apiErr?.response?.data?.detail ||
          'Không thể thêm sự kiện. Vui lòng kiểm tra quyền (Admin/Editor).'
      );
    },
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Vui lòng nhập tiêu đề sự kiện.');
      return;
    }
    createEventMutation.mutate();
  };

  const anniversaries = anniversariesData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header + chuyển Tab */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gold/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-crimson/10 rounded-lg border border-gold/40">
            <Calendar className="w-6 h-6 text-crimson" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-wood">
              Lịch Cúng Giỗ &amp; Phả Ký Dòng Họ
            </h2>
            <p className="text-xs text-stone-500 italic">
              Tự động quy đổi ngày giỗ Âm lịch sang Dương lịch và lưu giữ truyền thống gia tộc
            </p>
          </div>
        </div>

        <div className="flex rounded-lg bg-parchment p-1 border border-gold/50">
          <button
            type="button"
            onClick={() => setActiveTab('EVENTS')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'EVENTS'
                ? 'bg-crimson text-white shadow-sm'
                : 'text-wood hover:bg-white/60'
            }`}
          >
            Lịch Cúng Giỗ &amp; Sự Kiện
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'HISTORY'
                ? 'bg-crimson text-white shadow-sm'
                : 'text-wood hover:bg-white/60'
            }`}
          >
            Phả Ký &amp; Tộc Ước
          </button>
        </div>
      </div>

      {/* TAB 1: LỊCH CÚNG GIỖ & SỰ KIỆN */}
      {activeTab === 'EVENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cột trái: Các ngày giỗ sắp tới */}
          <div className="bg-white rounded-xl border border-gold/50 shadow-sm overflow-hidden">
            <div className="bg-parchment px-5 py-3.5 border-b border-gold/40 flex items-center gap-2">
              <Flame className="w-5 h-5 text-crimson" />
              <h3 className="font-serif font-bold text-wood text-base">
                Các Ngày Giỗ Sắp Tới (Quy đổi Âm - Dương)
              </h3>
            </div>

            <div className="p-4 space-y-3">
              {isLoadingAnniv && (
                <p className="text-center text-sm text-stone-500 py-6">
                  Đang tính toán lịch giỗ Âm - Dương...
                </p>
              )}
              {isErrorAnniv && (
                <p className="text-center text-sm text-red-600 py-6">
                  Không thể tải danh sách lịch giỗ từ API.
                </p>
              )}
              {!isLoadingAnniv && !isErrorAnniv && anniversaries.length === 0 && (
                <p className="text-center text-sm text-stone-500 italic py-6">
                  Chưa có dữ liệu ngày mất Âm lịch của các cụ đã khuất.
                </p>
              )}
              {anniversaries.map((item) => (
                <div
                  key={item.member_id}
                  className="p-3.5 rounded-lg bg-parchment/70 border border-gold/40 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-serif font-bold text-stone-900">
                      {item.full_name}{' '}
                      <span className="text-xs font-sans font-normal text-wood">
                        (Đời thứ {item.generation})
                      </span>
                    </p>
                    <p className="text-xs text-stone-600 mt-1">
                      Ngày giỗ Âm lịch:{' '}
                      <span className="font-semibold text-crimson">{item.lunar_death_date}</span>{' '}
                      • Dương lịch:{' '}
                      <span className="font-semibold">{item.solar_anniversary_date}</span>
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.days_left <= 15
                          ? 'bg-crimson text-white'
                          : 'bg-amber-100 text-wood border border-gold/50'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {item.days_left === 0 ? 'Hôm nay' : `Còn ${item.days_left} ngày`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: Bảng tin Sự kiện Dòng họ */}
          <div className="bg-white rounded-xl border border-gold/50 shadow-sm overflow-hidden">
            <div className="bg-parchment px-5 py-3.5 border-b border-gold/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-crimson" />
                <h3 className="font-serif font-bold text-wood text-base">
                  Sự Kiện Dòng Họ
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowAddForm((prev) => !prev)}
                className="inline-flex items-center gap-1 bg-crimson hover:bg-crimson/90 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm sự kiện</span>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {showAddForm && (
                <form
                  onSubmit={handleCreateEvent}
                  className="p-4 rounded-xl bg-parchment border border-crimson/40 space-y-3"
                >
                  {formError && (
                    <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-wood mb-1">
                      Tiêu đề sự kiện *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="VD: Họp họ thường niên đầu xuân"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm outline-none focus:border-crimson"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-wood mb-1">
                        Loại sự kiện
                      </label>
                      <select
                        value={eventType}
                        onChange={(e) =>
                          setEventType(e.target.value as ClanEventItem['event_type'])
                        }
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm outline-none focus:border-crimson"
                      >
                        {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-wood mb-1">
                        Ngày Dương lịch
                      </label>
                      <input
                        type="date"
                        value={solarDate}
                        onChange={(e) => setSolarDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm outline-none focus:border-crimson"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-wood mb-1">
                        Ngày Âm lịch (1-30)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={lunarDay}
                        onChange={(e) => setLunarDay(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm outline-none focus:border-crimson"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-wood mb-1">
                        Tháng Âm lịch (1-12)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={lunarMonth}
                        onChange={(e) => setLunarMonth(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm outline-none focus:border-crimson"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-wood mb-1">
                      Mô tả chi tiết
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm outline-none focus:border-crimson"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-600"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={createEventMutation.isPending}
                      className="px-4 py-1.5 rounded-lg bg-crimson text-white text-xs font-semibold disabled:opacity-60"
                    >
                      {createEventMutation.isPending ? 'Đang lưu...' : 'Lưu sự kiện'}
                    </button>
                  </div>
                </form>
              )}

              {isLoadingEvents && (
                <p className="text-center text-sm text-stone-500 py-6">Đang tải sự kiện...</p>
              )}

              {!isLoadingEvents && events.length === 0 && (
                <p className="text-center text-sm text-stone-500 italic py-6">
                  Chưa có sự kiện nào được ghi nhận.
                </p>
              )}

              <div className="space-y-3">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-lg border border-stone-200 hover:border-gold transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-serif font-bold text-stone-900 text-sm">
                        {ev.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-wood border border-gold/40">
                        {EVENT_TYPE_LABELS[ev.event_type] || ev.event_type}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">
                      {ev.lunar_day && ev.lunar_month
                        ? `Âm lịch: ${ev.lunar_day}/${ev.lunar_month}`
                        : ''}
                      {ev.lunar_day && ev.lunar_month && ev.solar_date ? ' • ' : ''}
                      {ev.solar_date ? `Dương lịch: ${ev.solar_date}` : ''}
                    </p>
                    {ev.description && (
                      <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                        {ev.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHẢ KÝ & TỘC ƯỚC */}
      {activeTab === 'HISTORY' && (
        <article className="bg-white rounded-xl border-2 border-gold shadow-md p-6 md:p-10 max-w-4xl mx-auto space-y-6">
          <div className="text-center border-b-2 border-gold/40 pb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-crimson/10 border border-gold mb-3">
              <ScrollText className="w-6 h-6 text-crimson" />
            </div>
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-crimson">
              Phả Ký &amp; Tộc Ước Dòng Họ
            </h3>
            <p className="text-sm text-wood italic mt-2">
              &ldquo;Cây có cội mới trổ cành xanh lá — Nước có nguồn mới bể rộng sông sâu&rdquo;
            </p>
          </div>

          <section className="space-y-2">
            <h4 className="font-serif text-lg font-bold text-wood">
              I. Lược Sử Khởi Nguồn Dòng Họ
            </h4>
            <p className="text-sm text-stone-700 leading-7">
              Dòng họ được khai lập từ đời Thủy tổ, trải qua nhiều thế hệ gìn giữ nề nếp gia phong,
              đề cao chữ Hiếu, chữ Nghĩa và truyền thống hiếu học. Nền tảng Gia Phả Số được xây dựng
              nhằm lưu truyền lâu dài thông tin các đời, kết nối con cháu nội ngoại dù sinh sống ở
              bất kỳ nơi đâu.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="font-serif text-lg font-bold text-wood">
              II. Tộc Ước &amp; Nề Nếp Gia Phong
            </h4>
            <ul className="list-disc pl-5 text-sm text-stone-700 space-y-2 leading-7">
              <li>
                Con cháu trong họ giữ gìn đoàn kết, kính trên nhường dưới, tương trợ lẫn nhau khi
                khó khăn, hoạn nạn.
              </li>
              <li>
                Hằng năm lấy ngày Giỗ Tổ làm dịp sum họp, dâng hương tưởng nhớ công đức tiên tổ và
                cập nhật thông tin thế hệ mới vào Sổ Đinh.
              </li>
              <li>
                Khuyến khích tinh thần học tập, duy trì Quỹ Khuyến học khen thưởng con cháu đạt
                thành tích cao trong học tập và công tác.
              </li>
            </ul>
          </section>
        </article>
      )}
    </div>
  );
}