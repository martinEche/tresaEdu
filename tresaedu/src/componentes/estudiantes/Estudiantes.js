import './css/estudiantes.css';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Espera from '../Espera';
import PerfilLogo from '../usuarios/PerfilLogo.js';
import { Link, useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { show_alerta } from '../../funciones.js';

import CONFIG from '../../config';
import MostrarEncabezadoInstancias from './MostrarEncabezadoInstancias.js';
import MostrarEncabezadosActividades from './MostrarEncabezadosActividades.js';

import EstadisticaAsistencia from './EstadisticaAsistencia.js';
import GraficoAsistencia from './GraficoAsistencia.js';
import VerEntrega from './VerEntrega.js';
import InformeValoracion from './InformeValoracion.js';
import CalendarioAsistencia from './CalendarioAsistencia.js';

const URL = `${CONFIG.API_URL}/operarEstudiantes.php`;
const URL_CALIFICACIONES = `${CONFIG.API_URL}/operarValoraciones.php`;
const URL_ASISTENCIA = `${CONFIG.API_URL}/operarAsistencia.php`;
const URL_ACTIVIDADES = `${CONFIG.API_URL}/operarActividades.php`;

function Estudiantes({ acceder, rol, configuracion }) {
    const [estudiantes, setEstudiantes] = useState([]);
    // para  acordeon de equipo docente
    const [equipoDocente, setEquipoDocente] = useState([]);
    const [abierto, setAbierto] = useState(false); //para el acordeon de docentes
    const toggleAccordion = () => {
        setAbierto(!abierto);
    };
    //fin variables acordeon equipo docente

    const [valoraciones, setValoraciones] = useState([]); // para traer las Valoraciones de la BD
    const [colInstancias, setColInstancias] = useState([]); // para traer las instancias de evaluacion de la BD

    const [asistencia, setAsistencia] = useState([]); //para trar la asistencia por fecha de la BD
    const [asistenciaAnual, setAsistenciaAnual] = useState([]); //para trar la asistencia anual de la BD

    const [actividades, setActividades] = useState([]); //para trar la asistencia de la BD

    const [formValues, setFormValues] = useState({}); // Para almacenar los valores seleccionados de los select notas
    const [formValuesAsistencia, setFormValuesAsistencia] = useState({}); // Para almacenar los valores seleccionados de los select asistencia

    const [visible, setVisible] = useState(false);
    const rolNum = Number(rol);

    const [vista, setVista] = useState(
        (rolNum === 5 || rolNum === 6 || rolNum === 9) 
            ? 'asistencia' 
            : 'calificaciones'
    );
    const [fechaHoy, setFechaHoy] = useState(() =>
    new Date().toLocaleDateString('sv-SE')
    );

    const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaHoy);
    
    const navigate = useNavigate();
    const loggeduserCurso = localStorage.getItem('loggeduserCurso');
    const loggeduserCursoGrupo = localStorage.getItem('loggeduserCursoGrupo');
    const loggeduserId = localStorage.getItem('loggedUserId');

    const [entregaSeleccionada, setEntregaSeleccionada] = useState(null);
    const [verEditarInforme, setVerEditarInforme] = useState({ instancia:null, estudiante:null, editar:null });
    const [verCalendarioAsistenciaCargada, setVerCalendarioAsistenciaCargada] = useState(false);

    // ejemplo: fechas donde ya cargaste asistencia
    const [fechasConAsistencia, setFechasConAsistencia] = useState([]);

    useEffect(() => {
        if (acceder) {
            if (rol === null) {
                navigate("/");
            } else {  
                const data = {
                    'id_curso': loggeduserCurso,
                    'id_grupo': loggeduserCursoGrupo,
                    'modo': 'buscarEstudiantesCurso'
                };
                obtenerEstudiantesyValoraciones(data);
                obtenerAsistencia();
                obtenerActividades();
            }
        } else {
            localStorage.clear();
            navigate('/');
        }                   
    }, [acceder, rol, navigate, loggeduserCurso, loggeduserCursoGrupo]);

    useEffect(() => {
        if (vista === 'asistencia') {
            obtenerAsistencia();
            setFormValuesAsistencia({}); // Limpia los selects
        }
    }, [fechaSeleccionada, vista]);

    //funcion para  poner todos los estudiantes conpresente antes de guardar
    const marcarTodosComoPresentes = () => {
        const nuevosValores = { ...formValuesAsistencia };

        estudiantes.forEach(est => {
            const yaTieneAsistencia = asistencia.find(a => a.id_usuario === est.id && a.fecha === fechaSeleccionada);
            if (!yaTieneAsistencia) {
                nuevosValores[`${est.id}_`] = {
                    id_usuario: est.id,
                    valor: 'Presente'
                };
            }
        });
        setFormValuesAsistencia(nuevosValores);
    };

    //funcion para obtener los estudiantes y sus valoraciones
    const obtenerEstudiantesyValoraciones = (dato) => {
        setVisible(true);
        axios.post(URL, dato)
        .then(res => {
            if (!res.data.error) {
                console.log("estudiantes:",res.data.valoraciones); 
                setEstudiantes(res.data.estudiantes);
                setValoraciones(res.data.valoraciones);
                if (res.data.equipo_docente) {
                    setEquipoDocente(res.data.equipo_docente);
                }else{
                    setEquipoDocente([]);
                }
            } else {
                setEstudiantes([]);
                setValoraciones([]);
                setEquipoDocente([]);
            }
            setVisible(false);
        })
        .catch(err => {
            console.log(err);
        });
    }

    //funcion para obtener la asistencia 
    const obtenerAsistencia = () => {
        const dataAsistencia = {
            modo: 'obtenerAsistencia',
            fecha: fechaSeleccionada,
            curso: loggeduserCursoGrupo
        };
        axios.post(URL_ASISTENCIA, dataAsistencia)
        .then(res => {
            if (!res.data.error) {
                console.log('asis:'+JSON.stringify(res.data));
                setAsistencia(res.data.asistencias);
                setAsistenciaAnual(res.data.asistencias_anual);
                const fechasUnicas = [...new Set(res.data.asistencias_anual.map(a => a.fecha))];
                setFechasConAsistencia(fechasUnicas);
            } else {
                setAsistencia([]);
                setAsistenciaAnual([]);
            }
        })
        .catch(err => {
            console.error('Error al obtener asistencia:', err);
        });
    }

    //funcion para obtener las actividades 
    const obtenerActividades = () => {
       
        axios.get(`${URL_ACTIVIDADES}?id_curso_grupo=${loggeduserCursoGrupo}&rol=${rol}`)
        .then(res => {
            if(res.data.success){
                let acts = res.data.actividades || [];
                
                axios.get(`${CONFIG.API_URL}/operarCuestionario.php?modo=listarResultadosGrupo&id_curso_grupo=${loggeduserCursoGrupo}`)
                .then(resC => {
                    if (resC.data.success && resC.data.cuestionarios) {
                        acts = acts.concat(resC.data.cuestionarios);
                    }
                    setActividades(acts);
                })
                .catch(err => {
                    console.error('Error al obtener cuestionarios:', err);
                    setActividades(acts);
                });
            } else {
                setActividades([]);
            }
        })
        .catch(err => {
            console.error('Error al obtener actividades:', err);
        });
    }

    // Función para manejar el cambio de vista
    const handleVistaChange = (nuevaVista) => {
        setVista(nuevaVista);
    }

    
    const eliminarEstudiante = (id) =>{
        const MySwal= withReactContent(Swal); 
        MySwal.fire({
            title: '¿Seguro de Quitar al/la estudiante de la clase?',
            icon: 'warning', 
            html: '<span class=\"text-muted\">si desea volvera ingresarlo lo debera hacer el administrador</span>',
            showCancelButton: true, confirmButtonText: '<i class="fa-solid fa-trash-can"></i> Si, eliminar', cancelButtonText: 'Cancelar',
            customClass: {
                confirmButton: 'btn btn-danger mx-2 shadow-sm',
                cancelButton: 'btn btn-outline-secondary mx-2',
                popup: 'rounded-4 shadow'
            },
            buttonsStyling: false
        })
        .then(res=>{
            if(res.isConfirmed){
                enviarSolicitud('DELETE',{'id':id,'id_grupo': loggeduserCursoGrupo,'modo': 'eliminarEstudiante'})
            }
        });
    };

    const enviarSolicitud = async (metodo, parametros) =>{
        setVisible(true);
        await axios({method:metodo, url:URL, data:parametros})
            .then(res => {
                if (!res.data.error) {
                    // Filtra al estudiante eliminado de la lista
                    setEstudiantes(estudiantes.filter(e => e.id !== parametros.id));
                    console.log("resdataEstudiantes:",res.data);
                    var tipo = res.data[0];
                    var msj = res.data[1];
                    show_alerta(msj,tipo);    
                } else {
                    alert('Error al eliminar al estudiante');
                }
                setVisible(false);
            })
            .catch(err => {
                show_alerta('Error en la solicitud ','error');
                console.log(err);
                setVisible(false);
            });
    };
    
    // Manejar cambios en los select de notas
    const handleSelectChange = (idUsuario, idInstancia, idCurso, valor) => {
        console.log('usuario:'+idUsuario+'instancia:'+idInstancia+'curso:'+idCurso+'valor:'+valor);
        setFormValues((prev) => ({
            ...prev,
            [`${idUsuario}_${idInstancia}_${idCurso}`]: { id_usuario: idUsuario, id_instancia: idInstancia, id_curso: idCurso, valor: valor }
        }));
    };

    // Manejar cambios en los select de asistencia
    const handleSelectInasistenciaChange = (idUsuario, valor) => {
        //console.log('usuario:'+idUsuario+' valor:'+valor);
        setFormValuesAsistencia((prev) => ({
            ...prev,
            [`${idUsuario}_`]: { id_usuario: idUsuario, valor: valor }
        }));
    };

    // Enviar valores al backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        if(vista==='calificaciones'){ 
            const data = Object.values(formValues);

            if (data.length === 0) {
                Swal.fire('Error', 'No hay cambios que guardar', 'error');
                return;
            }
        
            const response = await axios.post(URL_CALIFICACIONES, { 'modo': 'guardarValoraciones','valoraciones': data });
            console.log(response.data);
            if (!response.data.error) {
                Swal.fire('Éxito', 'Calificaciones guardadas', 'success');
                setValoraciones((prev) =>
                    prev.map((v) =>
                        data.find((d) => d.id_usuario === v.id_usuario && d.id_instancia === v.id_instancia)
                            ? { ...v, ...data.find((d) => d.id_usuario === v.id_usuario && d.id_instancia === v.id_instancia) }
                            : v
                    )
                );
            } else {
                Swal.fire('Error', response.data.message, 'error');
            }
        }
        if(vista==='asistencia'){ 
             const data = Object.values(formValuesAsistencia);

            if (data.length === 0) {
                Swal.fire('Error', 'No hay cambios que guardar', 'error');
                return;
            }
            //console.log('data:'+JSON.stringify(data));
            const response = await axios.post(URL_ASISTENCIA, { 'modo': 'guardarAsistencia', 'fecha':fechaSeleccionada, 'curso':loggeduserCursoGrupo, 'responsable':loggeduserId, 'valores': data });
            console.log('Asistencia:'+response.data);
            if (!response.data.error) {
                Swal.fire('Éxito', 'Asistencia guardad', 'success');
                setAsistencia((prev) =>
                    prev.map((asis) =>
                        data.find((d) => d.id_usuario === asis.id_usuario && d.fecha === asis.fecha && d.curso === asis.curso)
                            ? { ...asis, ...data.find((d) => d.id_usuario === asis.id_usuario && d.id_instancia === asis.fecha && d.curso === asis.curso) }
                            : asis
                    )
                );
                obtenerAsistencia();
            } else {
                Swal.fire('Error', response.data.message, 'error');
            }            
        }
    };


    return (
    <>
        <div className="container-principal">
            <small>curso: #{loggeduserCurso}</small><small>curso_grupo: #{loggeduserCursoGrupo}</small>            
            <div className="accordion accordion-flush mb-2">
                <div className="accordion-item">
                    <h2 className="accordion-header">
                        <button
                            className={`bg-primary-subtle border border-primary-subtle accordion-button ${!abierto ? "collapsed" : ""}`}
                            type="button"
                            onClick={toggleAccordion}
                        >
                            <span className='estudiantes-titulo'>Equipo Docente</span>
                            <span className='small'>
                                ({equipoDocente.length === 1
                                ? `${equipoDocente.length} docente`
                                : `${equipoDocente.length} docentes`}
                                )
                            </span>
                        </button>
                    </h2>
                    <div className={`accordion-collapse collapse ${abierto ? "show" : ""}`}>
                        <div className="accordion-body">
                            <table className="table">
                                <tbody>
                                    {equipoDocente.map((est) => (
                                    <tr key={est.id}>
                                        <td className="col-sm-5 col-12">
                                            <PerfilLogo usuario={est} version="extendida" configuracion={configuracion} />
                                        </td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <h3 className='estudiantes-titulo'>Estudiantes
                {rol == 1 && 
                <button type='button' className='btn btn-outline-info btn-sm'>
                    + <i className="fa-solid fa-graduation-cap"></i>
                </button>
                }
            </h3>
            <h5 className='estudiantes-titulo2'>
                {estudiantes.length ===1?`${estudiantes.length} estudiante`:`${estudiantes.length} estudiantes` } 
            </h5>
            {/* rol docente */}   
            {/* selector de pestañas (calificaciones|asistencia|actividades) solo para docentes y directivos */}
            {(rol == 6 || rol == 5 || rol == "6" || rol == "5" || rol == 9 || rol == "9") &&
                <div className='row'>
                    <div className="col-12">
                        <ul className="nav nav-tabs justify-content-end">
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${vista === 'calificaciones' ? 'active' : ''}`} 
                                    onClick={() => handleVistaChange('calificaciones')}
                                >
                                    Calificaciones
                                </button>
                            </li>
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${vista === 'asistencia' ? 'active' : ''}`} 
                                    onClick={() => handleVistaChange('asistencia')}
                                >
                                    Asistencia
                                </button>
                            </li>
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${vista === 'actividades' ? 'active' : ''}`} 
                                    onClick={() => handleVistaChange('actividades')}
                                >
                                    Actividades
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            }

            {!visible ? 
                <>
                {estudiantes.length > 0 ? (
                    <form onSubmit={handleSubmit}>
                        
                        <table className="table">
                            <thead>
                            {vista === 'asistencia' &&
                                <tr>
                                    <th colSpan={4}><EstadisticaAsistencia asistencia={asistencia} fechaSeleccionada={fechaSeleccionada}/></th>
                                </tr>
                            }
                            {(rol === 7|| rol ===8 || rol === "7" || rol === "8") &&
                                <tr>
                                    <th colSpan={3}><EstadisticaAsistencia id_usuario={loggeduserId} asistencia={asistencia} fechaSeleccionada={fechaSeleccionada}/></th>
                                </tr>
                            }
                                <tr>
                                    <th>Estudiante/s curso</th>
                                   
                                {(rol == 6 || rol == 5 || rol == "6" || rol == "5" || rol == 9 || rol == "9") && 
                                <>
                                    {vista === 'calificaciones' && (
                                        <MostrarEncabezadoInstancias
                                            curso={loggeduserCurso}
                                            setColInstancias={setColInstancias}
                                        />
                                    )}
                                        
                                    {vista === 'asistencia' && (
                                        <>
                                        <th>
                                            <div className='d-flex justify-content-center'>
                                                <div>          
                                                   {verCalendarioAsistenciaCargada ? (
                                                        <div>
                                                            <CalendarioAsistencia 
                                                            fechasConAsistencia={fechasConAsistencia}
                                                             fechaSeleccionada={fechaSeleccionada}
                                                             setFechaSeleccionada={setFechaSeleccionada}
                                                             />
                                                            
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-secondary mt-2"
                                                                onClick={() => setVerCalendarioAsistenciaCargada(false)}
                                                            >
                                                                Ocultar asistencia cargada
                                                            </button>

                                                        </div>
                                                    ):(
                                                        <button 
                                                            type="button"
                                                            className="btn btn-outline-primary"
                                                            onClick={() => setVerCalendarioAsistenciaCargada(true)}
                                                        >
                                                            Ver asistencia cargada
                                                        </button>
                                                    )}
                                                </div>
                                                <input
                                                    type="date"
                                                    className="form-control form-control-sm me-1"
                                                    value={fechaSeleccionada}
                                                    onChange={(e) => setFechaSeleccionada(e.target.value)}
                                                    max={fechaHoy}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-success btn-sm"
                                                    onClick={marcarTodosComoPresentes}
                                                >
                                                Marcar todos Presentes
                                                </button>
                                            </div>
                                        </th>
                                        <th className='text-center'><i className='fa-solid fa-chart-pie'></i></th> 
                                        </>
                                    )}    
                                        
                                    {vista === 'actividades' && (
                                        <MostrarEncabezadosActividades
                                            actividades={actividades}
                                        />
                                    )}
                                </>}
                                    {(rol == 6 || rol == 5 || rol == "6" || rol == "5" || rol == 9 || rol == "9") &&
                                    <th className="col-sm-3 col-12 estudiante-botonera">acc.</th>
                                    }
                                </tr>
                            </thead>
                            <tbody>
                            {/* Listado de estudiantes */}
                            {estudiantes.map((est) => (
                                <tr key={est.id}>
                                    <td className="col-sm-5 col-12">
                                       {(rol!=7 && rol !=8 && rol !=5 && rol !=6)? 
                                            <Link to={ `/VerPerfil/e/${est.id}`} className='decoracion-perfil' >
                                            <PerfilLogo usuario={est} version="extendida" configuracion={configuracion} />
                                            </Link>
                                        :
                                        <>
                                            <PerfilLogo usuario={est} version="extendida" configuracion={configuracion} />
                                        </>
                                        }
                                    </td>
                                {/* calificaciones */}  
                                    {vista === 'calificaciones' &&
                                        colInstancias.map((i, index) => {
                                            const calificacion = valoraciones.find(
                                                (v) => v.id_instancia === i.id && v.id_usuario === est.id && v.id_curso == loggeduserCurso
                                            );
                                            const fechaActual = new Date();
                                            const fechaInicio = new Date(i.fecha_inicio);
                                            const fechaCierre = new Date(i.fecha_cierre);

                                            const esAprobadaOPublicada = calificacion && (calificacion.estado_aprobacion === 'aprobada' || calificacion.estado_aprobacion === 'publicada');
                                            const habilitarInput = (fechaActual >= fechaInicio && fechaActual <= fechaCierre) && !esAprobadaOPublicada;

                                            // Seleccionar el arreglo de opciones basado en el tipo de calificación
                                            let opciones = [];
                                            if (i.tipo_calificacion === 'Valorativa') {
                                                opciones = ['','SC', 'EP', 'S', 'MS', 'Sup'];
                                            } else if (i.tipo_calificacion === 'Numerica') {
                                                opciones = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                                            } else if (i.tipo_calificacion === 'Logro') {
                                                opciones = ['','pendiente', 'Logrado'];
                                            } else if (i.tipo_calificacion === 'Participacion') {
                                                opciones = ['', 'Participo', 'no participo'];
                                            }
                                        return (
                                            <td key={index} className="col text-center">
                                            {(rol == 6 || rol == 5 || rol == "6" || rol == "5") ?
                                            <div className='d-flex justify-content-center align-items-center'>
                                                {!habilitarInput?(calificacion?calificacion.valor:'-'):
                                                    <select
                                                        className={` form-select form-select-sm estudiante-select-${i.tipo_calificacion.toLowerCase()} ${
                                                            calificacion ? 'estudiante-calificado' : ''
                                                        }`}
                                                        disabled={!habilitarInput}
                                                        value={
                                                            calificacion?.valor
                                                        }
                                                        onChange={(e) =>
                                                            handleSelectChange(est.id, i.id, loggeduserCurso, e.target.value)
                                                        }
                                                    >                
                                                    {opciones.map((opcion, idx) => (
                                                            <option key={idx} value={opcion}>
                                                                {opcion}
                                                            </option>
                                                        ))}
                                                    </select>
                                                }
                                                {esAprobadaOPublicada && (
                                                    <span className="ms-1" title={calificacion.estado_aprobacion === 'publicada' ? 'Publicada' : 'Aprobada'}>
                                                        {calificacion.estado_aprobacion === 'publicada' ? 
                                                            <i className="fa-solid fa-bullhorn text-primary" style={{fontSize: '0.85rem'}}></i> : 
                                                            <i className="fa-solid fa-thumbs-up text-success" style={{fontSize: '0.85rem'}}></i>
                                                        }
                                                    </span>
                                                )}
                                                    <button 
                                                        type='button'
                                                        className='btn btn-sm btn-outline-secondary ms-1'
                                                        onClick={() => {
                                                                        setVerEditarInforme({ instancia:i.id, estudiante: est.id, editar:habilitarInput });
                                                                    }}
                                                        data-bs-toggle="modal" 
                                                        data-bs-target="#valoracionModal"
                                                    >
                                                        <i className="fa-regular fa-file-lines"></i>
                                                    </button>
                                            </div>    
                                            : 
                                            <>
                                            {(rol == 9 || rol == "9") &&
                                                <div className='d-flex justify-content-center align-items-center'>
                                                    <span className='estudiante-nota-texto fw-bold'>
                                                        {calificacion !== null && calificacion !== undefined ? calificacion.valor : '-'}
                                                    </span>
                                                    <button 
                                                        type='button'
                                                        className='btn btn-sm btn-outline-secondary ms-2'
                                                        onClick={() => {
                                                            setVerEditarInforme({ instancia:i.id, estudiante: est.id, editar:false });
                                                        }}
                                                        data-bs-toggle="modal" 
                                                        data-bs-target="#valoracionModal"
                                                    >
                                                        <i className="fa-regular fa-file-lines"></i>
                                                    </button>
                                                </div>
                                            }
                                            </>   
                                            }
                                            </td>
                                            );
                                        })
                                    }

                                {/* asistencia */}
                                    {vista === 'asistencia' && ( 
                                        <>
                                        <td className="">
                                                {(rol == 9 || rol == "9") ? (
                                                    <div className="text-center">
                                                        {asistencia.find(a => a.id_usuario === est.id && a.fecha === fechaSeleccionada)?.asistencia || '-'}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <select
                                                            value={
                                                                (formValuesAsistencia[`${est.id}_`]?.valor ??
                                                                asistencia.find(a => a.id_usuario === est.id && a.fecha === fechaSeleccionada)?.asistencia) || ''
                                                            } 
                                                    
                                                            onChange={(e) =>
                                                                handleSelectInasistenciaChange(est.id, e.target.value)
                                                            }
                                                        >
                                                            <option value=""></option>
                                                            <option value="Presente">Presente</option>
                                                            <option value="Ausente">Ausente</option>
                                                            <option value="Tarde">Tarde</option>
                                                        </select>
                                                        {asistencia.find(a => a.id_usuario === est.id && a.fecha === fechaSeleccionada)?<i className="fa-solid fa-check-circle ms-1"></i> : ''}
                                                    </>
                                                )}
                                        </td>
                                        <td><GraficoAsistencia asistenciaAnual={asistenciaAnual} id_usuario={est.id_usuario} /></td>
                                        </>
                                        )
                                    }

                                {/* Actividades */}                                        
                                    {vista === 'actividades' && (
                                            actividades.map((actividad, index) => {
                                                const historialEntregas = actividad.entregas?.filter(e => e.id_estudiante == est.id) || [];
                                                const entregaEstudiante = historialEntregas.length > 0 ? historialEntregas[0] : null;
                                                return (
                                                    <td key={index} className="text-center">
                                                        {entregaEstudiante ? (
                                                            entregaEstudiante.es_cuestionario ? (
                                                                <div className="small">
                                                                    <span className="text-success fw-bold">{Math.round(entregaEstudiante.mejor_acierto * 100)}%</span> / {entregaEstudiante.intentos} int.
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    className="btn btn-success btn-sm"
                                                                    onClick={() => {
                                                                        setEntregaSeleccionada({ entregaEstudiante: entregaEstudiante, historialEntregas: historialEntregas, actividad: actividad });
                                                                    }}
                                                                    data-bs-toggle="modal" 
                                                                    data-bs-target="#exampleModal"
                                                                    >
                                                                    Sí
                                                                </button>
                                                            )
                                                        ) : (
                                                            <span className="text-muted">No</span>
                                                        )}
                                                    </td>
                                                );
                                            })
                                        )
                                    }

                                        <td className="col-sm-3 col-12 estudiante-botonera">
                                            {(rol == 1 || rol == 2 || rol == 3 || rol == 4) && (
                                                <button
                                                    type="button"
                                                    className="btn btn-warning btn-sm"
                                                    onClick={() => eliminarEstudiante(est.id)}
                                                >
                                                    - <i className="fa-solid fa-graduation-cap"></i>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="text-center">
                        {(rol == 6 || rol == 5 || rol == "6" || rol == "5") && (vista != 'actividades') && 
                            <button type="submit" className="btn btn-primary">
                                Guardar {vista}
                            </button>
                        }
                        </div>
                    </form>
                ) : (
                   <div>Sin estudiantes</div>
                )}                    
                </> 
                : <Espera />
            }
        </div>

                        
{/* Modal para ver entregas*/}
        <div className="modal fade" 
        id="exampleModal" 
        aria-labelledby="exampleModalLabel" 
        aria-hidden="true"
        >
        <div className="modal-dialog modal-lg">
            <div className="modal-content">
            <div className="modal-header">
                <h1 className="modal-title fs-6" id="exampleModalLabel"><i className="fa-solid fa-file-lines"></i> Entrega de actividad</h1>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
                {entregaSeleccionada && (
                        <VerEntrega 
                            actividad={entregaSeleccionada.actividad}
                            entregaEstudiante={entregaSeleccionada.entregaEstudiante}
                            historialEntregas={entregaSeleccionada.historialEntregas}
                            rol={rol}
                            onEvaluacionGuardada={() => {
                                obtenerActividades();
                                const btnClose = document.querySelector('#exampleModal .btn-close');
                                if (btnClose) btnClose.click();
                            }}
                        />
                )}
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
            </div>
        </div>
        </div>

{/* Modal para escrivir informe valoracion*/}
        <div className="modal fade" 
        id="valoracionModal" 
        aria-labelledby="valoracionModalLabel" 
        aria-hidden="true"
        >
        <div className="modal-dialog modal-lg">
            <div className="modal-content">
            <div className="modal-header">
                <h1 className="modal-title fs-6" id="valoracionModalLabel"><i className="fa-solid fa-file-lines"></i> Informe de la valoracion</h1>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
                estudiante:{verEditarInforme.estudiante}
                instancia:{verEditarInforme.instancia}
                <InformeValoracion 
                    estudiante={verEditarInforme.estudiante} 
                    instancia={verEditarInforme.instancia}
                    curso={loggeduserCurso}
                    editar={verEditarInforme.editar}
                    rol={rol}
                />
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
            </div>
        </div>
        </div>


    </>
    );
}

export default Estudiantes;