import './css/CajaLogin2.css';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import CONFIG from '../config';

const URL_LOGIN = `${CONFIG.API_URL}/login.php`;

function CajaLogin2({ acceder }) {
  const [error, setError] = useState(null);
  const refUsuario = useRef(null);
  const refClave = useRef(null);


  useEffect(() => { }, []);

  const handleLogin = (e) => {
    e.preventDefault();

    //datos
    const data = {
      'usuario': refUsuario.current.value,
      'clave': refClave.current.value
    };

    axios
      .post(URL_LOGIN, data)
      .then((res) => {

        if (res.data.conectado) {

          acceder(true);

          localStorage.setItem('loggedNoteAdapter', true);
          localStorage.setItem('loggeddatosuser', JSON.stringify(res.data.infoUser));
          localStorage.setItem('loggeduser', res.data.infoUser.usuario);
          localStorage.setItem('loggedUserId', res.data.infoUser.id);
          localStorage.setItem(
            'loggeduserNombre',
            res.data.infoUser.nombre + ' ' + res.data.infoUser.apellido
          );

          // Le avisamos a Flutter que se logeo (Esto en caso de que lo hayan hecho del celu)
          if (window.Flutter && typeof window.Flutter.postMessage === 'function') {
            const flutterMsg = {
              action: 'LOGIN',
              userId: res.data.infoUser.id,
              token: res.data.token
            };
            window.Flutter.postMessage(JSON.stringify(flutterMsg));
          }

        } else {
          setError(res.data.error);
          acceder(false);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return (
    <main className="caja-login-fondo py-2">
      <div className="d-flex justify-content-center">
        <div className="contenedor-caja-login ">
          <div className="cuerpo-login">
            <div className="cuerpo-login-circulo p-3 d-flex justify-content-center align-items-center">
              <img src="https://www.institutopetitdemeurville.com.ar/img/logo_CSI.png" className="img-fluid" />
            </div>
            <div className="cuerpo-login-trapecio"></div>
            <div className="cuerpo-login-cuadrado">
              <form onSubmit={handleLogin} className="login-wrapper my-auto w-100 text-center">
                <h1 className="login-title">Ingreso</h1>

                {error && <div className="alerta text-danger">{error}</div>}

                <Form.Group className="mb-3">
                  <div className="fuente text-start text-dark">Usuario</div>
                  <div className="input-group input-icon-group">
                    <span className="icon-wrapper">
                      <i className="fa-solid fa-user icon-style"></i>
                    </span>
                    <Form.Control
                      className="input"
                      type="text"
                      placeholder="Usuario"
                      required
                      ref={refUsuario}
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <div className="fuente text-start text-dark">Contraseña</div>
                  <div className="input-group input-icon-group">
                    <span className="icon-wrapper">
                      <i className="fa-solid fa-lock icon-style"></i>
                    </span>
                    <Form.Control
                      className="input"
                      type="password"
                      placeholder="Ingrese Contraseña"
                      required
                      ref={refClave}
                    />
                  </div>
                </Form.Group>

                <button className="login-btn" type="submit">
                  ingresar
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default CajaLogin2;
