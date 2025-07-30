
import React from 'react';
import "./index.css"
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import {App} from './App';
import {ToastContainer} from "react-toastify"
import ErrorBoundary from './components/ErrorBoundary';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <App />
        <ToastContainer position='bottom-right' theme='dark'/>
      </ErrorBoundary>
    </Provider>
  </React.StrictMode>
);