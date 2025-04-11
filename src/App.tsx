import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/dashboard';
import { Board } from './components/board';

function App() {
  return (
    <BrowserRouter>
      <div className='min-h-screen w-full flex flex-col items-center justify-start bg-background'>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/board/:slug" element={<Board />} />
        </Routes>
      </div>
    </BrowserRouter>

  )
}

export default App
