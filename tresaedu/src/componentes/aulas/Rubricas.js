import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { show_alerta } from '../../funciones.js';
import useCursoData from '../../hooks/useCursoData';
import CONFIG from '../../config';
import PerfilLogo from '../usuarios/PerfilLogo';

const URL_RUBRICAS = `${CONFIG.API_URL}/operarRubricas.php`;
const MySwal = withReactContent(Swal);

function Rubricas({ idMC, rol, idCG, configuracion }) {
    const esDocenteOAdmin = rol == 6 || rol == 5 || rol <= 4;
    const { estudiantesCurso } = useCursoData(idCG);

    const [rubricas, setRubricas] = useState([]);
    const [espera, setEspera] = useState(false);
    const [modo, setModo] = useState('list'); // 'list', 'crear', 'evaluar', 'ver_estudiante'
    
    // Formulario de Rubrica
    const [rubricaId, setRubricaId] = useState(0);
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [visibleEstudiante, setVisibleEstudiante] = useState(false);
    const [criteriosTemporales, setCriteriosTemporales] = useState([]);

    // Selección para evaluación
    const [rubricaSeleccionada, setRubricaSeleccionada] = useState(null);
    const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
    const [criteriosEvaluacion, setCriteriosEvaluacion] = useState([]); // incluye calificacion y comentario del estudiante

    // Cargar rubricas al inicializar
    useEffect(() => {
        cargarRubricas();
    }, [idCG]);

    const cargarRubricas = async () => {
        setEspera(true);
        try {
            const timestamp = new Date().getTime();
            const res = await axios.get(`${URL_RUBRICAS}?id_curso_grupo=${idCG}&t=${timestamp}`);
            if (Array.isArray(res.data)) {
                setRubricas(res.data);
            } else {
                setRubricas([]);
            }
        } catch (err) {
            console.error("Error al cargar rúbricas:", err);
            show_alerta("Error al cargar las rúbricas", "error");
        } finally {
            setEspera(false);
        }
    };

    // Crear / Editar Rúbrica
    const iniciarCreacion = () => {
        setRubricaId(0);
        setTitulo('');
        setDescripcion('');
        setVisibleEstudiante(false);
        setCriteriosTemporales([
            { criterio: '', descripcion: '', puntaje_maximo: 10 }
        ]);
        setModo('crear');
    };

    const iniciarEdicion = async (rub) => {
        setEspera(true);
        try {
            const res = await axios.get(`${URL_RUBRICAS}?id_rubrica=${rub.id}`);
            if (res.data && !res.data.error) {
                const rInfo = res.data.rubrica;
                setRubricaId(rInfo.id);
                setTitulo(rInfo.titulo);
                setDescripcion(rInfo.descripcion || '');
                setVisibleEstudiante(rInfo.visible_estudiante == 1);
                setCriteriosTemporales(res.data.criterios.map(c => ({
                    criterio: c.criterio,
                    descripcion: c.descripcion || '',
                    puntaje_maximo: parseInt(c.puntaje_maximo) || 10
                })));
                setModo('crear');
            } else {
                show_alerta(res.data?.msg || "Error al obtener detalle de la rúbrica", "error");
            }
        } catch (err) {
            console.error(err);
            show_alerta("Error al conectar con el servidor", "error");
        } finally {
            setEspera(false);
        }
    };

    const agregarCriterioFila = () => {
        setCriteriosTemporales([
            ...criteriosTemporales,
            { criterio: '', descripcion: '', puntaje_maximo: 10 }
        ]);
    };

    const eliminarCriterioFila = (index) => {
        if (criteriosTemporales.length === 1) {
            show_alerta("Una rúbrica debe tener al menos un criterio", "warning");
            return;
        }
        setCriteriosTemporales(criteriosTemporales.filter((_, i) => i !== index));
    };

    const handleCriterioCambio = (index, campo, valor) => {
        const nuevos = [...criteriosTemporales];
        nuevos[index][campo] = valor;
        setCriteriosTemporales(nuevos);
    };

    const guardarRubrica = async (e) => {
        e.preventDefault();
        if (!titulo.trim()) {
            show_alerta("El título es obligatorio", "warning");
            return;
        }

        // Validar criterios
        for (let i = 0; i < criteriosTemporales.length; i++) {
            const crit = criteriosTemporales[i];
            if (!crit.criterio.trim()) {
                show_alerta(`El criterio #${i + 1} no tiene nombre`, "warning");
                return;
            }
            if (isNaN(crit.puntaje_maximo) || crit.puntaje_maximo <= 0) {
                show_alerta(`El puntaje del criterio #${i + 1} debe ser mayor que 0`, "warning");
                return;
            }
        }

        setEspera(true);
        try {
            const payload = {
                accion: 'guardar_rubrica',
                id: rubricaId,
                id_curso_grupo: idCG,
                titulo: titulo,
                descripcion: descripcion,
                visible_estudiante: visibleEstudiante ? 1 : 0,
                criterios: criteriosTemporales
            };

            const formData = new FormData();
            formData.append('data', JSON.stringify(payload));

            const res = await axios.post(URL_RUBRICAS, formData);
            console.log('respuesta DE RUBRICA:',res.data);
            if (res.data && res.data.success) {
                show_alerta("Rúbrica guardada con éxito", "success");
                setModo('list');
                cargarRubricas();
            } else {
                show_alerta(res.data?.msg || "Error al guardar la rúbrica", "error");
            }
        } catch (err) {
            console.error(err);
            show_alerta("Error al conectar con el servidor", "error");
        } finally {
            setEspera(false);
        }
    };

    const eliminarRubrica = (id) => {
        MySwal.fire({
            title: '¿Estás seguro de eliminar esta rúbrica?',
            text: "Se eliminarán permanentemente todas las calificaciones de los estudiantes asociadas a esta rúbrica.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                confirmButton: 'btn btn-danger mx-2',
                cancelButton: 'btn btn-outline-secondary mx-2'
            },
            buttonsStyling: false
        }).then(async (result) => {
            if (result.isConfirmed) {
                setEspera(true);
                try {
                    const res = await axios.delete(URL_RUBRICAS, { data: { id } });
                    if (res.data && res.data.success) {
                        show_alerta("Rúbrica eliminada con éxito", "success");
                        cargarRubricas();
                    } else {
                        show_alerta(res.data?.msg || "Error al eliminar la rúbrica", "error");
                    }
                } catch (err) {
                    console.error(err);
                    show_alerta("Error de conexión", "error");
                } finally {
                    setEspera(false);
                }
            }
        });
    };

    // Panel de Evaluación
    const iniciarEvaluacion = (rub) => {
        setRubricaSeleccionada(rub);
        setEstudianteSeleccionado(null);
        setCriteriosEvaluacion([]);
        setModo('evaluar');
    };

    const seleccionarEstudianteParaEvaluar = async (estudiante) => {
        setEspera(true);
        setEstudianteSeleccionado(estudiante);
        try {
            const timestamp = new Date().getTime();
            const res = await axios.get(`${URL_RUBRICAS}?id_rubrica=${rubricaSeleccionada.id}&id_estudiante=${estudiante.id}&t=${timestamp}`);
            if (res.data && !res.data.error) {
                setCriteriosEvaluacion(res.data.criterios.map(c => ({
                    ...c,
                    // Si ya tiene calificación la dejamos, si no, vacía.
                    calificacion: c.calificacion !== null ? c.calificacion : '',
                    comentario: c.comentario !== null ? c.comentario : ''
                })));
            } else {
                show_alerta("Error al cargar la evaluación del estudiante", "error");
            }
        } catch (err) {
            console.error(err);
            show_alerta("Error de conexión", "error");
        } finally {
            setEspera(false);
        }
    };

    const handleEvaluacionCambio = (index, campo, valor) => {
        const nuevos = [...criteriosEvaluacion];
        nuevos[index][campo] = valor;
        setCriteriosEvaluacion(nuevos);
    };

    const guardarEvaluacionEstudiante = async () => {
        if (!estudianteSeleccionado) return;

        // Validaciones
        for (let i = 0; i < criteriosEvaluacion.length; i++) {
            const crit = criteriosEvaluacion[i];
            if (crit.calificacion !== '') {
                const nota = parseFloat(crit.calificacion);
                const max = parseFloat(crit.puntaje_maximo);
                if (isNaN(nota) || nota < 0 || nota > max) {
                    show_alerta(`La calificación para "${crit.criterio}" debe estar entre 0 y ${max}`, "warning");
                    return;
                }
            }
        }

        setEspera(true);
        try {
            const payload = {
                accion: 'guardar_evaluacion',
                id_estudiante: estudianteSeleccionado.id,
                evaluaciones: criteriosEvaluacion.map(c => ({
                    id_criterio: c.id,
                    calificacion: c.calificacion,
                    comentario: c.comentario
                }))
            };

            const formData = new FormData();
            formData.append('data', JSON.stringify(payload));

            const res = await axios.post(URL_RUBRICAS, formData);
            if (res.data && res.data.success) {
                show_alerta("Evaluación guardada con éxito", "success");
                // Recargar para refrescar información
                seleccionarEstudianteParaEvaluar(estudianteSeleccionado);
            } else {
                show_alerta(res.data?.msg || "Error al guardar la evaluación", "error");
            }
        } catch (err) {
            console.error(err);
            show_alerta("Error al conectar con el servidor", "error");
        } finally {
            setEspera(false);
        }
    };

    // Estudiante / Visualización de Rúbrica
    const verDetalleRubrica = async (rub) => {
        setEspera(true);
        setRubricaSeleccionada(rub);
        try {
            const timestamp = new Date().getTime();
            const res = await axios.get(`${URL_RUBRICAS}?id_rubrica=${rub.id}&t=${timestamp}`);
            if (res.data && !res.data.error) {
                setCriteriosEvaluacion(res.data.criterios);
                setModo('ver_estudiante');
            } else {
                show_alerta("Error al obtener los criterios", "error");
            }
        } catch (err) {
            console.error(err);
            show_alerta("Error de conexión", "error");
        } finally {
            setEspera(false);
        }
    };

    return (
        <div className="card shadow-sm border-0 rounded-4 mt-3" style={{ background: '#ffffff', minHeight: '400px' }}>
            <div className="card-body p-4">
                
                {/* HEAD DE CONTROL DE RUBRICAS */}
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                    <div>
                        <h4 className="fw-bold text-dark mb-1">
                            <i className="fa-solid fa-square-poll-vertical text-success me-2"></i>
                            Rúbricas de Evaluación
                        </h4>
                        <p className="text-muted small mb-0">Criterios de evaluación y seguimiento individual.</p>
                    </div>
                    <div>
                        {modo !== 'list' && (
                            <button 
                                className="btn btn-sm btn-outline-secondary rounded-pill px-3 me-2"
                                onClick={() => { setModo('list'); cargarRubricas(); }}
                                type="button"
                            >
                                <i className="fa-solid fa-arrow-left me-1"></i> Volver
                            </button>
                        )}
                        {esDocenteOAdmin && modo === 'list' && (
                            <button 
                                className="btn btn-sm btn-success rounded-pill px-3"
                                onClick={iniciarCreacion}
                                type="button"
                            >
                                <i className="fa-solid fa-plus me-1"></i> Crear Rúbrica
                            </button>
                        )}
                    </div>
                </div>

                {espera && (
                    <div className="d-flex justify-content-center my-5">
                        <div className="spinner-border text-success" role="status">
                            <span className="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                )}

                {/* MODO LISTADO DE RUBRICAS */}
                {!espera && modo === 'list' && (
                    <div>
                        {rubricas.length === 0 ? (
                            <div className="text-center py-5">
                                <i className="fa-solid fa-clipboard-list text-muted mb-3" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                                <h6 className="text-secondary fw-semibold">No hay rúbricas configuradas para este curso</h6>
                                <p className="text-muted small">Los docentes pueden crear rúbricas para estructurar la evaluación.</p>
                            </div>
                        ) : (
                            <div className="row g-3">
                                {rubricas
                                    .filter(rub => esDocenteOAdmin || rub.visible_estudiante == 1)
                                    .map((rub) => (
                                        <div key={rub.id} className="col-12 col-md-6 col-lg-4">
                                            <div className="card h-100 border rounded-3 hover-shadow-sm transition-all" style={{ borderLeft: '4px solid #198754' }}>
                                                <div className="card-body d-flex flex-column justify-content-between p-3">
                                                    <div>
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <h5 className="card-title fw-bold text-dark mb-0 fs-6">{rub.titulo}</h5>
                                                            <span className={`badge rounded-pill ${rub.visible_estudiante == 1 ? 'bg-success-subtle text-success border border-success' : 'bg-light text-secondary border'}`} style={{ fontSize: '0.65rem' }}>
                                                                {rub.visible_estudiante == 1 ? 'Visible' : 'Oculto'}
                                                            </span>
                                                        </div>
                                                        <p className="card-text text-secondary small mb-3 text-truncate-2" style={{ height: '38px', overflow: 'hidden' }}>
                                                            {rub.descripcion || <em className="text-muted">Sin descripción</em>}
                                                        </p>
                                                        <span className="badge bg-light text-dark border mb-3" style={{ fontSize: '0.75rem' }}>
                                                            <i className="fa-solid fa-list-check text-success me-1"></i>
                                                            {rub.cantidad_criterios} {rub.cantidad_criterios === 1 ? 'criterio' : 'criterios'}
                                                        </span>
                                                    </div>

                                                    <div className="border-top pt-2 d-flex justify-content-end gap-1">
                                                        {esDocenteOAdmin ? (
                                                            <>
                                                                <button 
                                                                    className="btn btn-sm btn-primary rounded-pill px-2 py-1"
                                                                    onClick={() => iniciarEvaluacion(rub)}
                                                                    title="Evaluar Estudiantes"
                                                                    type="button"
                                                                    style={{ fontSize: '0.75rem' }}
                                                                >
                                                                    <i className="fa-solid fa-check-double me-1"></i> Evaluar
                                                                </button>
                                                                <button 
                                                                    className="btn btn-sm btn-outline-secondary rounded-pill p-1 px-2"
                                                                    onClick={() => iniciarEdicion(rub)}
                                                                    title="Editar"
                                                                    type="button"
                                                                    style={{ fontSize: '0.75rem' }}
                                                                >
                                                                    <i className="fa-solid fa-pencil"></i>
                                                                </button>
                                                                <button 
                                                                    className="btn btn-sm btn-outline-danger rounded-pill p-1 px-2"
                                                                    onClick={() => eliminarRubrica(rub.id)}
                                                                    title="Eliminar"
                                                                    type="button"
                                                                    style={{ fontSize: '0.75rem' }}
                                                                >
                                                                    <i className="fa-solid fa-trash"></i>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button 
                                                                className="btn btn-sm btn-outline-success rounded-pill px-3"
                                                                onClick={() => verDetalleRubrica(rub)}
                                                                type="button"
                                                            >
                                                                Ver Criterios <i className="fa-solid fa-chevron-right ms-1"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                )}

                {/* MODO CREACIÓN / EDICIÓN DE RÚBRICA */}
                {!espera && modo === 'crear' && (
                    <form onSubmit={guardarRubrica} className="needs-validation">
                        <div className="row g-3">
                            <div className="col-md-8 col-12">
                                <label className="form-label fw-semibold text-dark">Título de la Rúbrica *</label>
                                <input 
                                    className="form-control rounded-3"
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder="Ej: Evaluación Primer Trimestre, Proyecto Final, etc."
                                    required
                                    type="text"
                                    value={titulo}
                                />
                            </div>
                            <div className="col-md-4 col-12 d-flex align-items-end">
                                <div className="form-check form-switch mb-2">
                                    <input 
                                        className="form-check-input"
                                        id="visibleEstudianteSwitch"
                                        onChange={(e) => setVisibleEstudiante(e.target.checked)}
                                        type="checkbox"
                                        checked={visibleEstudiante}
                                    />
                                    <label className="form-check-label fw-semibold text-dark" htmlFor="visibleEstudianteSwitch">
                                        Visible para Estudiantes
                                    </label>
                                </div>
                            </div>
                            <div className="col-12">
                                <label className="form-label fw-semibold text-dark">Descripción o Contexto</label>
                                <textarea 
                                    className="form-control rounded-3"
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    placeholder="Instrucciones generales de la rúbrica o criterios de aprobación..."
                                    rows="2"
                                    value={descripcion}
                                />
                            </div>
                        </div>

                        {/* CRITERIOS DINÁMICOS */}
                        <div className="mt-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold text-dark mb-0">Criterios de Evaluación</h6>
                                <button 
                                    className="btn btn-sm btn-outline-success rounded-pill px-3"
                                    onClick={agregarCriterioFila}
                                    type="button"
                                >
                                    <i className="fa-solid fa-plus me-1"></i> Agregar Criterio
                                </button>
                            </div>

                            <div className="table-responsive">
                                <table className="table align-middle">
                                    <thead>
                                        <tr className="table-light">
                                            <th style={{ width: '25%' }}>Criterio *</th>
                                            <th style={{ width: '55%' }}>Descripción del criterio</th>
                                            <th style={{ width: '15%' }}>Puntaje Máximo *</th>
                                            <th style={{ width: '5%' }} className="text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {criteriosTemporales.map((crit, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <input 
                                                        className="form-control form-control-sm rounded-2"
                                                        onChange={(e) => handleCriterioCambio(index, 'criterio', e.target.value)}
                                                        placeholder="Ej: Contenido, Ortografía"
                                                        required
                                                        type="text"
                                                        value={crit.criterio}
                                                    />
                                                </td>
                                                <td>
                                                    <input 
                                                        className="form-control form-control-sm rounded-2"
                                                        onChange={(e) => handleCriterioCambio(index, 'descripcion', e.target.value)}
                                                        placeholder="Descripción de los aspectos a evaluar..."
                                                        type="text"
                                                        value={crit.descripcion}
                                                    />
                                                </td>
                                                <td>
                                                    <input 
                                                        className="form-control form-control-sm rounded-2"
                                                        min="1"
                                                        onChange={(e) => handleCriterioCambio(index, 'puntaje_maximo', parseInt(e.target.value) || 0)}
                                                        required
                                                        type="number"
                                                        value={crit.puntaje_maximo}
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    <button 
                                                        className="btn btn-sm btn-link text-danger p-0"
                                                        onClick={() => eliminarCriterioFila(index)}
                                                        type="button"
                                                    >
                                                        <i className="fa-solid fa-trash-can"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                            <button 
                                className="btn btn-secondary rounded-pill px-4"
                                onClick={() => setModo('list')}
                                type="button"
                            >
                                Cancelar
                            </button>
                            <button 
                                className="btn btn-success rounded-pill px-4"
                                type="submit"
                            >
                                Guardar Rúbrica
                            </button>
                        </div>
                    </form>
                )}

                {/* MODO PANEL DE EVALUACIÓN PARA DOCENTE */}
                {!espera && modo === 'evaluar' && rubricaSeleccionada && (
                    <div>
                        <div className="alert bg-light border-start border-primary border-4 mb-4 p-3">
                            <h5 className="fw-bold text-dark mb-1">{rubricaSeleccionada.titulo}</h5>
                            <p className="text-secondary small mb-0">{rubricaSeleccionada.descripcion}</p>
                        </div>

                        <div className="row">
                            {/* Panel Estudiantes */}
                            <div className="col-12 col-md-4 border-end">
                                <h6 className="fw-bold text-dark mb-3">Estudiantes del Curso ({estudiantesCurso.length})</h6>
                                <div className="list-group rounded-3 overflow-hidden shadow-sm" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {estudiantesCurso.length === 0 ? (
                                        <div className="p-3 text-center text-muted small">No hay estudiantes inscriptos</div>
                                    ) : (
                                        estudiantesCurso.map(est => (
                                            <button
                                                key={est.id}
                                                className={`list-group-item list-group-item-action d-flex align-items-center gap-2 p-2 border-0 border-bottom ${estudianteSeleccionado?.id === est.id ? 'active bg-success text-white' : ''}`}
                                                onClick={() => seleccionarEstudianteParaEvaluar(est)}
                                                type="button"
                                            >
                                                <PerfilLogo usuario={est} version="muro" configuracion={configuracion} />
                                                <div className="text-start">
                                                    <p className="mb-0 fw-semibold small text-inherit">{est.apellido}, {est.nombre}</p>
                                                    <span className="text-inherit opacity-75" style={{ fontSize: '0.7rem' }}>DNI: {est.documento}</span>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Panel de Notas */}
                            <div className="col-12 col-md-8 ps-md-4 mt-3 mt-md-0">
                                {!estudianteSeleccionado ? (
                                    <div className="h-100 d-flex flex-column justify-content-center align-items-center text-center p-5 bg-light rounded-3">
                                        <i className="fa-solid fa-user-check text-muted mb-3" style={{ fontSize: '2.5rem', opacity: 0.3 }}></i>
                                        <h6 className="text-secondary fw-semibold">Selecciona un estudiante para evaluar</h6>
                                        <p className="text-muted small">Haz clic en un alumno de la lista de la izquierda para calificarlo.</p>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
                                            {/* Avatar simple: iniciales o imagen, sin modal ni link a ficha */}
                                            {estudianteSeleccionado.imagen_perfil ? (
                                                <img
                                                    src={`${CONFIG.API_URL}/${estudianteSeleccionado.imagen_perfil}`}
                                                    alt="Perfil"
                                                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '48px', height: '48px', borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #198754, #0d6efd)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#fff', fontWeight: 'bold', fontSize: '1rem', flexShrink: 0
                                                }}>
                                                    {(estudianteSeleccionado.nombre?.charAt(0) || '').toUpperCase()}
                                                    {(estudianteSeleccionado.apellido?.charAt(0) || '').toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <h5 className="fw-bold text-dark mb-0">{estudianteSeleccionado.nombre} {estudianteSeleccionado.apellido}</h5>
                                                <p className="text-secondary small mb-0">DNI: {estudianteSeleccionado.documento}</p>
                                            </div>
                                        </div>

                                        <div className="criterios-evaluacion-lista">
                                            {criteriosEvaluacion.map((crit, index) => (
                                                <div key={crit.id} className="card border mb-3 rounded-3 shadow-2xs">
                                                    <div className="card-body p-3">
                                                        <div className="row g-3">
                                                            <div className="col-md-8 col-12">
                                                                <h6 className="fw-bold text-dark mb-1">{crit.criterio}</h6>
                                                                <p className="text-secondary small mb-0">{crit.descripcion || <em className="text-muted">Sin descripción</em>}</p>
                                                            </div>
                                                            <div className="col-md-4 col-12">
                                                                <label className="form-label small fw-semibold text-dark mb-1">
                                                                    Calificación (Máx: {crit.puntaje_maximo})
                                                                </label>
                                                                <input 
                                                                    className="form-control form-control-sm rounded-2 fw-semibold"
                                                                    max={crit.puntaje_maximo}
                                                                    min="0"
                                                                    onChange={(e) => handleEvaluacionCambio(index, 'calificacion', e.target.value)}
                                                                    placeholder={`0 - ${crit.puntaje_maximo}`}
                                                                    type="number"
                                                                    value={crit.calificacion}
                                                                    step="any"
                                                                />
                                                            </div>
                                                            <div className="col-12 mt-2">
                                                                <textarea 
                                                                    className="form-control form-control-sm rounded-2"
                                                                    onChange={(e) => handleEvaluacionCambio(index, 'comentario', e.target.value)}
                                                                    placeholder="Comentarios de retroalimentación para este criterio..."
                                                                    rows="2"
                                                                    value={crit.comentario}
                                                                />
                                                            </div>
                                                        </div>
                                                        {crit.fecha_evaluacion && (
                                                            <div className="mt-2 text-end text-muted" style={{ fontSize: '0.65rem' }}>
                                                                <i className="fa-solid fa-clock me-1"></i>
                                                                Última actualización: {crit.fecha_evaluacion}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                                            <button 
                                                className="btn btn-success rounded-pill px-4"
                                                onClick={guardarEvaluacionEstudiante}
                                                type="button"
                                            >
                                                <i className="fa-solid fa-floppy-disk me-1"></i> Guardar Evaluación
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODO VISTA DE CRITERIOS (ESTUDIANTES - READ-ONLY) */}
                {!espera && modo === 'ver_estudiante' && rubricaSeleccionada && (
                    <div>
                        <div className="alert bg-light border-start border-success border-4 mb-4 p-3">
                            <h5 className="fw-bold text-dark mb-1">{rubricaSeleccionada.titulo}</h5>
                            <p className="text-secondary small mb-0">{rubricaSeleccionada.descripcion}</p>
                        </div>

                        <h6 className="fw-bold text-dark mb-3">Criterios a ser evaluados:</h6>
                        <div className="row g-3">
                            {criteriosEvaluacion.map(crit => (
                                <div key={crit.id} className="col-12">
                                    <div className="card border rounded-3 p-3 bg-light-subtle">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h6 className="fw-bold text-dark mb-0">{crit.criterio}</h6>
                                            <span className="badge bg-success-subtle text-success border border-success px-2" style={{ fontSize: '0.75rem' }}>
                                                Puntaje Máximo: {crit.puntaje_maximo}
                                            </span>
                                        </div>
                                        <p className="text-secondary small mb-0">{crit.descripcion || <em className="text-muted">Sin detalles</em>}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default Rubricas;
