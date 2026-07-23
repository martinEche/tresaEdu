import './css/Cursos.css';
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { useEffect , useState} from "react";
import Espera from '../Espera';
import { QRCodeSVG } from 'qrcode.react'; // Importa la biblioteca QR Code
import CONFIG from '../../config';
import PerfilLogo from '../usuarios/PerfilLogo';
import MostrarEnMuro from './MostrarEnMuro';
import { show_alerta } from '../../funciones.js';

const URL  = `${CONFIG.API_URL}/operarCursos.php`;
const URL_MURO  = `${CONFIG.API_URL}/operarRegistros.php`;
const URL_PLATAFORMA =`${CONFIG.BASE_URL}`;

function MiCurso({acceder, rol, configuracion}) {
    const { idMC } = useParams();
    const navigate = useNavigate();
    const loggeduserCursoGrupoO =JSON.parse(localStorage.getItem('loggeduserCursoGrupoO'));
    const loggeduserClasesCurso =localStorage.getItem('loggeduserClasesCurso');
    const loggedUserId =JSON.parse(localStorage.getItem('loggedUserId'));

    const [curso, setCurso] = useState(loggeduserCursoGrupoO);
    const [clases, setClases] = useState([]);
    const [registros, setRegistros] = useState([]);

    const [espera, setEspera] = useState(false);

    const [mostrarModalQR, setMostrarModalQR] = useState(false);
    //manejo de acordeones del muro
    const [mostrarInscripcion, setMostrarInscripcion] = useState(false);
    const [mostrarRegistrados, setMostrarRegistrados] = useState(false);

    const loggeduserCurso =localStorage.getItem('loggeduserCurso');
    const loggeduserCursoGrupo =localStorage.getItem('loggeduserCursoGrupo');

    // Estados para la presentación del equipo docente
    const [presentacion, setPresentacion] = useState(curso?.presentacion || '');
    const [editandoPresentacion, setEditandoPresentacion] = useState(false);
    const [tempPresentacion, setTempPresentacion] = useState('');

    const [tieneRubrica, setTieneRubrica] = useState(false);

    const esDocenteOAdmin = rol == 6 || rol == 5 || rol <= 4;

    const fetchCursoDetalle = async () => {
        try {
            const res = await axios.post(URL, { id_curso_grupo: loggeduserCursoGrupo, modo: 'buscarCursoID' });
            if (res.data && !res.data.error) {
                setCurso(res.data);
                setPresentacion(res.data.presentacion || '');
                localStorage.setItem('loggeduserCursoGrupoO', JSON.stringify(res.data));
            }
        } catch (err) {
            console.error("Error al obtener detalle del curso:", err);
        }
    };

    const guardarPresentacion = async () => {
        try {
            setEspera(true);
            const res = await axios.post(URL, {
                id_curso_grupo: loggeduserCursoGrupo,
                presentacion: tempPresentacion,
                modo: 'guardarPresentacion'
            });
            setEspera(false);
            if (res.data && res.data.success) {
                setPresentacion(tempPresentacion);
                setEditandoPresentacion(false);
                const cursoActualizado = { ...curso, presentacion: tempPresentacion };
                setCurso(cursoActualizado);
                localStorage.setItem('loggeduserCursoGrupoO', JSON.stringify(cursoActualizado));
                show_alerta('Presentación guardada correctamente', 'success');
            } else {
                show_alerta(res.data?.msg || 'Error al guardar la presentación', 'error');
            }
        } catch (err) {
            setEspera(false);
            console.error(err);
            show_alerta('Error al guardar la presentación', 'error');
        }
    };
    
    
    const data= {
        'id_curso' : idMC,
        'id_grupo' : loggeduserCursoGrupo,
        'modo': 'buscarClasesCursoUsuario'
    }
    
    useEffect(() => {
        
        if(acceder){
            if((rol===null) || (rol<5)){
                navigate("/");
            }else{
                //si no tiene codigo inscripcion lo generao
                curso.codigo_inscripcion === ''&& generarQRCode(curso.id_curso_grupo);
                buscarRegistrosCurso();
                fetchCursoDetalle();
                if(idMC!==loggeduserCurso){
                    navigate(`/principal`);
                }
            }
        }else{
            localStorage.clear();
            navigate('/');
        }
        // Verificar si hay rúbricas cargadas
        const checkRubricas = async () => {
            try {
                const timestamp = new Date().getTime();
                const res = await axios.get(`${CONFIG.API_URL}/operarRubricas.php?id_curso_grupo=${loggeduserCursoGrupo}&t=${timestamp}`);
                if (Array.isArray(res.data) && res.data.length > 0) {
                    setTieneRubrica(true);
                }
            } catch (error) {
                console.error("Error verificando rúbricas:", error);
            }
        };
        checkRubricas();
    }, []);
    
    const buscarRegistrosCurso = () =>{
        setEspera(true);
        axios.get(`${URL_MURO}?id_curso_grupo=${loggeduserCursoGrupo}`)
        .then(res =>{
            //console.log("registros:"+JSON.stringify(res.data));
            if(!res.data.error){   
                setRegistros(res.data.registros);
            }else{
                setRegistros([]);
            }
            setEspera(false);           
        })
        .catch(err=>{
            console.log(err);
        })   

    }
    const buscaClasesCurso =  (d) =>{
        setEspera(true);
        axios.post(URL, d)
        .then(res =>{
          //  console.log("cursoooo:"+JSON.stringify(res.data));
            if(!res.data.error){   
                //setCurso(res.data.curso);
                setClases(res.data.sort((a, b) => b.id - a.id))
                localStorage.setItem('loggeduserClasesCurso',  JSON.stringify(res.data));
                
               //console.log("cursos:"+curso);
            }else{
               // setCurso([]);
                setClases([]);
            }
            setEspera(false);           
        })
        .catch(err=>{
            console.log(err);
        })   
    }

    const generarQRCode = async (id_curso_grupo) => {
        const data = {
            id_curso_grupo: id_curso_grupo,
            modo:'generarCodigoInscripcion'
        };
        try {
            const res = await axios.post(URL, data)
            const [tipo, msj, codigo] = res.data;
            if (tipo === 'success') {
             //   obtenerDatosCursos();
             //   setQrCode(codigo)
             curso.codigo_inscripcion=codigo;
             console.log(curso.codigo_inscripcion)
            }
        } catch (err) {
            //show_alerta('Error en la solicitud', 'error');
        }
    };
    const formatearFechaCompleta = (fechaString) =>{
        if (!fechaString) return '';

        const fecha = new Date(fechaString.replace(" ", "T"));
        const opcionesFecha = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        const opcionesHora = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };

        // Función para capitalizar la primera letra
        const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

        const fechaFormateada = fecha.toLocaleDateString('es-AR', opcionesFecha);
        const horaFormateada = fecha.toLocaleTimeString('es-AR', opcionesHora);

      return `${capitalizar(fechaFormateada)} ${horaFormateada}hs`;
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
    return ( 
        <div className="container-principal"> 
            <div className='contenedor-micurso'>
                <div className="portada-curso-premium" style={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: '150px', 
                    borderRadius: '12px 12px 0 0', 
                    overflow: 'hidden', 
                    border: `1px solid ${configuracion.color_secundario}` 
                }}>
                    <img 
                        src={`${CONFIG.API_URL}/${
                            curso.imagen_grupo_curso?.trim() || 
                            curso.imagen?.trim() || 
                            curso.imagen_general?.trim() || 
                            curso.caratula_formacion?.trim() || 
                            `img/${configuracion.imagen_fondo}`
                        }`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt='imagen-decorativa'
                    />    
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: '16px 20px',
                        color: '#ffffff',
                        zIndex: 10
                    }}>
                        <div className="d-flex justify-content-between align-items-end">
                            <div>
                                <h3 className="m-0 fw-bold" style={{ fontSize: '1.4rem', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
                                    {curso.tipo_formacion != 7 ? (
                                        <>
                                            <span style={{ fontSize: '1.1rem', fontWeight: '400', opacity: 0.85 }}>{mostrarNombre(curso.orden)} | </span> 
                                            {curso.nombre.toLowerCase().includes('años') ? 'General' : curso.nombre_espacio}
                                        </>
                                    ) : ' '}
                                </h3>
                                <h4 className="m-0 fw-semibold mt-1" style={{ fontSize: '0.95rem', color: '#e9ecef', opacity: 0.9, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                                    Grupo {curso.denominacion}
                                </h4>
                            </div>
                            <div className="d-flex flex-column align-items-end gap-2">
                                <span className="badge px-2 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', fontSize: '0.7rem' }}>
                                    ID: {curso.id}-{curso.id_curso_grupo}
                                </span>
                                {tieneRubrica && (
                                    <span 
                                        className="badge bg-success px-2 py-1 hover-shadow" 
                                        style={{ fontSize: '0.7rem', cursor: 'pointer' }} 
                                        title="Ir a rúbricas de evaluación"
                                        onClick={() => navigate(`/MC/${curso.id}/l`, { state: { ver: 'rubrica' } })}
                                    >
                                        <i className="fa-solid fa-square-poll-vertical me-1"></i> Rúbrica
                                    </span>
                                )}
                                {(rol == 6 || rol == 5) && (
                                    <button
                                        className="btn btn-sm text-white p-1 d-flex align-items-center justify-content-center"
                                        onClick={() => setMostrarModalQR(true)}
                                        title="Código de inscripción"
                                        type="button"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', width: '32px', height: '32px', borderRadius: '50%', border: 'none' }}
                                    >
                                        <i className="fa-solid fa-qrcode" style={{ fontSize: '0.9rem' }}></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Planificacion */}
                <div className='row mb-2'>
                    <div className='col-12'>
                        {rol==1 && 
                            <button 
                                type='button' 
                                className='btn-csi2' 
                                onClick={() => navigate(`/MC/${curso.id}/IA/${curso.id_curso_grupo}`)}
                               style={{
                                    '--btn-bg': configuracion.color_terciario,
                                    '--btn-border': configuracion.color_secundario,
                                    '--btn-color': configuracion.color_secundario,
                                }}
                            >
                                <i className="fa-solid fa-brain"></i> Generador de Plan de Curso asistido con IA
                            </button>
                        }
                        <button 
                            className="btn-csi2"
                            type="button" onClick={() => navigate(`/MC/${curso.id}/P/${curso.id_curso_grupo}`)}
                            style={{
                                '--btn-bg': configuracion.color_terciario,
                                '--btn-border': configuracion.color_secundario,
                                '--btn-color': configuracion.color_secundario,
                            }} 
                        >
                            <i className="fa-solid fa-list-check"></i> Planificacion
                        </button>
                    </div>
                </div>
                
                {/* REGISTROS DE INSCRIPCIÓN (ESTUDIANTES) PEGADO A PLANIFICACIÓN */}
                {!espera && registros.filter(r => r.area === 'Inscripción').length > 0 && (
                    <div className="custom-acordeon mb-3">
                        <div
                            className="custom-acordeon-header"
                            onClick={() => setMostrarRegistrados(!mostrarRegistrados)}
                        >
                            <span>
                                <i className="fa-solid fa-user-graduate me-2"></i>
                                Estudiantes registrados ({registros.filter(r => r.area === 'Inscripción').length})
                            </span>
                            <i className={`fa-solid fa-chevron-${mostrarRegistrados ? 'up' : 'down'}`}></i>
                        </div>
                        {mostrarRegistrados && (
                            <div className="custom-acordeon-body">
                                {registros
                                    .filter(reg => reg.area === 'Inscripción')
                                    .map((reg) => (
                                        <div
                                            key={reg.id}
                                            className='text-secondary-emphasis bg-light-subtle border border-secondary-subtle rounded-3 shadow-sm p-1 px-2 mb-2'
                                        >
                                            <div className='row mx-1 mb-2'>
                                                {reg.creado_por != 0 &&
                                                    <PerfilLogo
                                                        id={reg.creado_por}
                                                        configuracion={configuracion}
                                                        version={'muro'}
                                                    />
                                                }
                                                <span className='text-secondary text-lowercase fs-7'>
                                                    {formatearFechaCompleta(reg.fecha)}
                                                </span>
                                            </div>
                                            <div className='small'>
                                                <i className="text-success px-2 fa-solid fa-user-graduate"></i>
                                                {reg.detalle}
                                            </div>
                                            <div className='d-flex justify-content-start mb-2'>
                                                <PerfilLogo
                                                    id={reg.idElemento}
                                                    configuracion={configuracion}
                                                    version={'muro'}
                                                />
                                            </div>
                                        </div>
                                ))}
                                <div
                                    className="custom-acordeon-footer"
                                    onClick={() => setMostrarRegistrados(false)}
                                >
                                    <i className="fa-solid fa-chevron-up me-2"></i>
                                    Cerrar listado
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="d-grid gap-2 mt-2 mb-4">
                    {!espera ? 
                    <>
                    <div className='alert alert-info py-3 shadow-sm'>
                        <div className="d-flex justify-content-between align-items-center mb-2 border-bottom border-info border-opacity-25 pb-2">
                            <span className="fw-bold fs-5">
                                <i className="fa-solid fa-chalkboard-user me-2 text-primary opacity-75"></i>
                                Bienvenido/a {curso.orden.startsWith('S') ? 'a la Sala de ' : 'al curso'} {curso.nombre}
                            </span>
                            {esDocenteOAdmin && !editandoPresentacion && (
                                <button 
                                    className="btn btn-sm btn-outline-info border-0 rounded-circle"
                                    onClick={() => {
                                        setTempPresentacion(presentacion);
                                        setEditandoPresentacion(true);
                                    }}
                                    title="Editar presentación"
                                    type="button"
                                >
                                    <i className="fa-solid fa-pencil"></i>
                                </button>
                            )}
                        </div>
                        
                        <div className="mt-2 text-dark">
                            {editandoPresentacion ? (
                                <div>
                                    <textarea
                                        className="form-control mb-2 rounded-3 border-info border-opacity-50"
                                        rows="3"
                                        value={tempPresentacion}
                                        onChange={(e) => setTempPresentacion(e.target.value)}
                                        placeholder="Escribe aquí la presentación para los estudiantes..."
                                    />
                                    <div className="d-flex gap-2 justify-content-end mt-2">
                                        <button 
                                            className="btn btn-sm btn-secondary rounded-pill px-3"
                                            onClick={() => setEditandoPresentacion(false)}
                                            type="button"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-primary rounded-pill px-3"
                                            onClick={guardarPresentacion}
                                            type="button"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="mb-0 style-presentation-text" style={{ whiteSpace: 'pre-line', fontSize: '1rem', lineHeight: '1.6' }}>
                                    {presentacion.trim() ? presentacion : (
                                        <em className="text-muted" style={{opacity: 0.8}}>Aún no se ha cargado una presentación para este curso.</em>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>

                        {registros.length===0 && <div className='card p-2 mb-2'>No hay actividad  en el muro</div>}

                        {registros.length > 0 && (
                        <>
                            {/* RESTO DEL MURO */}
                            {registros
                                .filter(reg => reg.area !== 'Inscripción')
                                .map((reg) => (
                                    <div
                                        key={reg.id}
                                        className='text-secondary-emphasis bg-light-subtle border border-secondary-subtle rounded-3 shadow-sm p-1 px-2 mb-1'
                                    >
                                        <div className='row mx-1 mb-2'>
                                            {reg.creado_por != 0 &&
                                                <PerfilLogo
                                                    id={reg.creado_por}
                                                    configuracion={configuracion}
                                                    version={'muro'}
                                                />
                                            }

                                            <div>
                                                <span className='text-secondary text-lowercase fs-7'>
                                                    {formatearFechaCompleta(reg.fecha)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className='row'>
                                            <div className='col-12'>
                                                <h6
                                                    className="px-4 hacer-link"
                                                    onClick={() => {
                                                        if (reg.area === 'Actividad') {
                                                            navigate(`/MC/${curso.id}/a/${reg.idElemento}`);
                                                        } else {
                                                            navigate(`/MC/${curso.id}/c/${reg.idElemento}`);
                                                        }
                                                    }}
                                                >
                                                    <MostrarEnMuro
                                                        area={reg.area}
                                                        detalle={reg.detalle}
                                                        idElemento={reg.idElemento}
                                                    />
                                                </h6>
                                            </div>
                                        </div>
                                    </div>
                            ))}
                        </>
                    )}
                    </>
                        : <div className='container m-3'><Espera visible={espera} /></div>
                        }               
                </div>
            </div>
            {/*Modal QR*/}
            {mostrarModalQR && (
            <div
                className="modal-qr-overlay"
                onClick={() => setMostrarModalQR(false)}
            >

                <div
                    className="modal-qr-content"
                    onClick={(e) => e.stopPropagation()}
                >

                    <button
                        className="cerrar-modal-qr"
                        onClick={() => setMostrarModalQR(false)}
                    >
                        ✕
                    </button>

                    <h4 className="mb-3">
                        <i className="fa-solid fa-qrcode me-2"></i>
                        Código de inscripción
                    </h4>

                    <div className="d-flex justify-content-center mb-3">
                        <QRCodeSVG
                            value={`${URL_PLATAFORMA}inscripcion/${curso.codigo_inscripcion}`}
                            size={180}
                        />
                    </div>

                    <h3 className="text-center mb-3">
                        {curso.codigo_inscripcion}
                    </h3>

                    <p className="small text-secondary">
                        <strong>Este código de inscripción alfanumérico </strong>
                        será requerido cuando se realiza la inscripción
                        a la plataforma de manera auto asistida.
                    </p>

                </div>
            </div>
        )}
        </div> 
    );
}

export default MiCurso;