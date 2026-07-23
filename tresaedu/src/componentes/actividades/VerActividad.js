import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CONFIG from '../../config';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { show_alerta } from '../../funciones';

function VerActividad({actividad, setMostrarActividad, rol}) {
    const [entrega, setEntrega] = useState(null);
    const [historialEntregas, setHistorialEntregas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [idGrupo, setIdGrupo] = useState(null);
    const [archivo, setArchivo] = useState(null);
    const [comentario, setComentario] = useState('');

    const cargarDatos = () => {
        if (rol == 7 && actividad && actividad.id) {
            setLoading(true);
            const idUsuario = localStorage.getItem('loggedUserId');
            const idCursoGrupo = localStorage.getItem('loggeduserCursoGrupo');
            axios.get(`${CONFIG.API_URL}/operarEntregas.php?modo=buscarActividad&id_trabajo=${actividad.id}&id_estudiante=${idUsuario}&id_curso_grupo=${idCursoGrupo}`)
                .then(res => {
                    if (!res.data.error) {
                        setEntrega(res.data.entrega);
                        setHistorialEntregas(res.data.historial_entregas || []);
                        setIdGrupo(res.data.id_grupo);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [actividad, rol]);

    const handleArchivoChange = (e) => {
        setArchivo(e.target.files[0]);
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
                formData.append('id_trabajo', actividad.id);
                const idUsuario = localStorage.getItem('loggedUserId');
                formData.append('id_estudiante', idUsuario);
                formData.append('id_grupo', idGrupo);
                formData.append('comentario', comentario);
                if (archivo) {
                    formData.append('adjunto', archivo);
                }

                setLoading(true);
                axios.post(`${CONFIG.API_URL}/operarEntregas.php`, formData, {
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

    const requiresGroupCreation = actividad.tipo_trabajo === 'grupal' && idGrupo === null;

    return (    
        <div className="card p-4 my-2">
            <div className="d-flex justify-content-end">
                <button type="button" className="btn btn-sm btn-secondary" onClick={()=>setMostrarActividad('')}> X </button>
            </div>
            <h3>{actividad.titulo}</h3>
            <p>{actividad.desarrollo}</p>
            <hr/>
            <p><i className="fa-regular fa-clock"></i><b> fecha de entrega:</b> {actividad.fecha_entrega}</p>
            <hr/>
            <div className="alert alert-warning" role="alert">
                <b>Formato de presentación</b>: <br>
                </br>{actividad.forma_presentacion ? actividad.forma_presentacion: 'no especificado'}
            </div>
            <div>
                <b>Material de apoyo</b>
                {actividad.material ? actividad.material:''}
            </div>

            <div>El trabajo es de entrega <b>{actividad.tipo_trabajo}</b></div>

            {/* SECCIÓN DE HISTORIAL DE ENTREGA PARA EL ESTUDIANTE */}
            {rol == 7 && (
                <div className="mt-4 p-3 border rounded border-success bg-light">
                    <h5 className="text-success"><i className="fa-solid fa-paper-plane me-2"></i> Estado de tu entrega</h5>
                    
                    {loading ? (
                        <div className="text-muted small">Cargando estado...</div>
                    ) : entrega ? (
                        <div>
                            <h6>Estado: <span className="badge bg-secondary">{entrega.estado ? entrega.estado.toUpperCase() : 'DESCONOCIDO'}</span></h6>
                            <p className="mb-1 small"><b>Fecha entregado:</b> {entrega.fecha_entrega}</p>
                            
                            {entrega.devolucion && (
                                <div className="mt-3 p-3 alert alert-warning">
                                    <h6 className="alert-heading small fw-bold">Devolución del docente</h6>
                                    <p className="mb-1 small">{entrega.devolucion}</p>
                                    <small className="d-block text-muted" style={{fontSize: '0.75rem'}}>Evaluado el: {entrega.fecha_devolucion}</small>
                                    
                                    {entrega.fecha_reentrega && (entrega.estado && entrega.estado.trim().toLowerCase() === 'reentrega') && (
                                        <div className="mt-2 text-danger small">
                                            <strong><i className="fa-regular fa-calendar-xmark me-1"></i>Fecha límite de reentrega:</strong> {entrega.fecha_reentrega}
                                        </div>
                                    )}
                                </div>
                            )}

                            {(!entrega.estado || entrega.estado.trim().toLowerCase() === 'reentrega') && (
                                <div className="mt-3">
                                    <h6 className="text-primary">{entrega.estado ? 'Formulario de Re-entrega' : 'Formulario de Entrega'}</h6>
                                    {requiresGroupCreation ? (
                                        <div className="alert alert-warning small">
                                            Para entregar esta actividad grupal, primero debes conformar tu grupo.
                                            <Link to={`/MC/${localStorage.getItem('loggeduserClasesCurso')}/a/${actividad.id}`} className="btn btn-sm btn-primary d-block mt-2">
                                                Ir a conformar grupo
                                            </Link>
                                        </div>
                                    ) : (
                                        <form onSubmit={enviarActividad}>
                                            <div className="mb-3">
                                                <label className="form-label fw-bold small">Adjuntar Archivo (opcional)</label>
                                                <input 
                                                    type="file" 
                                                    className="form-control form-control-sm" 
                                                    onChange={handleArchivoChange} 
                                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label fw-bold small">Comentario (opcional)</label>
                                                <textarea 
                                                    className="form-control form-control-sm" 
                                                    rows="2" 
                                                    value={comentario} 
                                                    onChange={(e) => setComentario(e.target.value)}
                                                    placeholder="Escribe un comentario..."
                                                ></textarea>
                                            </div>
                                            <button type="submit" className="btn btn-sm btn-success">
                                                {entrega.estado ? 'Enviar Re-entrega' : 'Entregar Actividad'}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* Mostrar historial si hay más de una entrega */}
                            {historialEntregas.length > 1 && (
                                <div className="mt-4 pt-3 border-top">
                                    <h6 className="text-secondary mb-3"><i className="fa-solid fa-clock-rotate-left me-2"></i>Historial de Entregas Previas</h6>
                                    {historialEntregas.slice(1).map((ent, idx) => (
                                        <div key={idx} className="mb-3 p-2 bg-white border rounded">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className="badge bg-secondary">{ent.estado.toUpperCase()}</span>
                                                <small className="text-muted">{ent.fecha_entrega}</small>
                                            </div>
                                            {ent.nombre_archivo && (
                                                <p className="mb-1 small">
                                                    <b>Archivo:</b> <a href={`${CONFIG.API_URL}/${ent.adjunto}`} target="_blank" rel="noreferrer">{ent.nombre_archivo}</a>
                                                </p>
                                            )}
                                            {ent.comentario && (
                                                <div className="p-2 bg-light border rounded small mb-2">
                                                    <small className="text-muted d-block">Tu comentario:</small>
                                                    {ent.comentario}
                                                </div>
                                            )}
                                            {ent.devolucion && (
                                                <div className="p-2 alert alert-warning small mb-0">
                                                    <b>Devolución:</b> {ent.devolucion}
                                                    <small className="d-block text-muted mt-1">Evaluado: {ent.fecha_devolucion}</small>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>
                    ) : (
                        <div>
                            <p className="small text-muted mb-2">Aún no has realizado la entrega para esta actividad.</p>
                            {requiresGroupCreation ? (
                                <div className="alert alert-warning small">
                                    Para entregar esta actividad grupal, primero debes conformar tu grupo.
                                    <Link to={`/MC/${localStorage.getItem('loggeduserClasesCurso')}/a/${actividad.id}`} className="btn btn-sm btn-primary d-block mt-2">
                                        Ir a conformar grupo
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={enviarActividad}>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold small">Adjuntar Archivo (opcional)</label>
                                        <input 
                                            type="file" 
                                            className="form-control form-control-sm" 
                                            onChange={handleArchivoChange} 
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold small">Comentario (opcional)</label>
                                        <textarea 
                                            className="form-control form-control-sm" 
                                            rows="2" 
                                            value={comentario} 
                                            onChange={(e) => setComentario(e.target.value)}
                                            placeholder="Escribe un comentario..."
                                        ></textarea>
                                    </div>
                                    <button type="submit" className="btn btn-sm btn-success">
                                        Entregar Actividad
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="d-flex justify-content-end mt-3">
                <button type="button" className="btn btn-sm btn-secondary" onClick={()=>setMostrarActividad('')}>Cerrar</button>
            </div>
        </div>
     );
}

export default VerActividad;