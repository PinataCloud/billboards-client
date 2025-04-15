import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/dashboard';
import { Board } from './components/board';
import sdk from '@farcaster/frame-sdk';
import { AuthProvider } from './hooks/useAuth';
import { Context } from '@farcaster/frame-sdk';

function App() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();


  useEffect(() => {
    const load = async () => {
      setContext(await sdk.context);
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
    <AuthProvider sdk={sdk}>
      <BrowserRouter>
        <div className='min-h-screen w-full flex flex-col items-center justify-start bg-background'>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/board/:slug" element={<Board sdk={sdk} context={context} />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
