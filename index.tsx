
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './svgadesigner-705ed3a51b2f0c3d52b76e1abfddb41dda8cccf8/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
