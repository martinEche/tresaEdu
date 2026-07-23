import axios from 'axios';
import { useEffect, useState } from 'react';
import { show_alerta } from '../../funciones.js';

import CONFIG from '../../config';

const URL = `${CONFIG.API_URL}/buscaRolesUsuario.php`;
const URL_USUARIO  = `${CONFIG.API_URL}/operarTablaUsuario.php`;

function UsuarioBotoneraPermimtida({rolLogeado, usr, setIdUsuario, setDatoAEditar, eliminarData}) {
    const [rolesUsuario, setRolesUsuario] = useState([]);
    
    useEffect( ()=>{
        buscarRoles();
    },[usr.id])

    const buscarRoles =()=>{
        const data= {
            'id_usuario' :  usr.id,
            'modo'  :'buscarRolesUsuario'
        }
        axios.post(URL, data)
        .then(res =>{
            if(!res.data.error){ 
                setRolesUsuario(res.data);
            }else{
                setRolesUsuario([]);
            }
        })
        .catch(err=>{
            console.log(err);
        })
    }
    
    return ( 
    <>
    
    { (rolLogeado <= Math.min(...rolesUsuario.map(r => r.id))) && (
        <> 
        <button type="button" className='btn btn-sm btn-outline-warning me-1' onClick={()=>setIdUsuario(usr.id)} data-bs-toggle="modal" data-bs-target="#modalResetPassword"><i className="fa-solid fa-key"></i> Reset </button>
        <button type="button" className='btn btn-sm btn-warning me-1' onClick={()=>setDatoAEditar(usr)} data-bs-toggle="modal" data-bs-target="#modalEditar" ><i className='fa fa-solid fa-pencil'></i></button>
        <button type="button" className='btn btn-sm btn-danger me-1' onClick={()=>eliminarData(usr.id)}><i className='fa fa-solid fa-trash'></i></button>
        </>
    )}
    </> 
    );
}

export default UsuarioBotoneraPermimtida;