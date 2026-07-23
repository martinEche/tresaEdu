import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'bootstrap/dist/js/bootstrap.bundle';

import axios from 'axios';
axios.defaults.withCredentials = true; //Indicamos a axios que va a tener que manejar la cookie.

// Interceptor global para atrapar los 401 (Token expirado o inválido)
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('loggedNoteAdapter');
      localStorage.removeItem('loggedUserId');
      localStorage.removeItem('loggeddatosuser');
      localStorage.removeItem('loggeduser');
      localStorage.removeItem('loggeduserNombre');
      localStorage.removeItem('loggeduserRolId')
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
