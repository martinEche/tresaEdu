import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { show_alerta } from '../../funciones.js';
import CONFIG from '../../config.js';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const URL_CUOTAS = `${CONFIG.API_URL}/operarCuotas.php`;

function GeneradorCuotas({ cohortes, mesesGeneradosTodos, onRefresh }) {
    const [cohorte, setCohorte] = useState('');
    const [mes, setMes] = useState('');
    const [montoOriginal, setMontoOriginal] = useState('');
    const [iva, setIva] = useState(21);
    const [fechaVencimiento, setFechaVencimiento] = useState('');
    const [mesesGeneradosCohorte, setMesesGeneradosCohorte] = useState([]);
    const [cargando, setCargando] = useState(false);

    const mesesNombres = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Consultar qué meses ya fueron generados para la cohorte seleccionada
    const obtenerMesesGeneradosCohorte = async (cohorteId) => {
        if (!cohorteId) {
            setMesesGeneradosCohorte([]);
            return;
        }
        try {
            const res = await axios.get(`${URL_CUOTAS}?cohorte=${cohorteId}`);
            if (res.data.success) {
                setMesesGeneradosCohorte(res.data.mesesGenerados || []);
            } else {
                setMesesGeneradosCohorte([]);
            }
        } catch (err) {
            console.error(err);
            setMesesGeneradosCohorte([]);
        }
    };

    const handleGenerar = async (e) => {
        e.preventDefault();
        if (!cohorte || !mes || !montoOriginal || !fechaVencimiento) {
            show_alerta('Debe completar todos los campos del formulario', 'warning');
            return;
        }

        setCargando(true);
        try {
            const res = await axios.post(URL_CUOTAS, {
                cohorte,
                mes: parseInt(mes),
                monto_original: parseFloat(montoOriginal),
                iva: parseFloat(iva),
                fecha_vencimiento: fechaVencimiento
            });

            if (res.data.success) {
                show_alerta('Cuotas mensuales generadas con éxito para todos los alumnos de la cohorte.', 'success');
                setCohorte('');
                setMes('');
                setMontoOriginal('');
                setFechaVencimiento('');
                setMesesGeneradosCohorte([]);
                onRefresh(); // Refrescar métricas e historial en componente principal
            } else {
                show_alerta('Error: ' + res.data.mensaje, 'error');
            }
        } catch (err) {
            console.error(err);
            show_alerta('Error al conectar con el servidor para generar cuotas.', 'error');
        } finally {
            setCargando(false);
        }
    };

    const handleRevertirGeneracion = (item) => {
        const MySwal = withReactContent(Swal);
        MySwal.fire({
            title: '¿Revertir esta generación de cuota/s?',
            html: `<div class="text-start">
                    <p>Se eliminarán todas las cuotas de <strong>${item.nombre_formacion}</strong> para el mes <strong>${mesesNombres[item.mes - 1]} / ${item.anio}</strong>.</p>
                    <small class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Esta acción solo es posible si ningún alumno ha realizado un pago aún.</small>
                   </div>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, revertir generación',
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
                            accion: 'eliminar_mes_generado',
                            cohorte: item.cohorte,
                            mes: item.mes,
                            anio: item.anio
                        }
                    });
                    if (res.data.success) {
                        show_alerta('Generación revertida y cuotas pendientes eliminadas correctamente.', 'success');
                        onRefresh();
                    } else {
                        show_alerta(res.data.mensaje, 'error');
                    }
                } catch (err) {
                    console.error(err);
                    show_alerta('Error al intentar revertir la generación.', 'error');
                }
            }
        });
    };

    const handleAgregarFaltantes = (item) => {
        const MySwal = withReactContent(Swal);
        MySwal.fire({
            title: '¿Buscar y facturar estudiantes faltantes?',
            html: `<div class="text-start">
                    <p>Se buscarán alumnos inscritos en la cohorte <strong>${item.nombre_formacion} (${item.anio})</strong> que aún no tengan cuotas generadas para el período <strong>${mesesNombres[item.mes - 1]} / ${item.anio}</strong>.</p>
                    <p>Si se encuentran, se generará su cuota correspondiente usando el monto original y vencimiento de este período.</p>
                   </div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, buscar y facturar',
            cancelButtonText: 'Cancelar',
            customClass: {
                confirmButton: 'btn btn-primary mx-2',
                cancelButton: 'btn btn-outline-secondary mx-2'
            },
            buttonsStyling: false
        }).then(async (result) => {
            if (result.isConfirmed) {
                setCargando(true);
                try {
                    const res = await axios.post(URL_CUOTAS, {
                        accion: 'facturar_faltantes',
                        cohorte: parseInt(item.cohorte),
                        mes: parseInt(item.mes),
                        anio: parseInt(item.anio)
                    });
                    if (res.data.success) {
                        show_alerta(res.data.mensaje, 'success');
                        onRefresh(); // Refrescar métricas e historial
                    } else {
                        show_alerta(res.data.mensaje, 'warning');
                    }
                } catch (err) {
                    console.error(err);
                    show_alerta('Error al conectar con el servidor para facturar estudiantes faltantes.', 'error');
                } finally {
                    setCargando(false);
                }
            }
        });
    };

    return (
        <div className="row">
            {/* Formulario */}
            <div className="col-12 col-md-5 mb-4">
                <div className="card shadow-sm border-0 p-4 rounded-3 bg-light bg-opacity-70 h-100">
                    <h5 className="fw-bold mb-3 text-primary"><i className="fa-solid fa-calculator me-2"></i>Generar Nueva Cuota/s</h5>
                    <form onSubmit={handleGenerar}>
                        {/* Selección de Cohorte */}
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Cohorte / Formación</label>
                            <select
                                className="form-select border-2"
                                value={cohorte}
                                onChange={e => {
                                    setCohorte(e.target.value);
                                    obtenerMesesGeneradosCohorte(e.target.value);
                                }}
                                required
                            >
                                <option value="">Seleccione una cohorte...</option>
                                {cohortes.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.nombre_formacion} ({item.año}) - Nivel: {item.nivel}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selección de Mes */}
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Mes de la Cuota</label>
                            <select
                                className="form-select border-2"
                                value={mes}
                                onChange={e => setMes(e.target.value)}
                                disabled={!cohorte}
                                required
                            >
                                <option value="">Seleccione el mes...</option>
                                {mesesNombres.map((m, index) => {
                                    const numeroMes = index + 1;
                                    // Deshabilitar los meses que ya fueron generados
                                    const yaGenerado = mesesGeneradosCohorte.includes(numeroMes);
                                    return (
                                        <option key={numeroMes} value={numeroMes} disabled={yaGenerado}>
                                            {m} {yaGenerado ? '(Ya Generado)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Monto Original y Monto de IVA */}
                        <div className="row mb-3 g-3">
                            <div className="col-md-7">
                                <label className="form-label fw-semibold">Monto Neto Original ($)</label>
                                <div className="input-group">
                                    <span className="input-group-text">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="1"
                                        className="form-control border-2"
                                        placeholder="Ej: 15000"
                                        value={montoOriginal}
                                        onChange={e => setMontoOriginal(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="col-md-5">
                                <label className="form-label fw-semibold">IVA (%)</label>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        className="form-control border-2"
                                        placeholder="Ej: 21"
                                        value={iva}
                                        onChange={e => setIva(e.target.value)}
                                        required
                                    />
                                    <span className="input-group-text">%</span>
                                </div>
                            </div>
                            <div className="col-12 form-text text-muted small mt-1">
                                * Se le aplicará el porcentaje de IVA especificado al monto final facturado.
                            </div>
                        </div>

                        {/* Fecha de Vencimiento */}
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Fecha de Vencimiento</label>
                            <input
                                type="date"
                                className="form-control border-2"
                                value={fechaVencimiento}
                                onChange={e => setFechaVencimiento(e.target.value)}
                                required
                            />
                        </div>

                        {/* Botón generar */}
                        <button
                            type="submit"
                            className="btn btn-primary bg-gradient w-100 py-2 fw-semibold rounded-3"
                            disabled={cargando || !cohorte || !mes}
                        >
                            {cargando ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Generando cuotas...
                                </>
                            ) : (
                                <><i className="fa-solid fa-circle-plus me-2"></i>Generar Cuotas Mensuales</>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Historial de periodos generados */}
            <div className="col-12 col-md-7 mb-4">
                <div className="card shadow-sm border-0 p-4 rounded-3 h-100">
                    <h5 className="fw-bold mb-3 text-muted"><i className="fa-solid fa-list-check me-2"></i>Historial de Períodos Facturados</h5>
                    {mesesGeneradosTodos.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="fa-solid fa-folder-open fs-2 mb-2 d-block"></i>
                            No se han facturado períodos mensuales aún.
                        </div>
                    ) : (
                        <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                            <table className="table table-hover align-middle">
                                <thead className="table-light sticky-top">
                                    <tr>
                                        <th>Formación / Cohorte</th>
                                        <th className="text-center">Período</th>
                                        <th className="text-center">Fecha Creación</th>
                                        <th className="text-end">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mesesGeneradosTodos.map((cu) => (
                                        <tr key={cu.id}>
                                            <td>
                                                <span className="fw-semibold text-dark">{cu.nombre_formacion}</span>
                                                <div className="text-muted small">Cohorte {cu.anio}</div>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-info bg-opacity-10 text-info fw-bold py-2 px-3 rounded-pill">
                                                    {mesesNombres[cu.mes - 1]} / {cu.anio}
                                                </span>
                                            </td>
                                            <td className="text-center small text-secondary">
                                                {new Date(cu.fecha_creacion).toLocaleDateString('es-AR')}
                                            </td>
                                            <td className="text-end">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary shadow-sm rounded-3 me-2"
                                                    onClick={() => handleAgregarFaltantes(cu)}
                                                    title="Facturar alumnos agregados recientemente"
                                                >
                                                    <i className="fa-solid fa-user-plus me-1"></i> Facturar Faltantes
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger shadow-sm rounded-3"
                                                    onClick={() => handleRevertirGeneracion(cu)}
                                                    title="Revertir generación de cuota/s del período"
                                                >
                                                    <i className="fa-solid fa-trash-can me-1"></i> Deshacer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default GeneradorCuotas;
