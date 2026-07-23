import './css/contraseña.css';
import { useRef, useState } from 'react';
import axios from 'axios';
import CONFIG from '../../config.js';
import { useNavigate } from "react-router-dom";

const URL  = `${CONFIG.API_URL}/operarTablaUsuario.php`;

function CambiarPass({ acceder }) {
    const [error, setError] = useState('');
    const [errorBack, setErrorBack] = useState('');
    
    const refUsuarioId = useRef(localStorage.getItem('loggedUserId'));
    const refClaveActual = useRef(null);
    const refClaveNueva = useRef(null);
    const refClaveNueva2 = useRef(null);
    const navigate = useNavigate();

    const handlecambiarPass = (e) => {
        e.preventDefault();
        
        if (refClaveNueva.current.value === refClaveNueva2.current.value) {
            // Datos para el backend
            const data = {
                'id_usuario': refUsuarioId.current,
                'claveActual': refClaveActual.current.value,
                'claveNueva': refClaveNueva.current.value,
            };
            console.log('URL:' + URL);
            enviarSolicitud("POST", data);
        } else {
            setError('Las contraseñas no coinciden');
        }
    };

    const enviarSolicitud = async (metodo, parametros) =>{
        console.log('metodo '+metodo); 
        console.log(' parametros'+JSON.stringify(parametros)); 
         
        await axios({method:metodo, url:URL, data:parametros})
        .then(res =>{
            console.log('datos'+res.data);   
            if (res.data.conectado) { 
                console.log('datos'+res.data);  
                 acceder(false);
                 navigate("/");
            } else {
                setErrorBack(res.data.error);
             }
        })
        .catch(err => {
              console.log(err);
         });
    }

    return (
        <div className="container-principal">
            <div className="row">
                <div className="col-12 col-sm-6 d-flex justify-content-center">
                    <img src='../img/3275434.jpg' className='img-fluid' alt='Nueva contraseña'/>
                </div>
                <div className="col-12 col-sm-6 p-4">
                    <div className='container p-4'>
                        <h3>Nueva contraseña</h3>
                        <form onSubmit={handlecambiarPass}>
                            {/* Mostrar mensaje de error global */}
                            {error && <div className="alert alert-danger">{error}</div>}
                            {errorBack && <div className="alert alert-danger">{errorBack}</div>}
                            <div className="mb-2">
                                <label className="form-label">Contraseña actual</label>
                                <input 
                                    type="password" 
                                    name="claveAnterior" 
                                    id="claveAnterior" 
                                    className={`form-control ${errorBack ? 'is-invalid' : ''}`} 
                                    required 
                                    placeholder="Ingrese contraseña actual" 
                                    ref={refClaveActual} 
                                />
                                {/* Mensaje de error en los campos de contraseña */}
                                {errorBack && <div className="invalid-feedback">{errorBack}</div>}
                            </div>
                            
                            <div className="mb-2">
                                <label className="form-label">Nueva contraseña</label>
                                <input 
                                    type="password" 
                                    name="nuevaClave" 
                                    id="nuevaClave" 
                                    className={`form-control ${error ? 'is-invalid' : ''}`} 
                                    required 
                                    placeholder="Ingrese nueva contraseña" 
                                    ref={refClaveNueva} 
                                />
                            </div>
                            
                            <div className="mb-2">
                                <label className="form-label">Reingrese nueva contraseña</label>
                                <input 
                                    type="password" 
                                    name="nuevaClave2" 
                                    id="nuevaClave2" 
                                    className={`form-control ${error ? 'is-invalid' : ''}`} 
                                    required 
                                    placeholder="Reingrese nueva contraseña" 
                                    ref={refClaveNueva2} 
                                />
                                {/* Mensaje de error en los campos de contraseña */}
                                {error && <div className="invalid-feedback">Las contraseñas no coinciden</div>}
                            </div>

                            <div className='d-flex justify-content-center'>
                                <button type='submit' className=''>Modificar contraseña</button>
                                <button type='button' className='btn btn-secondary ms-1'>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CambiarPass;
