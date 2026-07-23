import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { show_alerta } from '../../funciones.js';
import CONFIG from '../../config.js';
import RegistroPagoModal from './RegistroPagoModal.js';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const URL_CUOTAS = `${CONFIG.API_URL}/operarCuotas.php`;

function SeguimientoCuotas({ cohortes, selectedStudentId, onClearSelectedStudent }) {
    const [cohorteId, setCohorteId] = useState('');
    const [buscar, setBuscar] = useState('');
    const [estudiantes, setEstudiantes] = useState([]);
    const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
    const [cuotasEstudiante, setCuotasEstudiante] = useState([]);
    const [cuotasACobrar, setCuotasACobrar] = useState(null);
    const [cuotasSeleccionadasIds, setCuotasSeleccionadasIds] = useState([]);
    const [cargandoLista, setCargandoLista] = useState(false);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);

    const mesesNombres = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    useEffect(() => {
        obtenerEstudiantes();
    }, [buscar, cohorteId]);

    // Escuchar si viene un estudiante seleccionado desde fuera (ej. UsuariosLista)
    useEffect(() => {
        if (selectedStudentId) {
            seleccionarEstudiantePorId(selectedStudentId);
        }
    }, [selectedStudentId]);

    const obtenerEstudiantes = async () => {
        setCargandoLista(true);
        try {
            const res = await axios.get(`${URL_CUOTAS}?accion=buscar_estudiantes&buscar=${buscar}&cohorte=${cohorteId}`);
            if (res.data.success) {
                setEstudiantes(res.data.estudiantes || []);
            } else {
                setEstudiantes([]);
            }
        } catch (err) {
            console.error(err);
            setEstudiantes([]);
        } finally {
            setCargandoLista(false);
        }
    };

    const seleccionarEstudiantePorId = async (id) => {
        setCargandoDetalle(true);
        try {
            const res = await axios.get(`${URL_CUOTAS}?accion=estudiante_cuotas&id_estudiante=${id}`);
            if (res.data.success) {
                setEstudianteSeleccionado(res.data.alumno);
                // Agregar ID de estudiante a los datos de la cuota
                setCuotasEstudiante(res.data.cuotas || []);
            setCuotasSeleccionadasIds([]);
            } else {
                show_alerta('Error al obtener las cuotas del alumno.', 'error');
            }
        } catch (err) {
            console.error(err);
            show_alerta('Error de conexión al cargar cuotas.', 'error');
        } finally {
            setCargandoDetalle(false);
        }
    };

    const handleSeleccionarEstudiante = (est) => {
        if (onClearSelectedStudent) onClearSelectedStudent(); // Limpiar si venía de redirección
        seleccionarEstudiantePorId(est.id);
    };

    const handleRevertirPago = (cuota) => {
        const MySwal = withReactContent(Swal);
        MySwal.fire({
            title: '¿Revertir pago de cuota?',
            text: 'La cuota volverá a estado "pendiente" y se eliminará el registro de pago y comprobante asociado.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, revertir cobro',
            cancelButtonText: 'Cancelar',
            customClass: {
                confirmButton: 'btn btn-warning mx-2 text-dark',
                cancelButton: 'btn btn-outline-secondary mx-2'
            },
            buttonsStyling: false
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await axios.put(URL_CUOTAS, {
                        accion: 'actualizar_estado',
                        id_cuota: cuota.id,
                        estado: 'pendiente'
                    });
                    if (res.data.success) {
                        show_alerta('Pago revertido con éxito.', 'success');
                        seleccionarEstudiantePorId(estudianteSeleccionado.id || selectedStudentId);
                    } else {
                        show_alerta(res.data.mensaje, 'error');
                    }
                } catch (err) {
                    console.error(err);
                    show_alerta('Error al revertir el cobro.', 'error');
                }
            }
        });
    };

    const handleEliminarCuota = (cuotaId) => {
        const MySwal = withReactContent(Swal);
        MySwal.fire({
            title: '¿Eliminar esta cuota?',
            text: 'Esta acción es irreversible y eliminará los registros contables vinculados.',
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
                try {
                    const res = await axios({
                        method: 'DELETE',
                        url: URL_CUOTAS,
                        data: {
                            accion: 'eliminar_cuota',
                            id: cuotaId
                        }
                    });
                    if (res.data.success) {
                        show_alerta('Cuota eliminada correctamente.', 'success');
                        seleccionarEstudiantePorId(estudianteSeleccionado.id || selectedStudentId);
                    } else {
                        show_alerta(res.data.mensaje, 'error');
                    }
                } catch (err) {
                    console.error(err);
                    show_alerta('Error al eliminar la cuota.', 'error');
                }
            }
        });
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
    };

    const handleCheckboxChange = (cuotaId) => {
        setCuotasSeleccionadasIds(prev => 
            prev.includes(cuotaId) ? prev.filter(id => id !== cuotaId) : [...prev, cuotaId]
        );
    };

    const handleCobrarSeleccionadas = () => {
        const cuotasAProcesar = cuotasEstudiante.filter(c => cuotasSeleccionadasIds.includes(c.id));
        if (cuotasAProcesar.length > 0) {
            setCuotasACobrar(cuotasAProcesar);
        }
    };

    return (
        <div className="row g-3">
            {/* Listado Izquierdo */}
            <div className="col-12 col-md-4">
                <div className="card shadow-sm border-0 p-3 rounded-3 h-100">
                    <h5 className="fw-bold text-muted mb-3"><i className="fa-solid fa-graduation-cap me-2"></i>Alumnos</h5>
                    
                    {/* Filtros */}
                    <div className="mb-2">
                        <select
                            className="form-select mb-2 border-2"
                            value={cohorteId}
                            onChange={e => setCohorteId(e.target.value)}
                        >
                            <option value="">Todas las cohortes...</option>
                            {cohortes.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.nombre_formacion} ({item.año})
                                </option>
                            ))}
                        </select>
                        <div className="input-group">
                            <span className="input-group-text border-2 bg-light"><i className="fa-solid fa-magnifying-glass text-secondary"></i></span>
                            <input
                                type="text"
                                className="form-control border-2"
                                placeholder="Buscar por nombre o DNI..."
                                value={buscar}
                                onChange={e => setBuscar(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Lista */}
                    <div className="list-group list-group-flush overflow-auto mt-2" style={{ maxHeight: '450px' }}>
                        {cargandoLista ? (
                            <div className="text-center py-4">
                                <span className="spinner-border spinner-border-sm text-primary me-2" role="status"></span>
                                Buscando alumnos...
                            </div>
                        ) : estudiantes.length === 0 ? (
                            <div className="text-center py-4 text-muted">No se encontraron estudiantes.</div>
                        ) : (
                            estudiantes.map(est => {
                                const total = parseInt(est.pagadas) + parseInt(est.pendientes) + parseInt(est.vencidas);
                                const pct = total > 0 ? (parseInt(est.pagadas) / total) * 100 : 0;
                                const isSelected = (estudianteSeleccionado && estudianteSeleccionado.id === est.id) || (selectedStudentId === est.id);

                                return (
                                    <button
                                        key={est.id}
                                        type="button"
                                        className={`list-group-item list-group-item-action border-0 rounded-3 mb-2 p-3 text-start shadow-xs d-flex flex-column gap-1 ${
                                            isSelected ? 'bg-primary text-white bg-opacity-95' : 'bg-light'
                                        }`}
                                        onClick={() => handleSeleccionarEstudiante(est)}
                                    >
                                        <div className="d-flex justify-content-between align-items-start w-100">
                                            <span className="fw-bold">{est.apellido}, {est.nombre}</span>
                                            {parseInt(est.vencidas) > 0 && (
                                                <span className={`badge ${isSelected ? 'bg-white text-danger' : 'bg-danger'} rounded-pill`}>
                                                    {est.vencidas} vencida/s
                                                </span>
                                            )}
                                        </div>
                                        <span className={`small ${isSelected ? 'text-white-50' : 'text-muted'}`}>DNI: {est.documento}</span>
                                        
                                        {/* Barra de progreso de pago del alumno */}
                                        <div className="mt-2 w-100">
                                            <div className="d-flex justify-content-between small opacity-75 mb-1">
                                                <span>Pagado: {est.pagadas} / {total} cuotas</span>
                                                <span>{pct.toFixed(0)}%</span>
                                            </div>
                                            <div className="progress" style={{ height: '6px' }}>
                                                <div 
                                                    className={`progress-bar ${isSelected ? 'bg-white' : 'bg-success'}`} 
                                                    role="progressbar" 
                                                    style={{ width: `${pct}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Detalle Derecho */}
            <div className="col-12 col-md-8">
                <div className="card shadow-sm border-0 p-4 rounded-3 h-100 bg-white">
                    {cargandoDetalle ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary mb-3" role="status"></div>
                            <h5 className="text-muted">Cargando historial del estudiante...</h5>
                        </div>
                    ) : !estudianteSeleccionado ? (
                        <div className="text-center py-5 text-muted d-flex flex-column justify-content-center align-items-center h-100">
                            <i className="fa-solid fa-address-card fs-1 text-secondary opacity-25 mb-3"></i>
                            <h5>Seleccione un estudiante del listado para ver su historial de cuotas</h5>
                            <p className="small text-muted-50">Aquí podrá registrar pagos en efectivo/transferencia y cargar comprobantes.</p>
                        </div>
                    ) : (
                        <div>
                            {/* Cabecera del Estudiante */}
                            <div className="d-flex justify-content-between align-items-center pb-3 border-bottom mb-4">
                                <div>
                                    <h4 className="fw-bold mb-0 text-dark">{estudianteSeleccionado.apellido}, {estudianteSeleccionado.nombre}</h4>
                                    <span className="text-secondary small">DNI: {estudianteSeleccionado.documento} | Usuario: {estudianteSeleccionado.usuario}</span>
                                </div>
                                <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill" onClick={() => setEstudianteSeleccionado(null)}>
                                    <i className="fa-solid fa-times me-1"></i> Cerrar detalle
                                </button>
                            </div>

                            {/* Listado de Cuotas */}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-semibold text-muted mb-0">Historial de Cuotas</h5>
                                {cuotasSeleccionadasIds.length > 0 && (
                                    <button 
                                        type="button" 
                                        className="btn btn-sm btn-success bg-gradient rounded-pill px-3 shadow-sm"
                                        onClick={handleCobrarSeleccionadas}
                                    >
                                        <i className="fa-solid fa-cash-register me-2"></i> 
                                        Cobrar {cuotasSeleccionadasIds.length} seleccionadas
                                    </button>
                                )}
                            </div>
                            {cuotasEstudiante.length === 0 ? (
                                <div className="alert alert-warning text-center rounded-3">
                                    El estudiante no registra cuotas asignadas en el período actual.
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table align-middle table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="text-center" style={{width: '40px'}}>
                                                    {/* Select all could go here, omitting for simplicity */}
                                                </th>
                                                <th>Período</th>
                                                <th>Vencimiento</th>
                                                <th className="text-end">Monto Original</th>
                                                <th className="text-end">Descuento/Recargo</th>
                                                <th className="text-end">Monto Final</th>
                                                <th className="text-center">Estado</th>
                                                <th className="text-end">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cuotasEstudiante.map(cu => {
                                                const original = parseFloat(cu.monto_original);
                                                const final = parseFloat(cu.monto_final);
                                                const desc = parseFloat(cu.descuento || 0);
                                                const rec = parseFloat(cu.recargo || 0);
                                                const esVencida = cu.estado !== 'pagado' && new Date(cu.fecha_vencimiento) < new Date();

                                                let badgeClass = 'bg-warning text-dark';
                                                let badgeLabel = 'Pendiente';

                                                if (cu.estado === 'pagado') {
                                                    badgeClass = 'bg-success text-white';
                                                    badgeLabel = 'Pagada';
                                                } else if (esVencida || cu.estado === 'vencido') {
                                                    badgeClass = 'bg-danger text-white';
                                                    badgeLabel = 'Vencida';
                                                }

                                                return (
                                                    <tr key={cu.id}>
                                                        <td className="text-center align-middle">
                                                            {cu.estado !== 'pagado' && (
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="form-check-input" 
                                                                    checked={cuotasSeleccionadasIds.includes(cu.id)}
                                                                    onChange={() => handleCheckboxChange(cu.id)}
                                                                />
                                                            )}
                                                        </td>
                                                        <td className="fw-semibold">
                                                            {mesesNombres[cu.mes - 1]} / {cu.anio}
                                                        </td>
                                                        <td className="small text-secondary">
                                                            {new Date(cu.fecha_vencimiento).toLocaleDateString('es-AR')}
                                                        </td>
                                                        <td className="text-end">{formatCurrency(original)}</td>
                                                        <td className="text-end text-muted small">
                                                            {desc > 0 && <span className="text-success">-{formatCurrency(desc)} </span>}
                                                            {rec > 0 && <span className="text-danger">+{formatCurrency(rec)}</span>}
                                                            {desc === 0 && rec === 0 && '-'}
                                                        </td>
                                                        <td className="text-end fw-bold text-dark">{formatCurrency(final)}</td>
                                                        <td className="text-center">
                                                            <span className={`badge ${badgeClass} px-2.5 py-1.5 rounded-pill fw-semibold small`}>
                                                                {badgeLabel}
                                                            </span>
                                                        </td>
                                                        <td className="text-end">
                                                            <div className="d-flex justify-content-end gap-1.5">
                                                                {cu.estado !== 'pagado' ? (
                                                                    <>
                                                                        <button 
                                                                            type="button" 
                                                                            className="btn btn-sm btn-outline-secondary rounded-circle shadow-sm"
                                                                            onClick={() => handleEliminarCuota(cu.id)}
                                                                            title="Eliminar cuota"
                                                                        >
                                                                            <i className="fa-solid fa-trash-can"></i>
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {cu.archivo_comprobante && (
                                                                            <a 
                                                                                href={`${CONFIG.API_URL}/uploads/comprobantes/${cu.archivo_comprobante}`} 
                                                                                target="_blank" 
                                                                                rel="noopener noreferrer" 
                                                                                className="btn btn-sm btn-outline-info rounded-pill px-2.5 shadow-sm"
                                                                                title="Ver comprobante de pago subido"
                                                                            >
                                                                                <i className="fa-solid fa-file-pdf me-1"></i> Recibo
                                                                            </a>
                                                                        )}
                                                                        <button 
                                                                            type="button" 
                                                                            className="btn btn-sm btn-outline-warning text-dark rounded-pill px-2.5 shadow-sm"
                                                                            onClick={() => handleRevertirPago(cu)}
                                                                            title="Deshacer cobro y volver a pendiente"
                                                                        >
                                                                            <i className="fa-solid fa-rotate-left me-1"></i> Revertir
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para registrar el cobro */}
            {cuotasACobrar && (
                <RegistroPagoModal
                    cuotas={cuotasACobrar}
                    studentName={`${estudianteSeleccionado.apellido}, ${estudianteSeleccionado.nombre}`}
                    onSaved={() => {
                        setCuotasACobrar(null);
                        setCuotasSeleccionadasIds([]);
                        seleccionarEstudiantePorId(estudianteSeleccionado.id || selectedStudentId);
                    }}
                    onClose={() => setCuotasACobrar(null)}
                />
            )}
        </div>
    );
}

export default SeguimientoCuotas;
