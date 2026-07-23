import './css/Usuarios.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import UsuariosCaja from "./UsuariosCaja";
import {Link} from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import CONFIG from '../../config';

const URL_ADM  = `${CONFIG.API_URL}/admin.php`;

function Usuarios({acceder, rol, configuracion}){
    const [roles, setRoles] = useState([]);
    const navigate = useNavigate();
   // const loggeduserROlId =localStorage.getItem('loggeduserRolId');

    useEffect(()=>{
        if(acceder){
            //console.log(rolSelect);
            if(rol===null){
                navigate("/");
            }else{
               // setRol(loggeduserROlId);
        
                axios.post(URL_ADM)
                .then(res =>{
                    if(!res.data.error){ 
                        //console.log('datos2: '+ JSON.stringify(res.data));  
                        setRoles(res.data);
                    }else{
                        setRoles([]);
                }
                })
                .catch(err=>{
                    console.log(err);
                })
            }
        }else{
            localStorage.clear();
            navigate('/');
        }
    },[])

    return(
            <div className='container-principal'>
                <h5 className='titulo-area'>Usuarios</h5>
                <div className="container-usuarios">  
                <div className='row mb-3'>
                    {/* Columna con la info */}
                    <div className='col-12 col-md-8 col-xxl-7 '>
                        <div>
                            <Link className='btn btn-outline-secondary mx-3 mb-2' to={'/Usuarios/0'}><i className="fa-solid fa-users m-1" style={{color:configuracion.color_secundario}}></i> Administrar Usuarios</Link>
                            <Link className='btn btn-outline-secondary mx-3  mb-2' to={'/Usuarios/-1'}><i className="fa-solid fa-users-slash m-1" style={{color:configuracion.color_secundario}}></i> sin rol</Link>
                        </div>
                        <div className='d-flex flex-wrap justify-content-start'>
                            {roles.map((c) => (
                                (rol === 1 || c.id !== 1) && (
                                    <UsuariosCaja 
                                    key={c.id} 
                                    rolNombre={c.rol} 
                                    cantidad={c.cant} 
                                    icon={c.icon} 
                                    info={c.info} 
                                    id={c.id}
                                    configuracion={configuracion} 
                                    />
                                )
                                ))}
                        </div>                        
                    </div>

                    {/* Imagen que desaparece en celular */}
                    <div className='col-md-4 col-xxl-5 d-none d-md-block d-flex flex-wrap justify-content-start'>
                        <img 
                            src={`${CONFIG.API_URL}/img/userRol.png`} 
                            className='img-fluid mt-5' 
                            alt='Usuarios' 
                        />
                    </div>                        
                </div> 
            </div>


            </div>
    );
}

export default Usuarios;