import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollText, KeyRound, User, Loader2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Gọi API POST /api/v1/auth/login/ mà Backend đã làm ở Task 2.1
      const response = await axiosClient.post('/auth/login/', {
        username,
        password,
      });

      // Lưu Token vào Local Storage
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Chuyển hướng vào trang chủ
      navigate('/');
    } catch (err: unknown) {
        console.error(err);
        setError('Tài khoản hoặc mật khẩu không chính xác. Xin thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gold/40">
        {/* Nửa trên: Header trang Đăng nhập */}
        <div className="bg-crimson p-6 text-center border-b-[6px] border-gold relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-parchment text-crimson mb-2 shadow-inner border-2 border-gold/50">
            <ScrollText className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-parchment">Trần Đường Quán</h2>
          <p className="text-sm text-gold mt-1 italic font-medium">Bảo vật truyền gia</p>
        </div>

        {/* Nửa dưới: Form nhập liệu */}
        <div className="p-6 md:p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200 text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-sm font-bold text-wood flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Danh tính (Tài khoản)</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-parchment/50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-crimson focus:border-crimson outline-none transition-all"
                placeholder="Nhập tên tài khoản..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-wood flex items-center space-x-2">
                <KeyRound className="w-4 h-4" />
                <span>Mật mã</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-parchment/50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-crimson focus:border-crimson outline-none transition-all"
                placeholder="Nhập mật khẩu..."
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-crimson hover:bg-crimson/90 text-white font-bold py-3 rounded-lg shadow transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Khai Bút Truy Cập</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}