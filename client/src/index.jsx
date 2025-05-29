
import React from 'react';
import "./index.css"
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import {App} from './App';
import {ToastContainer} from "react-toastify"

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <ToastContainer position='bottom-right' theme='dark'/>
    </Provider>
  </React.StrictMode>
);