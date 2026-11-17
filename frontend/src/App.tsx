import { ScrollText, Users, GitFork, Calendar } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white border-2 border-gold rounded-xl shadow-md p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-crimson/10 text-crimson mb-4 border border-gold">
          <ScrollText className="w-8 h-8" />
        </div>

        <h1 className="text-3xl md:text-4xl font-serif font-bold text-crimson mb-2">
          Gia Phả Dòng Họ Nguyễn
        </h1>
        <p className="text-wood font-medium mb-6 italic">
          "Cây có cội mới trổ cành xanh lá — Nước có nguồn mới bể rộng sông sâu"
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mb-6">
          <div className="p-4 rounded-lg bg-parchment border border-stone-200">
            <GitFork className="w-5 h-5 text-crimson mb-2" />
            <h3 className="font-bold text-wood text-sm">React Flow + Dagre</h3>
            <p className="text-xs text-stone-600 mt-1">Sẵn sàng vẽ sơ đồ phả đồ đa thế hệ</p>
          </div>
          <div className="p-4 rounded-lg bg-parchment border border-stone-200">
            <Users className="w-5 h-5 text-crimson mb-2" />
            <h3 className="font-bold text-wood text-sm">TanStack Query + Axios</h3>
            <p className="text-xs text-stone-600 mt-1">Kết nối đồng bộ API Backend</p>
          </div>
          <div className="p-4 rounded-lg bg-parchment border border-stone-200">
            <Calendar className="w-5 h-5 text-crimson mb-2" />
            <h3 className="font-bold text-wood text-sm">Tailwind CSS</h3>
            <p className="text-xs text-stone-600 mt-1">Giao diện sắc phong truyền thống</p>
          </div>
        </div>

        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-crimson text-white">
          Task 3.1: Khởi tạo Frontend Core Thành Công
        </span>
      </div>
    </div>
  )
}

export default App