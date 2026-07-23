import './css/CalificacionesGeneral.css';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { show_alerta } from '../../funciones.js';
import CONFIG from '../../config.js';

const URL_COHORTES = `${CONFIG.API_URL}/operarCohortes.php`;
const URL_ESTUDIANTES = `${CONFIG.API_URL}/operarEstudiantes.php`;
const URL_CALIFICACIONES = `${CONFIG.API_URL}/operarCalificacionesGeneral.php`;

// ── Helpers ────────────────────────────────────────────────────────────────
/**
 * Determina el estado visual de una calificación de un estudiante.
 * @param {object|undefined} valoracion - fila de valoracion del alumno
 * @param {boolean} aprobada - si fue aprobada por el admin
 * @param {boolean} publicada - si fue publicada
 */
function calcularEstado(valoracion, aprobada, publicada) {
    if (publicada || (valoracion && valoracion.estado_aprobacion === 'publicada')) return 'publicada';
    if (aprobada || (valoracion && valoracion.estado_aprobacion === 'aprobada')) return 'aprobada';
    if (valoracion && valoracion.valor !== null && valoracion.valor !== '') return 'cargada';
    return 'sin-cargar';
}

const ESTADO_LABEL = {
    'sin-cargar': { texto: 'Sin cargar', icon: 'fa-circle-xmark' },
    'cargada': { texto: 'Cargada', icon: 'fa-circle-check' },
    'aprobada': { texto: 'Aprobada', icon: 'fa-thumbs-up' },
    'publicada': { texto: 'Publicada', icon: 'fa-bullhorn' },
};

function BadgeEstado({ estado }) {
    const { texto, icon } = ESTADO_LABEL[estado] || ESTADO_LABEL['sin-cargar'];
    return (
        <span className={`calgen-badge ${estado}`}>
            <i className={`fa-solid ${icon}`}></i>
            {texto}
        </span>
    );
}

