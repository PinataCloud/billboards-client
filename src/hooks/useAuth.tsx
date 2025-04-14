import { useState, useEffect, createContext, useContext } from 'react';
import { FrameSDK } from '@farcaster/frame-sdk/dist/types';
import { v4 as uuidv4 } from 'uuid';

// Define the shape of our auth context
type AuthContextType = {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  nonce: string;
  message: string;
  signature: string;
  fid: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType | null>(null);

// Session storage keys
const SESSION_KEYS = {
  NONCE: 'billboards_nonce',
  MESSAGE: 'billboards_message',
  SIGNATURE: 'billboards_signature',
  FID: 'billboards_fid',
  EXPIRES_AT: 'billboards_expires_at',
};

// Session duration in milliseconds (4 hours)
const SESSION_DURATION = 4 * 60 * 60 * 1000;

export function AuthProvider({ children, sdk }: { children: React.ReactNode; sdk: FrameSDK }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [nonce, setNonce] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [fid, setFid] = useState<string | null>(null);

  // Initialize auth state from sessionStorage
  useEffect(() => {
    const storedNonce = sessionStorage.getItem(SESSION_KEYS.NONCE);
    const storedMessage = sessionStorage.getItem(SESSION_KEYS.MESSAGE);
    const storedSignature = sessionStorage.getItem(SESSION_KEYS.SIGNATURE);
    const storedFid = sessionStorage.getItem(SESSION_KEYS.FID);
    const expiresAt = sessionStorage.getItem(SESSION_KEYS.EXPIRES_AT);

    // Check if we have all necessary auth data and it hasn't expired
    if (
      storedNonce &&
      storedMessage &&
      storedSignature &&
      expiresAt &&
      Date.now() < parseInt(expiresAt)
    ) {
      setNonce(storedNonce);
      setMessage(storedMessage);
      setSignature(storedSignature);
      if (storedFid) setFid(storedFid);
      setIsAuthenticated(true);
    } else {
      // Generate a new nonce for future sign-in
      const newNonce = uuidv4().split("-").join("d");
      setNonce(newNonce);
      sessionStorage.setItem(SESSION_KEYS.NONCE, newNonce);

      // Clear any expired session data
      signOut();
    }
  }, []);

  async function signIn() {
    setIsAuthenticating(true);
    try {
      const data = await sdk.actions.signIn({ nonce });
      setSignature(data.signature);
      setMessage(data.message);

      // Verify the signature on the server and get the FID
      try {
        const response = await fetch('https://billboards-server.pinata-marketing-enterprise.workers.dev/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nonce,
            message: data.message,
            signature: data.signature
          })
        });

        if (response.ok) {
          const verifyData = await response.json();
          if (verifyData.fid) {
            setFid(verifyData.fid);
            sessionStorage.setItem(SESSION_KEYS.FID, verifyData.fid);
          }
        }
      } catch (error) {
        console.error('Error verifying signature:', error);
      }

      // Save auth data to sessionStorage with expiration
      const expiresAt = Date.now() + SESSION_DURATION;
      sessionStorage.setItem(SESSION_KEYS.MESSAGE, data.message);
      sessionStorage.setItem(SESSION_KEYS.SIGNATURE, data.signature);
      sessionStorage.setItem(SESSION_KEYS.EXPIRES_AT, expiresAt.toString());

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error during sign in:', error);
    } finally {
      setIsAuthenticating(false);
    }
  }

  function signOut() {
    // Clear auth state
    setMessage('');
    setSignature('');
    setFid(null);
    setIsAuthenticated(false);

    // Clear session storage except for nonce
    Object.values(SESSION_KEYS).forEach(key => {
      if (key !== SESSION_KEYS.NONCE) {
        sessionStorage.removeItem(key);
      }
    });

    // Generate a new nonce for future sign-in
    const newNonce = uuidv4().split("-").join("d");
    setNonce(newNonce);
    sessionStorage.setItem(SESSION_KEYS.NONCE, newNonce);
  }

  const value = {
    isAuthenticated,
    isAuthenticating,
    nonce,
    message,
    signature,
    fid,
    signIn,
    signOut
  };

  return <AuthContext.Provider value={ value }> { children } </AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
