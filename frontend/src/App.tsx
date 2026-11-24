
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import type { JSX } from 'react/jsx-runtime';
import MembersPage from './pages/MembersPage';
import FamilyTreePage from './pages/FamilyTreePage';


// Giao diện tạm cho Trang chủ sau khi đăng nhập thành công
// const HomePage = () => (
//   <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm text-center">
//     <h2 className="text-2xl font-serif text-crimson font-bold mb-2">Chào mừng đến với hệ thống Sổ Gia Phả</h2>
//     <p className="text-wood">Em đã kết nối Backend lấy thẻ JWT và chuyển hướng thành công!</p>
//   </div>
// );

// Component bảo vệ vòng ngoài: Có Token mới cho vào MainLayout
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="tree" element={<FamilyTreePage />} />
        {/* Các trang bắt buộc đăng nhập sẽ nằm trong Route này */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<MembersPage />} />
          {/* Ở Task 3.3 em sẽ chèn Route cho trang Danh sách thành viên vào đây */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;