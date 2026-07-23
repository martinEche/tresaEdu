import { useState, useEffect } from 'react';
import axios from 'axios';
import './Principal.css';
import CONFIG from '../../config.js';
import { useNavigate } from "react-router-dom";
import CalendarioResumenEventos from '../mensajes/CalendarioResumenEventos.js';


const URL_INFO = `${CONFIG.API_URL}/info_principal.php`;
const URL_CALENDARIO = `${CONFIG.API_URL}/operarCalendario.php`;

function PrincipalDocentes({ mensajesSinLeer, rol, configuracion }) {

    const [cursosArr, setCursosArr] = useState([]);
    const userId =localStorage.getItem('loggedUserId');
    const [eventos, setEventos] = useState([]);
    const loggeduserId =localStorage.getItem('loggedUserId');
    const navigate = useNavigate();
    const fecha = new Date();
    const cicloActual = fecha.getFullYear();

    useEffect(() => {
        buscaInfo();
        obtenerEventos();
    }, []);

    const buscaInfo = () => {
        axios.get(`${URL_INFO}?id_usiario=${loggeduserId}&ciclo=${cicloActual}`)
            .then(res => {
                if (res.data.usuarios) { 
                    // Asumiendo que la API retorna estos datos
                    setCursosArr(res.data.arregloCursos);
                    console.log('arregloCursos:', res.data.arregloCursos);
                } else {

                    setCursosArr([]);
                }
            })
            .catch(err => {
                console.log(err);
            });
    };

   const obtenerEventos = async () => {
        try {
            const res = await axios.get(`${URL_CALENDARIO}?id_usiario=${loggeduserId}`);
            console.log("eventos:"+JSON.stringify(res.data));
            if (Array.isArray(res.data)) {
                // Aplicar filtros según el rol
                const eventosFiltrados = res.data.filter(evento => {
                    const esPropio = evento.creada_por == userId;
                    
                let filtroPorRol = false;
                rol = parseInt(rol, 10);
                switch (rol) {
                        case 1:
                            filtroPorRol = ['todos', 'todosA', 'todosD', 'todosE','todosT','todosM'].includes(evento.tipo_recordatorio);
                            break;
                        case 2:
                            filtroPorRol = ['todos', 'todosA', 'todosD', 'todosE','todosT','todosM'].includes(evento.tipo_recordatorio);
                            break;
                        case 3:
                            filtroPorRol = ['todos', 'todosA', 'todosD', 'todosE','todosT','todosM'].includes(evento.tipo_recordatorio);
                            break;
                        case 4:
                            filtroPorRol = ['todos', 'todosA', 'todosD', 'todosE','todosT','todosM'].includes(evento.tipo_recordatorio);
                            break;
                        case 5:
                            filtroPorRol = ['todos', 'todosD', 'todosDC', 'todosDETC'].includes(evento.tipo_recordatorio);
                            break;
                        case 6:
                            filtroPorRol = ['todos', 'todosD', 'todosDC', 'todosDETC'].includes(evento.tipo_recordatorio);
                            break;
                        case 7:
                            filtroPorRol = ['todos', 'todosE', 'todosEC', 'todosDETC'].includes(evento.tipo_recordatorio);
                            //console.log('rol 7, evento:', evento.tipo_recordatorio, 'filtroPorRol:', filtroPorRol);
                            break;
                        case 8:
                            filtroPorRol = ['todos', 'todosT','todosE', 'todoTC', 'todosDETC'].includes(evento.tipo_recordatorio);
                            break;
                        case 9:
                            filtroPorRol = ['todos', 'todosD'].includes(evento.tipo_recordatorio);
                            break;
                        case 12:
                            filtroPorRol = ['todos', 'todosM'].includes(evento.tipo_recordatorio);
                            break;
                        default:
                            filtroPorRol = false;
                            break;
                    }
    
                    return esPropio || filtroPorRol;
                });

                setEventos(eventosFiltrados);
            } else {
                setEventos([]);
                console.error('La respuesta de la API no es un array:', res.data);
            }
        } catch (err) {
            console.error('Error al obtener eventos:', err);
        }
    };

    const mostrarNombre = (orden)=>{
        let nombre="";
        switch(orden){  
          case "S2":
            nombre='Sala de 2';
            break        
          case "S3":
            nombre='Sala de 3';
          break
          case "S4":
            nombre='Sala de 4';
          break
          case "S5":
            nombre='Sala de 5';
          break
          case "In":
            nombre='Espacio Institucional';
          break
          default:
            nombre=orden+'°';
        }
        return nombre
      };

    const entrarEnCurso =(cur)=>{
        localStorage.setItem('loggeduserCurso', cur.id );
        localStorage.setItem('loggeduserCursoGrupo',  cur.id_curso_grupo);
        localStorage.setItem('loggeduserCursoGrupoO',  JSON.stringify(cur));
        navigate(`/MC/${cur.id}`);
    }
    return (    
        <div className="">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold text-dark m-0">
                    <i className="fa-solid fa-chalkboard-user text-primary me-2"></i>
                    Panel Docente
                </h4>
            </div>

            <div className='row g-4'>
                {/* Columna Izquierda: Calendario */}
                <div className='col-12 col-lg-4'>
                    <div className='card border-0 shadow-sm rounded-4 h-100 overflow-hidden'>
                        <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-4">
                            <h6 className="fw-bold text-dark mb-0">
                                <i className="fa-regular fa-calendar-days text-primary me-2"></i>
                                Próximos Eventos
                            </h6>
                        </div>
                        <div className='card-body p-4 pt-3'>
                            <CalendarioResumenEventos userId={userId} rol={rol} eventos={eventos} />
                        </div>
                    </div>
                </div>
                
                {/* Columna Derecha: Cursos */}
                <div className='col-12 col-lg-8'>
                    <div className='card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-light-subtle'>
                        <div className="card-header bg-transparent border-bottom-0 pt-4 pb-0 px-4">
                            <h6 className="fw-bold text-dark mb-0">
                                <i className="fa-solid fa-book-open-reader text-success me-2"></i>
                                Mis Cursos ({cursosArr.length})
                            </h6>
                            <p className="text-muted small mt-1 mb-0">Seleccioná un curso para ingresar al aula virtual</p>
                        </div>
                        
                        <div className='card-body p-4'>
                            {cursosArr.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="fa-solid fa-folder-open mb-3 opacity-50" style={{fontSize: '3rem'}}></i>
                                    <h6>Aún no tienes cursos asignados.</h6>
                                </div>
                            ) : (
                                <div className='row g-3'>
                                    {cursosArr.map((c)=>(
                                        <div key={c.id} className="col-12 col-md-6">
                                            <div 
                                                className="card h-100 border-0 shadow-sm hover-shadow-lg transition-all rounded-3"
                                                onClick={() => entrarEnCurso(c)}
                                                style={{ cursor: 'pointer', borderLeft: `4px solid ${configuracion.color_principal || '#0d6efd'}` }}
                                            >
                                                <div className="card-body p-3">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <span className="badge bg-light text-secondary border">
                                                            {c.cohorte}
                                                        </span>
                                                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                                                            Grupo {c.denominacion}
                                                        </span>
                                                    </div>
                                                    
                                                    <h6 className="fw-bold text-dark mb-1 lh-sm" style={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {c.nombre_espacio?.toLowerCase().includes('años') ? 'General' : c.nombre_espacio || c.nombre}
                                                    </h6>
                                                    
                                                    <p className="text-muted small mb-0 mt-2">
                                                        <i className="fa-solid fa-graduation-cap me-1 opacity-75"></i>
                                                        {mostrarNombre(c.orden)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default PrincipalDocentes;
