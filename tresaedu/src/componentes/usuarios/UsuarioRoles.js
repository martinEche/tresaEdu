import axios from 'axios';
import { useEffect, useState } from 'react';
import { show_alerta } from '../../funciones.js';

import CONFIG from '../../config';

const URL = `${CONFIG.API_URL}/buscaRolesUsuario.php`;
const URL_USUARIO  = `${CONFIG.API_URL}/operarTablaUsuario.php`;

function UsuarioRoles({id_usuario, rol}) {
    const [rolesUsuario, setRolesUsuario] = useState([]);
    
    

    useEffect( ()=>{
        buscarRoles();
    },[id_usuario])

    const buscarRoles =()=>{
        const data= {
            'id_usuario' :  id_usuario,
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
    const eliminaRol=(id_usuario, id_rol)=>{
        enviarSolicitud('DELETE',{'id_usuario':id_usuario,'id_rol': id_rol})
    };

    const enviarSolicitud = async (metodo, parametros) =>{
        await axios({method:metodo, url:URL_USUARIO, data:parametros})
            .then(res =>{
                console.log(res.data);
                var tipo = res.data[0];
                var msj = res.data[1];
                //console.log(msj+'-'+tipo);
                show_alerta(msj,tipo);
                buscarRoles()
            })
            .catch(err=>{
                show_alerta('Error en la solicitud ','error');
                console.log(err);
            })
    }

    return(
             <div>
                { !!rolesUsuario && rolesUsuario.map(r =>(
                <div key={r.id} className='row'>
                    <div className='col-5'>
                        <small><i className={r.icono}></i> {r.nombre}</small>
                    </div>
                    <div className='col-2'>
                        { rol <=2 &&<small><button className='btn btn-sm btn-outline-link' onClick={()=>eliminaRol(id_usuario,r.id)}><i className='fa fa-solid fa-trash mx-1'></i></button></small>}
                    </div>
                    <div className='col'></div>
                </div>
               ))}
            </div>
    );
}

export default UsuarioRoles;