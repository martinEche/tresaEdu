import './css/RolesSelector.css'
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";

import RolesCaja from './RolesCaja';
import CONFIG from '../config';

const URL = `${CONFIG.API_URL}/buscaRolesUsuario.php`;

function RolesSelector({acceder,rolSelect,configuracion, rol, rolesUsuario, setRolesUsuario}){
    const navigate = useNavigate();
    const [cargandoRol, setCargandoRol] = useState(true); // Estado para controlar la carga del rol
    const loggeduser =localStorage.getItem('loggeduser');
   
    const data= {
        'usuario' :  loggeduser,
        'modo'  :'buscarRolesUsuario'
    }
    
    useEffect( ()=>{
        LimpiarLocalStorage();
         if(acceder){
             axios.post(URL, data)
             .then(res =>{
                console.log('roles: ', res.data);
                 if(!res.data.error){ 
                     setRolesUsuario(res.data);
                     const savedRolId = localStorage.getItem('loggeduserRolId');
                     // Selección automática si ya tenía un rol seleccionado o si sólo tiene un rol
                     if (savedRolId && res.data.some(r => r.id == savedRolId)) {
                         ingresar(savedRolId);
                     } else if (res.data.length === 1) {
                         ingresar(res.data[0].id);
                     } else {
                         setRolesUsuario(res.data);
                         setCargandoRol(false);
                     }
                 }else{
                     setRolesUsuario([]);
                 }
             })
             .catch(err=>{
                 console.log(err);
             })
     
        }else{
            localStorage.clear();
            rolSelect(null);
            navigate('/');
        }
    },[])

    const LimpiarLocalStorage = () => {
        localStorage.removeItem("loggeddatoscursos");
        localStorage.removeItem("loggeduserCurso");
        localStorage.removeItem("loggeduserCursoGrupo");
        localStorage.removeItem("loggeduserClasesCurso");
        localStorage.removeItem("loggeduserCursoGrupoO");
    }

    // Función para ingresar al rol seleccionado y cargar los localstorage correspondientes
    const ingresar=(id)=>{
       // console.log(id);
        localStorage.removeItem('loggeduserCurso');
        //localStorage.removeItem('');
        localStorage.removeItem('loggeduserCursoGrupoO');
        localStorage.setItem('loggeduserRolId', id );
        rolSelect(id);
        navigate("/Principal");
    }


    return(
        <>
        {cargandoRol?
            <div className="container-principal">
                Cargando...
            </div>
        :
            <div className='container-principal mb-4 pb-4'>
                <h3 className='d-flex justify-content-center'>Seleccionar rol</h3>
                <div className='contenedor-roles'>
                    
                    { !!rolesUsuario && rolesUsuario.map(r =>(
                        <div key={r.id}>
                            <RolesCaja ingresar={ingresar} rol={r} rolSelect={rolSelect} configuracion={configuracion}/>
                        </div>
                    ))}
                </div>
            </div>
        }
        </>
    );
}

export default RolesSelector;