import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import MembersPage from './pages/MembersPage';
import FamilyTreePage from './pages/FamilyTreePage';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/tree" replace />} />
          <Route path="tree" element={<FamilyTreePage />} />
          <Route path="members" element={<MembersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;