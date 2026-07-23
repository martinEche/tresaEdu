import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PrincipalAdmin from "./principal/PrincipalAdmin";
import PrincipalDocentes from "./principal/PrincipalDocentes";
import PrincipalEstudiante from "./principal/PrincipalEstudiante";
import PrincipalTesorero from "./principal/PrincipalTesorero";
import PrincipalTutor from "./principal/PrincipalTutor";
import PrincipalSecretaria from "./principal/PrincipalSecretaria";
import PrincipalDocentesEspeciales from "./principal/PrincipalDocentesEspeciales";

import axios from 'axios';
import CONFIG from '../config';

const URL_ASISTENCIA  = `${CONFIG.API_URL}/operarAsistencia.php`;

function Principal({acceder,rol, mensajesSinLeer, configuracion}){
    const navigate = useNavigate();
    //const loggeduserROlId =localStorage.getItem('loggeduserRolId');
    const cicloActual = new Date().getFullYear(); //año actual para filtrar el registro de asistencia
    const [registroAsistencia, setRegistroAsistencia] = useState([]);
    const [ListadosDeCursos, setListadosDeCursos] = useState([]);

    useEffect(()=>{   
        if(acceder){
            //console.log(rol);
            if(rol===null){
                navigate("/");
            }else{
                //limpiar los localstorage de cursos por seguridad
                localStorage.removeItem('loggeduserCursoGrupo');
                localStorage.removeItem('loggeduserCurso');
                localStorage.removeItem('loggeduserCursoGrupoO');
                buscarRegistroAsistencia(cicloActual);
            }
        }else{
            localStorage.clear();
            navigate("/");
        }
      },[])

      const buscarRegistroAsistencia = async (anioLectivo) => {
        try {
            const response = await axios.get(`${URL_ASISTENCIA}?anioRegistro=${anioLectivo}`);
            console.log('Respuesta del servidor:', response.data);
            if (response.data.resultado) {
                setRegistroAsistencia(response.data.asistenciasGeneral);
                setListadosDeCursos(response.data.cursos);
            }
        } catch (error) {
            console.error('Error al buscar registro de asistencia:', error);
        }
      };

    return(
        <>
            <div className='container-principal mb-3'>
                {rol==1 && <h5>Area Super admin</h5>}
                {(rol==2 || rol==3) && <PrincipalAdmin registroAsistencia={registroAsistencia} ListadosDeCursos={ListadosDeCursos} mensajesSinLeer={mensajesSinLeer} rol={rol} configuracion={configuracion}/>}
                {(rol==4) && <PrincipalSecretaria registroAsistencia={registroAsistencia} ListadosDeCursos={ListadosDeCursos} mensajesSinLeer={mensajesSinLeer} rol={rol} configuracion={configuracion}/>}
                {(rol==6 || rol==5) && <PrincipalDocentes mensajesSinLeer={mensajesSinLeer} rol={rol} configuracion={configuracion}/>}
                {rol==7  && <PrincipalEstudiante rol={rol} configuracion={configuracion} />}
                {(rol ==8) && <PrincipalTutor rol={rol} configuracion={configuracion} />}
                {rol==9 && <PrincipalDocentesEspeciales ListadosDeCursos={ListadosDeCursos} configuracion={configuracion} />}
                {rol==13  && <PrincipalTesorero rol={rol} mensajesSinLeer={mensajesSinLeer} configuracion={configuracion}/>}
                
            </div>
        </>
    );
}

export default Principal;