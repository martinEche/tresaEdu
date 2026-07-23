import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CONFIG from '../../config';
import { useNavigate } from 'react-router-dom';
import './css/Reportes.css';
import * as XLSX from 'xlsx';

function Reportes({ acceder, rol, configuracion }) {
    const navigate = useNavigate();
    const [modoActivo, setModoActivo] = useState('estudiantesPorCurso');
    const [datos, setDatos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    // Combinaciones y filtros derivados
    const [combinaciones, setCombinaciones] = useState([]);
    
    const [filtroCiclo, setFiltroCiclo] = useState('');
    const [filtroNivel, setFiltroNivel] = useState('');
    const [filtroOrden, setFiltroOrden] = useState('');
    const [filtroSeccion, setFiltroSeccion] = useState('');
    const [filtroEspacio, setFiltroEspacio] = useState('');

    // Opciones dinámicas para los selects
    const [opcionesCiclos, setOpcionesCiclos] = useState([]);
    const [opcionesNiveles, setOpcionesNiveles] = useState([]);
    const [opcionesOrdenes, setOpcionesOrdenes] = useState([]);
    const [opcionesSecciones, setOpcionesSecciones] = useState([]);
    const [opcionesEspacios, setOpcionesEspacios] = useState([]);

    useEffect(() => {
        if (!acceder || rol >= 5) {
            navigate('/');
            return;
        }
        cargarFiltros();
    }, [acceder, rol, navigate]);

    useEffect(() => {
        cargarDatos();
    }, [modoActivo, filtroCiclo, filtroNivel, filtroOrden, filtroSeccion, filtroEspacio]);

    const cargarFiltros = async () => {
        try {
            const res = await axios.post(`${CONFIG.API_URL}/operarReportes.php`, { modo: 'filtrosOpciones' });
            if (!res.data.error) {
                const comb = res.data.combinaciones || [];
                setCombinaciones(comb);
                
                // Extraer ciclos únicos iniciales
                const ciclosUnicos = [...new Set(comb.map(c => c.ciclo))].sort((a, b) => b.localeCompare(a));
                setOpcionesCiclos(ciclosUnicos);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Efecto para derivar opciones cuando cambian los filtros superiores
    useEffect(() => {
        if (combinaciones.length === 0) return;

        // Filtrar combinaciones basándose en ciclo (si está seleccionado)
        let combisNivel = combinaciones;
        if (filtroCiclo) combisNivel = combisNivel.filter(c => c.ciclo === filtroCiclo);
        
        // Extraer niveles únicos para el selector de nivel
        const nivelesMap = new Map();
        combisNivel.forEach(c => nivelesMap.set(c.nivel_id, c.nivel_nombre));
        setOpcionesNiveles(Array.from(nivelesMap, ([id, nombre]) => ({ id, nombre })));

        // Filtrar para orden
        let combisOrden = combisNivel;
        if (filtroNivel) combisOrden = combisOrden.filter(c => c.nivel_id == filtroNivel);
        
        // Extraer ordenes únicos
        const ordenesUnicos = [...new Set(combisOrden.map(c => c.orden))].sort((a, b) => a - b);
        setOpcionesOrdenes(ordenesUnicos);

        // Filtrar para secciones
        let combisSeccion = combisOrden;
        if (filtroOrden) combisSeccion = combisSeccion.filter(c => c.orden == filtroOrden);

        // Extraer secciones únicas
        const seccionesUnicas = [...new Set(combisSeccion.map(c => c.division))].sort((a, b) => a.localeCompare(b));
        setOpcionesSecciones(seccionesUnicas);

        // Filtrar para espacios
        let combisEspacio = combisSeccion;
        if (filtroSeccion) combisEspacio = combisEspacio.filter(c => c.division == filtroSeccion);

        // Extraer espacios únicos
        const espaciosMap = new Map();
        combisEspacio.forEach(c => espaciosMap.set(c.espacio_id, c.nombre_espacio));
        setOpcionesEspacios(Array.from(espaciosMap, ([id, nombre]) => ({ id, nombre })));

    }, [combinaciones, filtroCiclo, filtroNivel, filtroOrden, filtroSeccion]);

    const cargarDatos = async () => {
        setLoading(true);
        setError(false);
        try {
            const payload = {
                modo: modoActivo,
                ciclo: filtroCiclo,
                nivel: modoActivo === 'estudiantesPorCurso' ? filtroNivel : '',
                orden: modoActivo === 'estudiantesPorCurso' ? filtroOrden : '',
                seccion: modoActivo === 'estudiantesPorCurso' ? filtroSeccion : '',
                espacio: modoActivo === 'estudiantesPorCurso' ? filtroEspacio : ''
            };
            const res = await axios.post(`${CONFIG.API_URL}/operarReportes.php`, payload);
            if (!res.data.error) {
                setDatos(res.data.datos || []);
            } else {
                setError(true);
            }
        } catch (e) {
            setError(true);
        }
        setLoading(false);
    };

    const handleImprimir = () => {
        window.print();
    };

    const handleExportarExcel = () => {
        if (datos.length === 0) return;

        let wb = XLSX.utils.book_new();

        if (modoActivo === 'estudiantesPorCurso') {
            const listado = datos.map((d, i) => {
                let cursoKey = '';
                if (filtroEspacio === 'general') {
                    cursoKey = `${d.ciclo} - ${d.nivel} - Año/Sala: ${d.orden} - Div: ${d.division} (General)`;
                } else {
                    cursoKey = `${d.ciclo} - ${d.nivel} - Año/Sala: ${d.orden} - Div: ${d.division} (${d.nombre_espacio})`;
                }
                
                return {
                    'Curso/Espacio': cursoKey,
                    'Documento': d.documento,
                    'Apellido': d.apellido,
                    'Nombre': d.nombre
                };
            });
            // Eliminar duplicados si es general (ya que el mapeo arriba generaría todas las filas planas antes de agrupar)
            let datosAExportar = listado;
            if (filtroEspacio === 'general') {
                const unicos = [];
                const keys = new Set();
                listado.forEach(item => {
                    const uniqueKey = `${item['Curso/Espacio']}-${item['Documento']}`;
                    if (!keys.has(uniqueKey)) {
                        keys.add(uniqueKey);
                        unicos.push(item);
                    }
                });
                datosAExportar = unicos;
            }

            const ws = XLSX.utils.json_to_sheet(datosAExportar);
            XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");
        } else {
            const totales = datos.map(d => ({
                'Ciclo': d.ciclo,
                'Nivel': d.nivel,
                'Año/Orden': d.orden,
                'División': d.division,
                'Total Estudiantes': parseInt(d.total_estudiantes, 10)
            }));
            const ws = XLSX.utils.json_to_sheet(totales);
            XLSX.utils.book_append_sheet(wb, ws, "Totales");
        }

        XLSX.writeFile(wb, "Reporte_Estudiantes.xlsx");
    };

    // Agrupar estudiantes por curso para la vista
    const renderEstudiantesPorCurso = () => {
        if (datos.length === 0) return <div className="alert alert-info">No se encontraron resultados para los filtros seleccionados.</div>;

        const agrupados = {};
        datos.forEach(d => {
            let key = '';
            if (filtroEspacio === 'general') {
                // Si es general, no dividimos por espacio. Formamos la llave solo con el curso.
                key = `${d.ciclo} - ${d.nivel} - Año/Sala: ${d.orden} - Div: ${d.division} (General)`;
            } else {
                // Si no, mostramos la llave con el espacio.
                key = `${d.ciclo} - ${d.nivel} - Año/Sala: ${d.orden} - Div: ${d.division} (${d.nombre_espacio})`;
            }

            if (!agrupados[key]) agrupados[key] = [];
            
            // Si es general, evitar duplicados (un mismo alumno puede estar en varios espacios del mismo curso)
            if (filtroEspacio === 'general') {
                const existe = agrupados[key].find(est => est.estudiante_id === d.estudiante_id);
                if (!existe) {
                    agrupados[key].push(d);
                }
            } else {
                agrupados[key].push(d);
            }
        });

        return (
            <div className="reporte-lista">
                {Object.keys(agrupados).map((curso, idx) => (
                    <div key={idx} className="mb-4 reporte-bloque">
                        <h5 className="border-bottom pb-2 mb-3 bg-light p-2 rounded">{curso} <span className="badge bg-secondary float-end">Total: {agrupados[curso].length}</span></h5>
                        <table className="table table-sm table-striped border">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Documento</th>
                                    <th>Apellido y Nombre</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agrupados[curso].map((est, i) => (
                                    <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td>{est.documento}</td>
                                        <td>{est.apellido}, {est.nombre}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        );
    };

    const renderCantidadEstudiantes = () => {
        if (datos.length === 0) return <div className="alert alert-info">No se encontraron resultados para los filtros seleccionados.</div>;

        const totalGeneral = datos.reduce((acc, curr) => acc + parseInt(curr.total_estudiantes, 10), 0);

        return (
            <div className="reporte-lista">
                <table className="table table-bordered table-striped">
                    <thead className="table-dark">
                        <tr>
                            <th>Ciclo</th>
                            <th>Nivel</th>
                            <th>Año/Orden</th>
                            <th>División</th>
                            <th className="text-end">Total Estudiantes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {datos.map((d, i) => (
                            <tr key={i}>
                                <td>{d.ciclo}</td>
                                <td>{d.nivel}</td>
                                <td>{d.orden}</td>
                                <td>{d.division}</td>
                                <td className="text-end fw-bold">{d.total_estudiantes}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="table-secondary">
                            <td colSpan="4" className="text-end fw-bold">TOTAL GENERAL</td>
                            <td className="text-end fw-bold">{totalGeneral}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        );
    };

    return (
        <div className="container-principal">
            <div className="d-flex justify-content-between align-items-center mb-4 no-print">
                <h2><i className="fa-solid fa-chart-pie me-2"></i> Reportes</h2>
                <div>
                    <button className="btn btn-success me-2" onClick={handleExportarExcel}><i className="fa-solid fa-file-excel me-2"></i> Exportar a Excel</button>
                    <button className="btn btn-primary" onClick={handleImprimir}><i className="fa-solid fa-print me-2"></i> Imprimir Reporte</button>
                </div>
            </div>

            <div className="card shadow mb-4 no-print">
                <div className="card-body">
                    <h5 className="card-title">Filtros</h5>
                    <div className="row g-3">
                        <div className={modoActivo === 'estudiantesPorCurso' ? "col-md-2" : "col-md-4"}>
                            <label className="form-label">Ciclo</label>
                            <select className="form-select form-select-sm" value={filtroCiclo} onChange={e => {setFiltroCiclo(e.target.value); setFiltroNivel(''); setFiltroOrden(''); setFiltroSeccion(''); setFiltroEspacio('');}}>
                                <option value="">Todos</option>
                                {opcionesCiclos.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        {modoActivo === 'estudiantesPorCurso' && (
                            <>
                                <div className="col-md-3">
                                    <label className="form-label">Nivel</label>
                                    <select className="form-select form-select-sm" value={filtroNivel} onChange={e => {setFiltroNivel(e.target.value); setFiltroOrden(''); setFiltroSeccion(''); setFiltroEspacio('');}}>
                                        <option value="">Todos</option>
                                        {opcionesNiveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label">Año/Orden</label>
                                    <select className="form-select form-select-sm" value={filtroOrden} onChange={e => {setFiltroOrden(e.target.value); setFiltroSeccion(''); setFiltroEspacio('');}}>
                                        <option value="">Todos</option>
                                        {opcionesOrdenes.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label">División</label>
                                    <select className="form-select form-select-sm" value={filtroSeccion} onChange={e => {setFiltroSeccion(e.target.value); setFiltroEspacio('');}}>
                                        <option value="">Todas</option>
                                        {opcionesSecciones.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Espacio</label>
                                    <select className="form-select form-select-sm" value={filtroEspacio} onChange={e => setFiltroEspacio(e.target.value)}>
                                        <option value="">Todos</option>
                                        <option value="general" className="fw-bold bg-light">General (Sin separar)</option>
                                        {opcionesEspacios.map(esp => <option key={esp.id} value={esp.id}>{esp.nombre}</option>)}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="nav nav-tabs mb-4 no-print" id="nav-tab" role="tablist">
                <button className={`nav-link ${modoActivo === 'estudiantesPorCurso' ? 'active' : ''}`} onClick={() => setModoActivo('estudiantesPorCurso')} type="button">Estudiantes por Curso en Lista</button>
                <button className={`nav-link ${modoActivo === 'cantidadEstudiantes' ? 'active' : ''}`} onClick={() => setModoActivo('cantidadEstudiantes')} type="button">Totales por Curso</button>
            </div>

            <div className="print-header mb-4 text-center">
                <h3>{modoActivo === 'estudiantesPorCurso' ? 'Reporte: Estudiantes por Curso en Lista' : 'Reporte: Totales por Curso'}</h3>
                <p className="text-muted">
                    Filtros: Ciclo {filtroCiclo || 'Todos'} 
                    {modoActivo === 'estudiantesPorCurso' && (
                        <> | Nivel {filtroNivel ? opcionesNiveles.find(n => n.id == filtroNivel)?.nombre : 'Todos'} | Orden {filtroOrden || 'Todos'} | Div {filtroSeccion || 'Todas'} | Esp {filtroEspacio === 'general' ? 'General' : (filtroEspacio ? opcionesEspacios.find(e => e.id == filtroEspacio)?.nombre : 'Todos')}</>
                    )}
                </p>
                <hr />
            </div>

            {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>
            ) : error ? (
                <div className="alert alert-danger">Ocurrió un error al cargar los datos.</div>
            ) : (
                <div className="reporte-content">
                    {modoActivo === 'estudiantesPorCurso' && renderEstudiantesPorCurso()}
                    {modoActivo === 'cantidadEstudiantes' && renderCantidadEstudiantes()}
                </div>
            )}
        </div>
    );
}

export default Reportes;
