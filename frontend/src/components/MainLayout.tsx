import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, BookHeart } from 'lucide-react';

export default function MainLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-parchment font-sans text-stone-800 flex flex-col">
      {/* Header Truyền thống */}
      <header className="bg-crimson text-parchment shadow-md border-b-4 border-gold sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <BookHeart className="w-6 h-6 text-gold" />
            <h1 className="text-xl font-serif font-bold tracking-wide">
              Gia Phả Dòng Họ
            </h1>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors text-sm font-medium border border-transparent hover:border-gold/50"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Nội dung thay đổi ở giữa (Trang chủ, Trang gia phả sẽ chui vào đây) */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
        <Outlet />
      </main>

      {/* Footer mộc mạc */}
      <footer className="py-4 text-center text-xs text-wood/60 border-t border-gold/30">
        &copy; {new Date().getFullYear()} Nền tảng Số hóa Gia Phả Dòng Họ.
      </footer>
    </div>
  );
}