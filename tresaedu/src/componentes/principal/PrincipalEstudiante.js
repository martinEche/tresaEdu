import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Espera from '../Espera';
import './Principal.css';

import CONFIG from '../../config';
import InfoPersona from '../estudiantes/InfoPersona';
import Trayecto from '../estudiantes/Trayecto';
import DocentesCurso from '../estudiantes/DocentesCurso';
import Asistencia from '../estudiantes/Asistencia';
import CalendarioResumenEventos from '../mensajes/CalendarioResumenEventos';
import EspaciosHoy from '../institucion/EspaciosHoy';
import NavBarEstudianteTutor from '../estudiantes/NavBarEstudianteTutor';

const URL_LISTAR = `${CONFIG.API_URL}/listarUsuarios.php`;
const URL  = `${CONFIG.API_URL}/operarTablaUsuario.php`;
const URL_cursos  = `${CONFIG.API_URL}/operarCursos.php`;
const URL_CALENDARIO = `${CONFIG.API_URL}/operarCalendario.php`;

function PrincipalEstudiante({rol, configuracion, verTutor, setVerEstudiante}) {
    const [perfil, setPerfil] = useState({
        id:null,
        nombre:"",
        apellido:"",
        apodo:"",
        imagen_perfil:"",
        fecnac:"",
        email:"",
        genero:"",
        telefono:"",
        calle:"",
        numero:"",
        piso:"",
        depto:"",
        ciudad:"",
        provincia:"",
        modo:"actualizar-perfil"
    });
    const [espera, setEspera] = useState(false);
    const [cursos, setCursos] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [tutorVinculado, setTutorVinculado] = useState([{'id':1}]);
    const [showModal, setShowModal] = useState(false); // 👈 nuevo estado
    const navigate = useNavigate();
    
    const fecha = new Date();
    const añoActual = fecha.getFullYear();
    const datosCurso = [];
    const defaultFilePerfil='https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
    const userId =verTutor==null?localStorage.getItem('loggedUserId'):verTutor;
    const [datoEstudiante, setDatoEstudiante] = useState([]);
    const llamoTutor = localStorage.getItem('kte'); //llave de acceso a los datos  del estudiante tutelado
    
    useEffect(()=>{   
        if (llamoTutor) {
            // dividir por "&"
            const [fecha, estudianteStr, idTutor] = llamoTutor.split("&");

            // parsear el JSON de la parte central
            setDatoEstudiante(JSON.parse(estudianteStr));
            console.log("Fecha:", fecha);
            console.log("ID Tutor:", idTutor);
        }
        obtenerDatos();
        obtenerCursos();
        obtenerEventos();
      },[])
    
    //useEffect(()=>{
        //manejo de tutores desactivado
        //if (tutorVinculado.length === 0) {
        //    setShowModal(true); // 👈 abre modal si no hay tutor
        //}else{
        //     setShowModal(false); // 👈 cierra modal si hay tutor
        //}
    //},[tutorVinculado]);

    const obtenerDatos=()=>{
        const data= {
            'id_usuario' :  userId,
            'modo': 'buscarPerfilUsuario'
        }

        axios.post(URL_LISTAR, data)
        .then(res =>{
            if(!res.data.error){ 
                //Sconsole.log(res.data);
                setPerfil(res.data.datos);
                setTutorVinculado(res.data.vinculo);
            }else{
                setPerfil(null);
                setTutorVinculado([]);
            }
        })
        .catch(err=>{
            console.log(err);
        })
    }

    const obtenerCursos =()=>{
        const data= {
            'id_usuario' : userId,
            'modo': 'buscarCursosUsuario',
            'llama':rol
        }
        // console.log(data);
        setEspera(true);
        axios.post(URL_cursos , data)
        .then(res =>{
            console.log('cursos res.data', res.data);
            (!res.data.error)?setCursos(res.data):setCursos([]);
            setEspera(false);
        })
        .catch(err=>{
            console.log(err);
        })
    }

    const obtenerEventos = async () => {
        try {
            //const res = await axios.get(URL_CALENDARIO);
            //const cursoId = localStorage.getItem('loggeduserCurso');
            const grupoId = localStorage.getItem('loggeduserCursoGrupo');

            const res = await axios.get(`${URL_CALENDARIO}?id_usiario=${userId}${grupoId ? `&id_curso_grupo=${grupoId}` : ''}`);
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

    //reacomoda los nombre segun la sala
    const mostrarNombre = (orden)=>{
        let nombre="";
        switch(orden){
          case "S2":
            nombre='Sala 2 años';
            break   
          case "S3":
            nombre='Sala 3 años';
          break
          case "S4":
            nombre='Sala 4 años';
          break
          case "S5":
            nombre='Sala 5 años';
          break
          case "In":
            nombre='Espacio Institucional';
          break
          default:
            nombre=orden+'°';
        }
        return nombre
      };

    const entrarEnCurso = (cur) => {
        localStorage.setItem('loggeduserCurso', cur.id);
        localStorage.setItem('loggeduserCursoGrupo', cur.id_curso_grupo);
        localStorage.setItem('loggeduserCursoGrupoO', JSON.stringify(cur));
        navigate(`/MC/${cur.id}`);
    };

    const obtenerDiaSemana = () => {
        const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const hoy = new Date();
        return dias[hoy.getDay()];
    };
    const dia = obtenerDiaSemana();
    return (    
        <div>
        {llamoTutor && <NavBarEstudianteTutor estudiante={datoEstudiante} configuracion={configuracion} setVerEstudiante={setVerEstudiante} />}
            <div className='card shadow border-0 p-2' style={{ backgroundColor: configuracion.color_secundario }}>
                <div className="row align-items-center">
                {/* PERFIL */}
                    <div className="col-12 col-md-3 d-flex justify-content-center mb-3 mb-md-0">
                        <InfoPersona 
                        datosUser={perfil} 
                        datosCurso={cursos} 
                        anioActual={añoActual} 
                        configuracion={configuracion}
                        />
                    </div>
                {/* TRAYECTO */}
                    <div className="col-12 col-md-6 mb-3 mb-md-0">
                        <Trayecto cursos={cursos} />
                    </div>
                {/* ASISTENCIA */}
                    <div className="col-12 col-md-3">
                        <Asistencia 
                            id_estudiante={userId} 
                            mostrarAsistencia={añoActual} 
                        />
                    </div>
                </div>   
            </div>

            <div className='row'>
                <div className='col-12 col-sm-6'>
                    {!espera ? 
                    <>
                    {cursos.length==0 ?"No exiten curso/s"
                    :<div className='card shadow border-0 mt-2 p-4'>
                        <h5>Cusando actualmente</h5>
                        <table className='table table-dark table-striped-columns table-hover'>
                            <thead>
                                <tr>
                                    <th>curso</th>
                                    <th>docente</th>
                                </tr>
                            </thead>
                            <tbody>
                            {cursos.map((c, index)=>(
                                c.cohorte === añoActual?
                                <tr key={index} onClick={() => !llamoTutor && entrarEnCurso(c)} style={{cursor: llamoTutor ? 'default' : 'pointer'}} className={llamoTutor ? "" : "hover-shadow-sm transition-all"} title={llamoTutor ? "" : "Ingresar al curso"}>
                                    {/*mostrar nombre del curso segun la sala si c.nombre_espacio contiene la palabra años poner formacion general */}
                                    <td className='small'>
                                        {mostrarNombre(c.orden)} -{
                                            c.nombre_espacio.toLowerCase().includes('años')
                                            ? 'Docentes de sala'
                                            : c.nombre_espacio
                                        } {c.estado==='Abierto'?<i className="fa-solid fa-lock-open text-success"></i>:<i className="fa-solid fa-lock text-danger"></i>}
                                    </td>
                                    <td><DocentesCurso curso={c.id_curso_grupo} /></td>
                                </tr>
                                :''
                            ))}
                            </tbody>
                        </table>
                    </div>
                    }
                    </>
                    :<div className='container m-3'><Espera visible={espera} /></div>}

                </div>
                <div className='col-12 col-sm-3'>
                        <h6 className='card shadow mt-2 p-2'>clases hoy</h6>
                        <EspaciosHoy dia={dia}/>
                </div>
                <div className='col-12 col-sm-3'>
                    <div className='mt-2'>
                       <CalendarioResumenEventos userId={userId} rol={rol} eventos={eventos} />
                    </div>
                </div>
            </div>

           {/* Modal controlado por React */}
            {showModal && (
                <>
                {/* Fondo oscuro */}
                <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} ></div>
                {/* Modal */}
                <div className="modal fade show d-block" role="dialog" style={{ zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content px-3 pt-3">
                            
                                <div className='alert alert-warning'>
                                    <h5 className="modal-title">Atención</h5>
                                    <p>No tenés un tutor vinculado todavía.</p>
                                    <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={()=>setShowModal(false)}>
                                    Cerrar
                                    </button>
                                </div>
                        </div>
                    </div>
                </div>
                </>
            )}

        </div>
     );
}

export default PrincipalEstudiante;