import * as ed25519 from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";
ed25519.etc.sha512Sync = sha512;

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
