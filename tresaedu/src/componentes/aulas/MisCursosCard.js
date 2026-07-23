import axios from 'axios'; 
import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import CONFIG from '../../config';

const URL_CALIFICACIONES = `${CONFIG.API_URL}/operarValoraciones.php`;

function MisCursosCard({c,index, configuracion, rol}) {
    const navigate = useNavigate();
    const loggeduserId = localStorage.getItem('loggedUserId');
    const [valoracion, setValoracion] = useState('');

    useEffect(() => {
        if(rol==7){ //si es estudiante
            obtenerValoracion();
        }
    }, [c]);
    
    const entrarEnCurso =(cur)=>{
        localStorage.setItem('loggeduserCurso', cur.id );
        localStorage.setItem('loggeduserCursoGrupo',  cur.id_curso_grupo);
        localStorage.setItem('loggeduserCursoGrupoO',  JSON.stringify(cur));
        navigate(`/MC/${cur.id}`);
    }
    
    const verPlanificacion =(e, cur)=>{
        e.stopPropagation(); 
        localStorage.setItem('loggeduserCurso', cur.id );
        localStorage.setItem('loggeduserCursoGrupo',  cur.id_curso_grupo);
        localStorage.setItem('loggeduserCursoGrupoO',  JSON.stringify(cur));
        navigate(`/MC/${cur.id}/P/${cur.id_curso_grupo}`);
    }

    const mostrarNombre = (orden)=>{
        switch(orden){
          case "S2": return 'Sala 2 años';
          case "S3": return 'Sala 3 años';
          case "S4": return 'Sala 4 años';
          case "S5": return 'Sala 5 años';
          case "In": return 'Espacio Institucional';
          default: return orden+'°';
        }
    };
    // obtener valoracion final
     const obtenerValoracion = async () => {
        try {
            setValoracion('');
            const response = await axios.get(
                `${URL_CALIFICACIONES}?id_estudiante=${loggeduserId}&id_curso=${c.id}`
            );
            //console.log(response.data);
            if (!response.data.error) {
                setValoracion(response.data.informacion?.valor || 0);
            } else {
                console.log(response.data);
            }
        } catch (error) {
            console.error("Error al buscar valoracion:", error);
        }
    }
    return (
        <div key={index}>
            <div className="card-estructura-MC" onClick={() => entrarEnCurso(c)} >               
                <img 
                    src={`${CONFIG.API_URL}/${
                        c.imagen_grupo_curso?.trim() || 
                        c.imagen?.trim() || 
                        c.imagen_general?.trim() || 
                        c.caratula_formacion?.trim() || 
                        `img/${configuracion.imagen_fondo}`
                    }`} 
                    className="card-img-top " 
                    alt='imagen-decorativa'
                />    
                <div className="card-text d-flex"><h6 className='text-secondary small mx-2'>Ciclo:</h6> <h6>{c.cohorte} | {mostrarNombre(c.orden)} </h6></div>
                {rol==7 && valoracion !=0 &&
                 <div className="position-absolute top-0 end-0 m-3 px-3 py-1 rounded bg-success fw-bold shadow" style={{ zIndex: 10 }}>
                     <i className="fa-solid fa-star text-warning mr-3"></i><span className='ms-2 text-white'>{valoracion}</span>
                </div>}
                <div className="caja-cuerpo2">
                    <h6 
                        title={c.nombre_espacio}
                        style={{ 
                            fontSize: "14px", 
                            fontWeight: "bold",
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}> 
                        {c.nombre_espacio.toLowerCase().includes('años')
                        ? 'General'
                        : c.nombre_espacio
                    }</h6>
                    <div className='small'>Sala/grupo: {c.denominacion}</div>
                    <div> 
                        {(c.tiene_planificacion > 0 ) 
                        ? <button type='button' className='small btn btn-outline-primary btn-sm' onClick={(e)=>verPlanificacion(e,c)}> 
                            <i className="fa-solid fa-list-check me-1"></i>Planificación
                          </button>
                        : <span className='small'><i className="fa-solid fa-list-check"></i> Planificación no disponible</span>
                        }
                    </div>
                    <div className='mb-4'><i className="fa-solid fa-people-group"></i> Estudiantes: {c.cant_estudiantes}</div>
                </div>
            </div>
        </div>
      );
}

export default MisCursosCard;