// ──────────────────────────────────────────────────────────────────────────
function CalificacionesGeneral({ acceder, rol }) {
    // ── Filtros ──────────────────────────────────────────────────────────
    const [cohortes, setCohortes] = useState([]);
    const [cohorteId, setCohorteId] = useState('');
    const [cursosDisp, setCursosDisp] = useState([]);
    const [cursoGrupo, setCursoGrupo] = useState(''); // "orden-seccion"
    const [gruposDisp, setGruposDisp] = useState([]);
    const [division, setDivision] = useState(''); // división seleccionada (letra)
    const [instancias, setInstancias] = useState([]);
    const [instanciaId, setInstanciaId] = useState('');
    const [grupo, setGrupo] = useState(''); // id_curso_grupo numérico
    const [cursoId, setCursoId] = useState(''); // id_curso numérico (materia)

    // ── Datos del panel ──────────────────────────────────────────────────
    const [estudiantes, setEstudiantes] = useState([]);
    const [valoraciones, setValoraciones] = useState([]);
    const [equipoDocente, setEquipoDocente] = useState([]);
    const [loading, setLoading] = useState(false);

    // ── Estado de aprobaciones y publicaciones (local) ──────────────────
    // aprobadas: { [id_usuario]: true|false }
    const [aprobadas, setAprobadas] = useState({});
    // publicadas: true = todo el grupo publicado
    const [publicadas, setPublicadas] = useState(false);

    // ── Cargar cohortes al montar ────────────────────────────────────────
    useEffect(() => {
        axios.get(`${URL_COHORTES}?accion=listar`)
            .then(res => {
                if (res.data.success) setCohortes(res.data.cohortes);
            })
            .catch(() => show_alerta('Error al cargar cohortes', 'error'));
    }, []);

    // ── Al cambiar cohorte → cargar cursos e instancias disponibles ───────
    useEffect(() => {
        if (!cohorteId) {
            setCursosDisp([]);
            setCursoGrupo('');
            setGruposDisp([]);
            setDivision('');
            setInstancias([]);
            setInstanciaId('');
            setGrupo('');
            setCursoId('');
            resetPanel();
            return;
        }

        // Cargar cursos
        axios.get(`${URL_ESTUDIANTES}?cohorte=${cohorteId}&curso_grupo=0`)
            .then(res => {
                if (res.data.cursos) {
                    setCursosDisp(res.data.cursos);
                }
            })
            .catch(() => show_alerta('Error al cargar cursos', 'error'));

        // Cargar instancias
        axios.get(`${CONFIG.API_URL}/operarInstancias.php?id_cohorte=${cohorteId}`)
            .then(res => {
                if (res.data.success) {
                    setInstancias(res.data.instancias || []);
                }
            })
            .catch(() => show_alerta('Error al cargar instancias', 'error'));

        setCursoGrupo('');
        setGruposDisp([]);
        setDivision('');
        setInstancias([]);
        setInstanciaId('');
        setGrupo('');
        setCursoId('');
        resetPanel();
    }, [cohorteId]);

    // ── Al cambiar curso → filtrar grupos (secciones) disponibles ────────
    useEffect(() => {
        if (!cursoGrupo || !cohorteId) {
            setGruposDisp([]);
            setDivision('');
            setGrupo('');
            setCursoId('');
            resetPanel();
            return;
        }
        const [orden] = cursoGrupo.split('-');
        // Deduplicar divisiones (secciones) por cg.seccion
        const uniqueSecciones = [];
        const seen = new Set();
        cursosDisp.forEach(c => {
            if (String(c.orden) === String(orden) && !seen.has(c.seccion)) {
                seen.add(c.seccion);
                uniqueSecciones.push(c);
            }
        });
        setGruposDisp(uniqueSecciones);
        setDivision('');
        setGrupo('');
        setCursoId('');
        resetPanel();
    }, [cursoGrupo, cursosDisp, cohorteId]);

    // ── Al cambiar división → resetear materia/grupo/cursoId ─────────────
    useEffect(() => {
        setGrupo('');
        setCursoId('');
        resetPanel();
    }, [division]);

    // ── Al elegir grupo/materia/instancia → cargar estudiantes, valoraciones y docentes ────
    useEffect(() => {
        if (!grupo || !cursoId || !cohorteId || !instanciaId) {
            resetPanel();
            return;
        }
        cargarPanel();
    }, [grupo, cursoId, instanciaId, cohorteId]);

    const resetPanel = () => {
        setEstudiantes([]);
        setValoraciones([]);
        setEquipoDocente([]);
        setAprobadas({});
        setPublicadas(false);
    };

    const cargarPanel = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.post(URL_ESTUDIANTES, {
                modo: 'buscarEstudiantesCurso',
                id_curso: cursoId,
                id_grupo: grupo,
                id_instancia: instanciaId,
            });
            if (res.data.estudiantes) {
                setEstudiantes(res.data.estudiantes);
                setValoraciones(res.data.valoraciones || []);
                setEquipoDocente(res.data.equipo_docente || []);

                // Cargar estados (aprobadas/publicadas) desde el servidor
                cargarEstados(grupo, cursoId, instanciaId);
            } else {
                show_alerta('No se encontraron estudiantes para este grupo', 'warning');
                resetPanel();
            }
        } catch {
            show_alerta('Error al cargar los datos del grupo', 'error');
        } finally {
            setLoading(false);
        }
    }, [grupo, cursoId, instanciaId, cohorteId]);

    // ── Cargar estados de aprobación/publicación desde el servidor ────────
    const cargarEstados = async (idGrupo, idCurso, idInstancia) => {
        try {
            const res = await axios.get(`${URL_CALIFICACIONES}?accion=estados&id_grupo=${idGrupo}&id_curso=${idCurso}&id_instancia=${idInstancia}`);
            if (res.data.success) {
                setAprobadas(res.data.aprobadas || {});
                setPublicadas(res.data.publicadas || false);
            }
        } catch {
            // Si el endpoint no existe aún, simplemente ignoro
        }
    };

    // ── Aprobar / desaprobar calificación de un estudiante ────────────────
    const toggleAprobar = async (idUsuario) => {
        const nuevoEstado = !aprobadas[idUsuario];

        // Optimistic update
        setAprobadas(prev => ({ ...prev, [idUsuario]: nuevoEstado }));
        setValoraciones(prev => {
            const arr = Array.isArray(prev) ? prev : [];
            return arr.map(v => {
                if (String(v.id_usuario) === String(idUsuario)) {
                    return { ...v, estado_aprobacion: nuevoEstado ? 'aprobada' : null };
                }
                return v;
            });
        });

        try {
            await axios.post(URL_CALIFICACIONES, {
                accion: 'aprobar',
                id_grupo: grupo,
                id_curso: cursoId,
                id_instancia: instanciaId,
                id_usuario: idUsuario,
                aprobada: nuevoEstado,
            });
        } catch {
            // Revertir
            setAprobadas(prev => ({ ...prev, [idUsuario]: !nuevoEstado }));
            setValoraciones(prev => {
                const arr = Array.isArray(prev) ? prev : [];
                return arr.map(v => {
                    if (String(v.id_usuario) === String(idUsuario)) {
                        return { ...v, estado_aprobacion: !nuevoEstado ? 'aprobada' : null };
                    }
                    return v;
                });
            });
            show_alerta('Error al actualizar el estado', 'error');
        }
    };

    // ── Publicar todas las calificaciones ────────────────────────────────
    const publicarCalificaciones = async () => {
        const todasAprobadas = estudiantes.every(est => {
            const val = getValoracion(est.id);
            return val && aprobadas[est.id];
        });

        if (!todasAprobadas) {
            show_alerta('Todas las calificaciones deben estar cargadas y aprobadas para poder publicar', 'warning');
            return;
        }

        try {
            const res = await axios.post(URL_CALIFICACIONES, {
                accion: 'publicar',
                id_grupo: grupo,
                id_curso: cursoId,
                id_instancia: instanciaId,
            });
            if (res.data.success) {
                setPublicadas(true);
                setAprobadas(prev => {
                    const next = { ...prev };
                    estudiantes.forEach(est => {
                        next[est.id] = true;
                    });
                    return next;
                });
                setValoraciones(prev => {
                    const arr = Array.isArray(prev) ? prev : [];
                    return arr.map(v => ({ ...v, estado_aprobacion: 'publicada' }));
                });
                show_alerta('Calificaciones publicadas correctamente', 'success');
            } else {
                show_alerta(res.data.mensaje || 'Error al publicar', 'error');
            }
        } catch {
            show_alerta('Error de conexión al publicar', 'error');
        }
    };

    // ── Manejo de observaciones ──────────────────────────────────────────
    const handleObservacionChange = (idUsuario, nuevaObs) => {
        setValoraciones(prev => {
            const arr = Array.isArray(prev) ? prev : [];
            const exists = arr.some(v => String(v.id_usuario) === String(idUsuario));
            if (exists) {
                return arr.map(v =>
                    String(v.id_usuario) === String(idUsuario)
                        ? { ...v, observacion: nuevaObs }
                        : v
                );
            } else {
                return [...arr, {
                    id_usuario: idUsuario,
                    id_instancia: instanciaId,
                    id_curso: cursoId,
                    valor: '',
                    observacion: nuevaObs,
                    estado_aprobacion: null
                }];
            }
        });
    };

    const handleObservacionBlur = async (idUsuario) => {
        const val = getValoracion(idUsuario);
        const observacion = val?.observacion || '';

        try {
            await axios.post(`${CONFIG.API_URL}/operarValoraciones.php`, {
                modo: 'guardarInformeValoraciones',
                id_estudiante: idUsuario,
                id_instancia: instanciaId,
                id_curso: cursoId,
                informe: observacion
            });
        } catch {
            show_alerta('Error al guardar la observación', 'error');
        }
    };

    // ── Helper: obtener valoración de un estudiante ───────────────────────
    const getValoracion = (idUsuario) => {
        if (!Array.isArray(valoraciones)) return undefined;
        return valoraciones.find(v => v.id_usuario === idUsuario || v.id_usuario === String(idUsuario));
    };

    // ── Resumen de estados ────────────────────────────────────────────────
    const resumen = {
        total: estudiantes.length,
        sinCargar: estudiantes.filter(e => { const v = getValoracion(e.id); return !v || v.valor === null || v.valor === ''; }).length,
        cargadas: estudiantes.filter(e => { const v = getValoracion(e.id); return v && v.valor !== null && v.valor !== '' && !aprobadas[e.id] && !publicadas; }).length,
        aprobadas: estudiantes.filter(e => aprobadas[e.id] && !publicadas).length,
        publicadas: publicadas ? estudiantes.length : 0,
    };

    const todasListasParaPublicar =
        resumen.total > 0 &&
        resumen.sinCargar === 0 &&
        resumen.aprobadas + resumen.publicadas === resumen.total;

    // ── Datos de la cohorte y curso seleccionados (para el header) ────────
    const cohorteSelec = cohortes.find(c => String(c.id) === String(cohorteId));
    const [ordenSelec] = cursoGrupo ? cursoGrupo.split('-') : [''];
    const selectedMateriaObj = cursosDisp.find(c => String(c.id) === String(grupo));
    const materiaNombre = selectedMateriaObj ? selectedMateriaObj.nombre_espacio : '';
    const selectedInstanciaObj = instancias.find(i => String(i.id) === String(instanciaId));
    const instanciaNombre = selectedInstanciaObj ? selectedInstanciaObj.nombre : '';

    // ══════════════════════════════════════════════════════════════════════
    return (
        <div className="container-principal">
            {/* ── Título ── */}
            <h2 className="calgen-titulo">
                <i className="fa-solid fa-graduation-cap"></i>
                Calificaciones Generales
            </h2>
            <p className="calgen-subtitulo">
                Control de calificaciones y observaciones docentes
            </p>

            {/* ── Filtros ── */}
            <div className="calgen-filtros">
                {/* Cohorte */}
                <div className="filtro-grupo">
                    <label htmlFor="calgen-cohorte">Cohorte</label>
                    <select
                        id="calgen-cohorte"
                        value={cohorteId}
                        onChange={e => setCohorteId(e.target.value)}
                    >
                        <option value="">-- Seleccionar cohorte --</option>
                        {cohortes.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.nombre_formacion} — {c.año}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Curso */}
                <div className="filtro-grupo">
                    <label htmlFor="calgen-curso">Curso</label>
                    <select
                        id="calgen-curso"
                        value={cursoGrupo}
                        onChange={e => setCursoGrupo(e.target.value)}
                        disabled={!cohorteId || cursosDisp.length === 0}
                    >
                        <option value="">-- Seleccionar curso --</option>
                        {/* Mostrar cursos únicos por orden */}
                        {[...new Map(cursosDisp.map(c => [c.orden, c])).values()].map((c, i) => (
                            <option key={i} value={`${c.orden}-${c.seccion}`}>
                                {c.orden}° año
                            </option>
                        ))}
                    </select>
                </div>

                {/* Grupo / División */}
                <div className="filtro-grupo">
                    <label htmlFor="calgen-division">Grupo / División</label>
                    <select
                        id="calgen-division"
                        value={division}
                        onChange={e => setDivision(e.target.value)}
                        disabled={!cursoGrupo || gruposDisp.length === 0}
                    >
                        <option value="">-- Seleccionar división --</option>
                        {gruposDisp.map((g, i) => (
                            <option key={i} value={g.seccion}>
                                División {g.denominacion}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Instancia de Calificación */}
                <div className="filtro-grupo">
                    <label htmlFor="calgen-instancia">Instancia</label>
                    <select
                        id="calgen-instancia"
                        value={instanciaId}
                        onChange={e => setInstanciaId(e.target.value)}
                        disabled={!division || instancias.length === 0}
                    >
                        <option value="">-- Seleccionar instancia --</option>
                        {instancias.map((inst) => (
                            <option key={inst.id} value={inst.id}>
                                {inst.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Materia */}
                <div className="filtro-grupo">
                    <label htmlFor="calgen-materia">Materia</label>
                    <select
                        id="calgen-materia"
                        value={grupo}
                        onChange={e => {
                            const val = e.target.value;
                            setGrupo(val);
                            if (val) {
                                const [orden] = cursoGrupo.split('-');
                                const materiasDisp = cursosDisp.filter(
                                    c => String(c.orden) === String(orden) && String(c.seccion) === String(division)
                                );
                                const match = materiasDisp.find(m => String(m.id) === String(val));
                                setCursoId(match ? match.id_curso : '');
                            } else {
                                setCursoId('');
                            }
                        }}
                        disabled={!instanciaId}
                    >
                        <option value="">-- Seleccionar materia --</option>
                        {cursoGrupo && division && cursosDisp
                            .filter(c => {
                                const [orden] = cursoGrupo.split('-');
                                return String(c.orden) === String(orden) && String(c.seccion) === String(division);
                            })
                            .map((m, i) => (
                                <option key={i} value={m.id}>
                                    {m.nombre_espacio}
                                </option>
                            ))}
                    </select>
                </div>
            </div>

            {/* ── Panel principal ── */}
            {loading ? (
                <div className="calgen-loading">
                    <i className="fa-solid fa-spinner"></i>
                    Cargando datos...
                </div>
            ) : estudiantes.length === 0 ? (
                <div className="calgen-empty">
                    <i className="fa-solid fa-table-list"></i>
                    {cohorteId && cursoGrupo && division && instanciaId && grupo
                        ? 'No hay estudiantes en este grupo/materia/instancia'
                        : 'Seleccioná cohorte, curso, división, instancia y materia para ver las calificaciones'}
                </div>
            ) : (
                <div className="calgen-panel">
                    {/* ── Header del panel ── */}
                    <div className="calgen-panel-header">
                        <span className="calgen-panel-titulo">
                            <i className="fa-solid fa-users me-2"></i>
                            {cohorteSelec?.nombre_formacion} — {cohorteSelec?.año} &nbsp;|&nbsp;
                            {ordenSelec}° año, División {division} &nbsp;|&nbsp; {materiaNombre} &nbsp;|&nbsp; {instanciaNombre}
                        </span>
                        <span className="calgen-panel-meta">
                            {resumen.total} estudiante{resumen.total !== 1 ? 's' : ''} &nbsp;·&nbsp;
                            {resumen.sinCargar} sin cargar &nbsp;·&nbsp;
                            {resumen.cargadas} cargadas &nbsp;·&nbsp;
                            {resumen.aprobadas} aprobadas &nbsp;·&nbsp;
                            {resumen.publicadas} publicadas
                        </span>
                    </div>

                    {/* ── Equipo docente ── */}
                    {equipoDocente.length > 0 && (
                        <div className="calgen-docentes-section">
                            <div className="calgen-docentes-titulo">Equipo docente</div>
                            <div className="calgen-docentes-lista">
                                {equipoDocente.map(doc => (
                                    <span key={doc.id} className="calgen-docente-chip">
                                        <i className="fa-solid fa-chalkboard-user"></i>
                                        {doc.apellido}, {doc.nombre}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Tabla de estudiantes ── */}
                    <div className="calgen-table-wrapper">
                        <table className="calgen-table">
                            <thead>
                                <tr>
                                    <th className="col-accion" style={{ textAlign: 'center' }}>Boletín</th>
                                    <th className="col-accion" style={{ textAlign: 'center' }}>Aprobar</th>
                                    <th>Estudiante</th>
                                    <th>Calificación</th>
                                    <th>Observación</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {estudiantes.map(est => {
                                    const val = getValoracion(est.id);
                                    const tieneCal = val && val.valor !== null && val.valor !== '';
                                    const esAprobada = !!aprobadas[est.id];
                                    const esPublicada = publicadas;
                                    const estado = calcularEstado(val, esAprobada, esPublicada);
                                    const valorNum = tieneCal ? parseFloat(val.valor) : null;

                                    return (
                                        <tr key={est.id}>
                                            {/* Botón Imprimir Boletín */}
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    className="calgen-btn-imprimir"
                                                    onClick={() => window.open(`${CONFIG.BASE_URL}ImprimirBoletin/${est.id}/${cohorteId}?instancia=${instanciaId}`, '_blank')}
                                                    title="Imprimir boletín de calificaciones completo"
                                                >
                                                    <i className="fa-solid fa-print"></i>
                                                </button>
                                            </td>

                                            {/* Botón Aprobar */}
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    className={`calgen-btn-aprobar${esAprobada ? ' aprobado' : ''}`}
                                                    onClick={() => toggleAprobar(est.id)}
                                                    disabled={!tieneCal || esPublicada}
                                                    title={esAprobada ? 'Quitar aprobación' : 'Aprobar calificación'}
                                                >
                                                    <i className="fa-solid fa-thumbs-up"></i>
                                                </button>
                                            </td>

                                            {/* Nombre */}
                                            <td>
                                                <div className="calgen-nombre">
                                                    {est.apellido}, {est.nombre}
                                                </div>
                                                {est.apodo && (
                                                    <div className="calgen-apodo">"{est.apodo}"</div>
                                                )}
                                            </td>

                                            {/* Calificación */}
                                            <td>
                                                {tieneCal ? (
                                                    <span
                                                        className={`calgen-valor ${valorNum !== null
                                                            ? valorNum >= 6 ? 'aprobado' : 'reprobado'
                                                            : ''
                                                            }`}
                                                    >
                                                        {val.valor}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>
                                                )}
                                            </td>

                                            {/* Observación */}
                                            <td>
                                                <input
                                                    type="text"
                                                    className="calgen-input-obs"
                                                    value={val?.observacion || ''}
                                                    onChange={(e) => handleObservacionChange(est.id, e.target.value)}
                                                    onBlur={() => handleObservacionBlur(est.id)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                                                    disabled={esAprobada || esPublicada}
                                                    placeholder="Escribir observación..."
                                                />
                                            </td>

                                            {/* Estado */}
                                            <td>
                                                <BadgeEstado estado={estado} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Footer / Publicar ── */}
                    <div className="calgen-footer">
                        <div className="calgen-footer-info">
                            {todasListasParaPublicar
                                ? <span className="text-success fw-semibold"><i className="fa-solid fa-circle-check me-1"></i>Todas las calificaciones están aprobadas y listas para publicar.</span>
                                : <span>Aprobá todas las calificaciones cargadas para habilitar la publicación.</span>
                            }
                        </div>
                        <button
                            className="calgen-btn-publicar"
                            onClick={publicarCalificaciones}
                            disabled={!todasListasParaPublicar || publicadas}
                        >
                            <i className="fa-solid fa-bullhorn"></i>
                            {publicadas ? 'Calificaciones publicadas' : 'Publicar calificaciones'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CalificacionesGeneral;
