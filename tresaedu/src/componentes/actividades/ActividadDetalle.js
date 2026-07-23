import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CONFIG from '../../config';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Espera from '../Espera';
import { show_alerta } from '../../funciones';

const URL_ENTREGAS = `${CONFIG.API_URL}/operarEntregas.php`;

function ActividadDetalle({ acceder, rol, configuracion }) {
    const { idMC, idAct } = useParams();
    const navigate = useNavigate();
    const idUsuario = localStorage.getItem('loggedUserId');
    const loggeduserCursoGrupo = localStorage.getItem('loggeduserCursoGrupo');

    const [loading, setLoading] = useState(true);
    const [actividad, setActividad] = useState(null);
    const [entrega, setEntrega] = useState(null);
    const [historialEntregas, setHistorialEntregas] = useState([]);
    const [companeros, setCompaneros] = useState([]);
    const [grupoActual, setGrupoActual] = useState([]);
    const [idGrupo, setIdGrupo] = useState(null);
    const [seleccionados, setSeleccionados] = useState([]);

    const [comentario, setComentario] = useState('');
    const [archivo, setArchivo] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!acceder || rol === null) {
            navigate('/');
            return;
        }
        cargarDatos();
    }, [idAct, idUsuario, loggeduserCursoGrupo]);

    const cargarDatos = () => {
        setLoading(true);
        axios.get(`${URL_ENTREGAS}?modo=buscarActividad&id_trabajo=${idAct}&id_estudiante=${idUsuario}&id_curso_grupo=${loggeduserCursoGrupo}`)
            .then(res => {
                console.log("API buscarActividad RESPONSE:", res.data);
                if (!res.data.error) {
                    setActividad(res.data.actividad);
                    setEntrega(res.data.entrega);
                    setHistorialEntregas(res.data.historial_entregas || []);
                    setCompaneros(res.data.companeros_disponibles);
                    setGrupoActual(res.data.grupo_actual);
                    setIdGrupo(res.data.id_grupo);
                }
            })
            .catch(err => {
                console.error(err);
                show_alerta('Error al cargar la actividad', 'error');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleArchivoChange = (e) => {
        setArchivo(e.target.files[0]);
    };

    const handleSeleccionChange = (e, id) => {
        if (e.target.checked) {
            setSeleccionados([...seleccionados, id]);
        } else {
            setSeleccionados(seleccionados.filter(item => item !== id));
        }
    };

    const crearGrupo = () => {
        if (seleccionados.length === 0) {
            show_alerta('Debes seleccionar al menos a un compañero.', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('modo', 'crearGrupo');
        formData.append('id_trabajo', idAct);
        formData.append('id_estudiante', idUsuario);
        formData.append('integrantes', JSON.stringify(seleccionados));

        setLoading(true);
        axios.post(URL_ENTREGAS, formData)
            .then(res => {
                if (!res.data.error) {
                    show_alerta('Grupo creado exitosamente', 'success');
                    cargarDatos();
                } else {
                    show_alerta(res.data.mensaje, 'error');
                }
            })
            .catch(err => {
                console.error(err);
                show_alerta('Error al crear el grupo', 'error');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const enviarActividad = (e) => {
        e.preventDefault();
        
        if (!archivo && !comentario) {
            show_alerta('Debes adjuntar un archivo o enviar un comentario.', 'warning');
            return;
        }

        const MySwal = withReactContent(Swal);
        MySwal.fire({
            title: '¿Confirmar entrega?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, entregar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                const formData = new FormData();
                formData.append('modo', 'entregarActividad');
                formData.append('id_trabajo', idAct);
                formData.append('id_estudiante', idUsuario);
                formData.append('id_grupo', idGrupo);
                formData.append('comentario', comentario);
                if (archivo) {
                    formData.append('adjunto', archivo);
                }

                setLoading(true);
                axios.post(URL_ENTREGAS, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                .then(res => {
                    if (!res.data.error) {
                        show_alerta(res.data.mensaje, 'success');
                        setComentario('');
                        setArchivo(null);
                        cargarDatos();
                    } else {
                        show_alerta(res.data.mensaje, 'error');
                    }
                })
                .catch(err => {
                    console.error(err);
                    show_alerta('Error al entregar la actividad', 'error');
                })
                .finally(() => {
                    setLoading(false);
                });
            }
        });
    };

    if (loading) return <Espera />;
    if (!actividad) return <div className="container-principal container pt-5 mt-4 alert alert-danger">Actividad no encontrada (ID: {idAct})</div>;

    const requiresGroupCreation = actividad.tipo_trabajo === 'grupal' && idGrupo === null && (rol == 7);

    const companerosFiltrados = companeros.filter(comp => 
        comp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        comp.apellido.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container-principal container mt-4">
            <button className="btn btn-secondary mb-3" onClick={() => navigate(`/MC/${idMC}`)}>
                <i className="fa-solid fa-arrow-left me-2"></i> Volver al muro
            </button>
            <div className="card mb-4 shadow-sm">
                <div className="card-header bg-primary text-white">
                    <h4 className="mb-0">{actividad.titulo}</h4>
                </div>
                <div className="card-body">
                    <p className="lead">{actividad.desarrollo}</p>
                    <hr />
                    <div className="row">
                        <div className="col-md-6">
                            <p><i className="fa-regular fa-clock me-2"></i><b>Fecha de entrega máxima:</b> {actividad.fecha_entrega}</p>
                            <p><b>Tipo de trabajo:</b> <span className="badge bg-info">{actividad.tipo_trabajo === 'individual' ? 'Individual' : 'Grupal'}</span></p>
                        </div>
                        <div className="col-md-6">
                            <p><b>Formato de presentación:</b> {actividad.forma_presentacion || 'No especificado'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCION DE GRUPO */}
            {requiresGroupCreation && (
                <div className="card mb-4 shadow-sm border-warning">
                    <div className="card-header bg-warning text-dark">
                        <h5 className="mb-0"><i className="fa-solid fa-users me-2"></i> Formar Grupo</h5>
                    </div>
                    <div className="card-body">
                        <p>Esta es una actividad grupal. Debes formar un grupo seleccionando a tus compañeros disponibles antes de poder entregar.</p>
                        
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <input 
                                type="text" 
                                className="form-control w-50" 
                                placeholder="Buscar compañero por nombre o apellido..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <span className="badge bg-primary fs-6">
                                Seleccionados: {seleccionados.length}
                            </span>
                        </div>

                        {companerosFiltrados.length > 0 ? (
                            <div className="list-group mb-3 border rounded" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {companerosFiltrados.map(comp => (
                                    <label className="list-group-item d-flex gap-2" key={comp.id}>
                                        <input 
                                            className="form-check-input flex-shrink-0" 
                                            type="checkbox" 
                                            value={comp.id} 
                                            checked={seleccionados.includes(comp.id)}
                                            onChange={(e) => handleSeleccionChange(e, comp.id)} 
                                        />
                                        <span>
                                            {comp.nombre} {comp.apellido} <small className="text-muted d-block">{comp.email}</small>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="alert alert-info">No se encontraron compañeros con ese nombre o no hay compañeros disponibles.</div>
                        )}
                        <button className="btn btn-warning" onClick={crearGrupo}>Confirmar Grupo</button>
                    </div>
                </div>
            )}

            {/* INTEGRANTES DEL GRUPO */}
            {actividad.tipo_trabajo === 'grupal' && idGrupo !== null && (
                <div className="card mb-4 shadow-sm">
                    <div className="card-header bg-info text-white">
                        <h6 className="mb-0"><i className="fa-solid fa-users me-2"></i> Tu Grupo</h6>
                    </div>
                    <div className="card-body py-2">
                        <ul className="mb-0 ps-3">
                            {grupoActual.map(int => (
                                <li key={int.id}>{int.nombre} {int.apellido} {int.id == idUsuario && '(Tú)'}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* SECCION DE ENTREGA ESTUDIANTE */}
            {(rol == 7) && !requiresGroupCreation && (
                <div className="card mb-4 shadow-sm border-success">
                    <div className="card-header bg-success text-white">
                        <h5 className="mb-0"><i className="fa-solid fa-paper-plane me-2"></i> Mi Entrega</h5>
                    </div>
                    <div className="card-body">
                        {entrega ? (
                            <div className="mb-4 p-3 bg-light rounded border">
                                <h6>Estado: <span className="badge bg-secondary">{entrega.estado.toUpperCase()}</span></h6>
                                <p className="mb-1"><b>Fecha de entrega:</b> {entrega.fecha_entrega}</p>
                                {entrega.nombre_archivo && (
                                    <p className="mb-1">
                                        <b>Archivo adjunto:</b> <a href={`${CONFIG.API_URL}/${entrega.adjunto}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary ms-2"><i className="fa-solid fa-download me-1"></i> Descargar</a>
                                    </p>
                                )}
                                {entrega.comentario && (
                                    <div className="mt-2 p-2 bg-white border rounded">
                                        <small className="text-muted d-block">Tu comentario:</small>
                                        {entrega.comentario}
                                    </div>
                                )}
                                {entrega.devolucion && (
                                    <div className="mt-3 p-3 alert alert-warning">
                                        <h6 className="alert-heading">Devolución del docente</h6>
                                        <hr />
                                        <p className="mb-0">{entrega.devolucion}</p>
                                        <small className="d-block mt-2 text-muted">Evaluado el: {entrega.fecha_devolucion}</small>
                                        {entrega.fecha_reentrega && (entrega.estado && entrega.estado.trim().toLowerCase() === 'reentrega') && (
                                            <div className="mt-2 text-danger">
                                                <strong><i className="fa-regular fa-calendar-xmark me-1"></i>Fecha límite de reentrega:</strong> {entrega.fecha_reentrega}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="alert alert-info">Aún no has realizado ninguna entrega para esta actividad.</div>
                        )}

                        {(!entrega || (entrega.estado && entrega.estado.trim().toLowerCase() === 'reentrega')) && (
                            <form onSubmit={enviarActividad}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Adjuntar Archivo (opcional)</label>
                                    <input 
                                        type="file" 
                                        className="form-control" 
                                        onChange={handleArchivoChange} 
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                    />
                                    <div className="form-text">Formatos permitidos: Documentos (PDF, Word, Excel) e Imágenes (PNG, JPG).</div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Comentario (opcional)</label>
                                    <textarea 
                                        className="form-control" 
                                        rows="3" 
                                        value={comentario} 
                                        onChange={(e) => setComentario(e.target.value)}
                                        placeholder="Escribe un comentario o aclaración para el docente..."
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn btn-success">
                                    {entrega && entrega.estado ? 'Enviar Re-entrega' : 'Entregar Actividad'}
                                </button>
                            </form>
                        )}

                        {/* Mostrar historial si hay más de una entrega */}
                        {historialEntregas.length > 1 && (
                            <div className="mt-4 pt-3 border-top">
                                <h6 className="text-secondary mb-3"><i className="fa-solid fa-clock-rotate-left me-2"></i>Historial de Entregas Previas</h6>
                                {historialEntregas.slice(1).map((ent, idx) => (
                                    <div key={idx} className="mb-3 p-3 bg-white border rounded">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="badge bg-secondary">{ent.estado.toUpperCase()}</span>
                                            <small className="text-muted">{ent.fecha_entrega}</small>
                                        </div>
                                        {ent.nombre_archivo && (
                                            <p className="mb-1 small">
                                                <b>Archivo adjunto:</b> <a href={`${CONFIG.API_URL}/${ent.adjunto}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary ms-2"><i className="fa-solid fa-download me-1"></i> Descargar {ent.nombre_archivo}</a>
                                            </p>
                                        )}
                                        {ent.comentario && (
                                            <div className="mt-2 p-2 bg-light border rounded small">
                                                <small className="text-muted d-block">Tu comentario:</small>
                                                {ent.comentario}
                                            </div>
                                        )}
                                        {ent.devolucion && (
                                            <div className="mt-3 p-3 alert alert-warning small mb-0">
                                                <h6 className="alert-heading small fw-bold">Devolución:</h6>
                                                {ent.devolucion}
                                                <small className="d-block text-muted mt-2">Evaluado: {ent.fecha_devolucion}</small>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ActividadDetalle;
