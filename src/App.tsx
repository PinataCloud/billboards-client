import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/dashboard';
import { Board } from './components/board';
import sdk from '@farcaster/frame-sdk';

function App() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      sdk.actions.ready();
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <div className='min-h-screen w-full flex flex-col items-center justify-start bg-background'>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/board/:slug" element={<Board sdk={sdk} />} />
        </Routes>
      </div>
    </BrowserRouter>

  )
}

export default App
