import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/geist';
import '@fontsource/doto/700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/nav-hero.css';
import './styles/sections-a.css';
import './styles/sections-b.css';
import { Root } from './Root';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
