
import {useRef, useState } from 'react';
import axios from 'axios';
import CONFIG from '../../config';

const URL_LOGIN  = `${CONFIG.API_URL}/login.php`;

function InscripcionExternaLogin() {
    const [error, setError] = useState(null);
    const refUsuario = useRef(null);
    const refClave = useRef(null);

    const handleLogin = (e) => {
        e.preventDefault();
        
        //datos
        const data= {
            'usuario' :refUsuario.current.value,
            'clave' : refClave.current.value
        }
        axios.post(URL_LOGIN, data)
        .then(res =>{ //capturamos el resultado del backend
           console.log('error: '+res.data.conectado);
            if(res.data.conectado){ 
               // acceder(true); //conectado propiedad que viene del backend
                localStorage.setItem('loggedNoteAdapter', true);
                localStorage.setItem('loggeddatosuser', JSON.stringify(res.data.infoUser));
                localStorage.setItem('loggeduser', res.data.infoUser.usuario);
                localStorage.setItem('loggedUserId', res.data.infoUser.id );
                localStorage.setItem('loggeduserNombre', res.data.infoUser.nombre +' '+ res.data.infoUser.apellido);
                //console.log("dato:"+res.data);  
            }else{
                setError(res.data.error); //error propiedad que viene del backend
                //acceder(false); //conectado propiedad que viene del backend
            }
        })
        .catch(err=>{
            console.log(err);
        })
    }    

    return ( 
        <>
        <div className='container-fluid'>
            <div className="row">
                <div className="col-sm-6 login-section-wrapper text-center">
                    <div>
                        <img src={`../img/logo_CSI.png`} alt="logo" className="logo" />
                    </div>
                    
                    <form onSubmit={handleLogin} className='login-wrapper my-auto w-100 text-center'>
                        <h1 className="login-title">Ingreso</h1>
                        { error && 
                            <div className='alerta text-danger'>
                                 {error}
                            </div>
                        }
                        <div className="mb-3" controlId="exampleForm.ControlInput1">
                            <label>Usuario</label>
                            <input
                                className='form-control'
                                type="text" 
                                placeholder="Usuario" 
                                ref={refUsuario} 
                            />
                        </div>
                        <div className="mb-3" controlId="exampleForm.ControlTextarea1">
                            <label>Contraseña</label>
                            <input
                                className='form-control' 
                                type="password"
                                placeholder="Ingrese Contraseña" 
                                ref={refClave}  
                            />
                        </div>
                        
                        <button
                            className="btn btn-block login-btn"
                            type='submit'
                        >ingresar</button>
                    </form>
                </div>
                <div className="col-sm-6 px-0 d-none d-sm-block">
                    <img src={`../img/vista-aula-escuela.jpg`} alt="imagen decoracio" className="login-img" />
                </div>
            </div>
        </div>
        </>
     );
}

export default InscripcionExternaLogin;