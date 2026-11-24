import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, Users, Sparkles, AlertCircle } from 'lucide-react';
import axiosClient from '../api/axiosClient';

interface MemberOption {
  id: number;
  full_name: string;
  generation: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

interface RelationshipResponse {
  person_a: string;
  person_b: string;
  lca_logic: {
    person_a_calls_b: string;
    person_b_calls_a: string;
    message: string;
  };
}

export default function RelationshipPage() {
  const [personA, setPersonA] = useState<string>('');
  const [personB, setPersonB] = useState<string>('');
  const [submittedPair, setSubmittedPair] = useState<{ a: string; b: string } | null>(null);

  const { data: members = [], isLoading: isLoadingMembers } = useQuery<MemberOption[]>({
    queryKey: ['members-options'],
    queryFn: async () => {
      const res = await axiosClient.get('/members/');
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  const {
    data: result,
    isLoading: isCalculating,
    isError,
  } = useQuery<RelationshipResponse>({
    queryKey: ['member-relationship', submittedPair?.a, submittedPair?.b],
    enabled: Boolean(submittedPair?.a && submittedPair?.b),
    queryFn: async () => {
      const res = await axiosClient.get('/members/relationship/', {
        params: {
          person_a: submittedPair?.a,
          person_b: submittedPair?.b,
        },
      });
      return res.data;
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personA || !personB) return;
    setSubmittedPair({ a: personA, b: personB });
  };

  const handleSwap = () => {
    setPersonA(personB);
    setPersonB(personA);
    if (personA && personB) {
      setSubmittedPair({ a: personB, b: personA });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tiêu đề trang */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gold/50 flex items-center gap-3">
        <div className="p-2.5 bg-crimson/10 rounded-lg border border-gold/40">
          <Users className="w-6 h-6 text-crimson" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-wood">
            Tra Cứu Quan Hệ &amp; Xưng Hô
          </h2>
          <p className="text-sm text-stone-500 italic">
            Tìm Tổ tiên chung gần nhất (LCA) và xác định vai vế xưng hô chuẩn trong dòng họ
          </p>
        </div>
      </div>

      {/* Form chọn 2 thành viên */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-sm border-2 border-gold/60 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-wood mb-1.5">
              Chọn Thành viên A
            </label>
            <select
              value={personA}
              onChange={(e) => setPersonA(e.target.value)}
              disabled={isLoadingMembers}
              className="w-full px-3 py-2.5 bg-parchment border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-crimson outline-none"
            >
              <option value="">-- Chọn người thứ nhất --</option>
              {members.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.full_name} (Đời {m.generation})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSwap}
            title="Đảo chiều A và B"
            className="mx-auto p-2.5 rounded-full border border-gold bg-parchment text-crimson hover:bg-amber-50 transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          <div>
            <label className="block text-xs font-semibold text-wood mb-1.5">
              Chọn Thành viên B
            </label>
            <select
              value={personB}
              onChange={(e) => setPersonB(e.target.value)}
              disabled={isLoadingMembers}
              className="w-full px-3 py-2.5 bg-parchment border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-crimson outline-none"
            >
              <option value="">-- Chọn người thứ hai --</option>
              {members.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.full_name} (Đời {m.generation})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-center pt-1">
          <button
            type="submit"
            disabled={!personA || !personB || isCalculating}
            className="inline-flex items-center gap-2 bg-crimson hover:bg-crimson/90 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-gold" />
            <span>{isCalculating ? 'Đang tính toán vai vế...' : 'Tra cứu xưng hô'}</span>
          </button>
        </div>
      </form>

      {/* Kết quả */}
      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Không thể tra cứu quan hệ. Vui lòng kiểm tra kết nối Backend API.</span>
        </div>
      )}

      {result && !isCalculating && (
        <div className="bg-white rounded-xl border-2 border-gold shadow-md overflow-hidden">
          <div className="bg-crimson text-parchment px-5 py-3 border-b-2 border-gold">
            <h3 className="font-serif font-bold text-base">Kết Quả Phân Tích Vai Vế</h3>
          </div>

          <div className="p-6 space-y-5">
            <p className="text-center font-serif text-lg text-wood font-semibold bg-parchment py-3 px-4 rounded-lg border border-gold/40">
              {result.lca_logic.message}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-parchment border border-gold/50 text-center">
                <p className="text-xs text-stone-500 mb-1">
                  <span className="font-semibold text-stone-800">{result.person_a}</span> gọi{' '}
                  <span className="font-semibold text-stone-800">{result.person_b}</span> là:
                </p>
                <p className="text-2xl font-serif font-bold text-crimson mt-1">
                  {result.lca_logic.person_a_calls_b}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-parchment border border-gold/50 text-center">
                <p className="text-xs text-stone-500 mb-1">
                  <span className="font-semibold text-stone-800">{result.person_b}</span> gọi{' '}
                  <span className="font-semibold text-stone-800">{result.person_a}</span> là:
                </p>
                <p className="text-2xl font-serif font-bold text-wood mt-1">
                  {result.lca_logic.person_b_calls_a}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}