import './css/CajaLogin.css';
import {useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Form from 'react-bootstrap/Form';
import CONFIG from '../config';

const URL_LOGIN  = `${CONFIG.API_URL}/login.php`;

function CajaLogin({acceder}){
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
  
    return(
    <main className='fondo d-flex justify-content-center'>
        <div className="contenedorLogin card shadow border-0 justify-content-center" >
            <div className="formulario">
                <form onSubmit={handleLogin}>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                        <h2 className="text-light">INICIAR SESIÓN</h2>
                        { error && 
                        
                            <div className='alert alert-danger alerta text-danger'>
                                 {error}
                            </div>
                        }
                    </Form.Group>                   
                    <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                        <Form.Label>Usuario</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="nombre de usuario"
                            required
                            ref={refUsuario} 
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                        <Form.Label>Contraseña</Form.Label>
                        <Form.Control 
                            type="password"
                            placeholder="contraseña"
                            required
                            ref={refClave}  
                        />
                    </Form.Group>
                    <div className='d-flex justify-content-center'>
                        <button
                        className="tresaedu-btn"
                        type='submit'
                        >
                            ingresar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </main>

    );

}

export default CajaLogin;
