import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { show_alerta } from '../../funciones.js';
import CONFIG from '../../config.js';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const URL_CUOTAS = `${CONFIG.API_URL}/operarCuotas.php`;

function AlertasMora({ onSelectStudent, onRefresh }) {
    const [alertas, setAlertas] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [enviandoAlertaId, setEnviandoAlertaId] = useState(null);

    const mesesNombres = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    useEffect(() => {
        obtenerAlertas();
    }, []);

    const obtenerAlertas = async () => {
        setCargando(true);
        try {
            const res = await axios.get(`${URL_CUOTAS}?accion=alertas`);
            if (res.data.success) {
                setAlertas(res.data.alertas || []);
            } else {
                setAlertas([]);
            }
        } catch (err) {
            console.error(err);
            setAlertas([]);
        } finally {
            setCargando(false);
        }
    };

    const handleEnviarNotificacion = async (alerta) => {
        setEnviandoAlertaId(alerta.id);
        const periodo = `${mesesNombres[alerta.mes - 1]} / ${alerta.anio}`;
        const fechaVenc = new Date(alerta.fecha_vencimiento).toLocaleDateString('es-AR');
        
        try {
            const res = await axios.post(URL_CUOTAS, {
                accion: 'crear_notificacion',
                id_usuario: alerta.id_usuario,
                titulo: 'Aviso de Deuda: Cuota Escolar Vencida',
                desarrollo: `Estimado estudiante, le recordamos que posee una cuota pendiente del período ${periodo} con vencimiento el ${fechaVenc}. Le solicitamos regularizar su situación. Muchas gracias.`
            });

            if (res.data.success) {
                show_alerta(`Alerta de mora enviada correctamente al portal del estudiante ${alerta.apellido}, ${alerta.nombre}.`, 'success');
            } else {
                show_alerta('Error al registrar la notificación en la base de datos.', 'error');
            }
        } catch (err) {
            console.error(err);
            show_alerta('Error de conexión al enviar alerta.', 'error');
        } finally {
            setEnviandoAlertaId(null);
        }
    };

    const handleEnviarTodasAlertas = () => {
        const MySwal = withReactContent(Swal);
        MySwal.fire({
            title: '¿Enviar alertas masivas?',
            text: `Se enviará una notificación individual al portal de los ${alertas.length} estudiantes con cuotas vencidas.`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Sí, enviar a todos',
            cancelButtonText: 'Cancelar',
            customClass: {
                confirmButton: 'btn btn-primary mx-2',
                cancelButton: 'btn btn-outline-secondary mx-2'
            },
            buttonsStyling: false
        }).then(async (result) => {
            if (result.isConfirmed) {
                let exitos = 0;
                let fallidos = 0;
                
                // Mostrar spinner de SweetAlert
                Swal.fire({
                    title: 'Enviando notificaciones...',
                    html: 'Por favor, espere un momento.',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                for (let alertItem of alertas) {
                    try {
                        const periodo = `${mesesNombres[alertItem.mes - 1]} / ${alertItem.anio}`;
                        const fechaVenc = new Date(alertItem.fecha_vencimiento).toLocaleDateString('es-AR');
                        const res = await axios.post(URL_CUOTAS, {
                            accion: 'crear_notificacion',
                            id_usuario: alertItem.id_usuario,
                            titulo: 'Aviso de Deuda: Cuota Escolar Vencida',
                            desarrollo: `Estimado estudiante, le recordamos que posee una cuota pendiente del período ${periodo} con vencimiento el ${fechaVenc}. Le solicitamos regularizar su situación. Muchas gracias.`
                        });
                        if (res.data.success) exitos++;
                        else fallidos++;
                    } catch (e) {
                        fallidos++;
                    }
                }
                
                Swal.close();
                show_alerta(`Proceso finalizado. Alertas enviadas con éxito: ${exitos}. Errores: ${fallidos}.`, 'success');
            }
        });
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
    };

    const calcularDiasMora = (fechaVenc) => {
        const diffTime = Math.abs(new Date() - new Date(fechaVenc));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="card shadow-sm border-0 p-4 rounded-3 bg-white">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center pb-3 border-bottom mb-4 gap-2">
                <div>
                    <h5 className="fw-bold mb-1 text-danger"><i className="fa-solid fa-triangle-exclamation me-2"></i>Alertas de Mora Activas</h5>
                    <span className="text-secondary small">Se muestran las cuotas que están pendientes de pago y han superado su fecha de vencimiento.</span>
                </div>
                {alertas.length > 0 && (
                    <button 
                        type="button" 
                        className="btn btn-danger bg-gradient rounded-3 shadow-sm px-3 fw-semibold text-white btn-sm"
                        onClick={handleEnviarTodasAlertas}
                    >
                        <i className="fa-solid fa-bullhorn me-1"></i> Notificar a Todos
                    </button>
                )}
            </div>

            {cargando ? (
                <div className="text-center py-5 text-muted">
                    <span className="spinner-border spinner-border-sm text-danger me-2" role="status"></span>
                    Cargando deudas vencidas...
                </div>
            ) : alertas.length === 0 ? (
                <div className="text-center py-5 text-success d-flex flex-column align-items-center justify-content-center">
                    <i className="fa-solid fa-circle-check fs-1 opacity-25 mb-3"></i>
                    <h5>¡No hay alertas de mora pendientes!</h5>
                    <p className="small text-muted mb-0">Todos los estudiantes están al día con sus pagos o sus cuotas aún no han vencido.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table align-middle table-hover">
                        <thead className="table-light">
                            <tr>
                                <th>Estudiante</th>
                                <th>DNI</th>
                                <th className="text-center">Período Adeudado</th>
                                <th className="text-center">Vencimiento</th>
                                <th className="text-center">Días en Mora</th>
                                <th className="text-end">Monto Adeudado</th>
                                <th className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alertas.map((al) => {
                                const diasMora = calcularDiasMora(al.fecha_vencimiento);
                                return (
                                    <tr key={al.id}>
                                        <td className="fw-bold text-dark">{al.apellido}, {al.nombre}</td>
                                        <td className="text-secondary small">{al.documento}</td>
                                        <td className="text-center">
                                            <span className="badge bg-danger bg-opacity-10 text-danger fw-bold py-1.5 px-2.5 rounded-pill">
                                                {mesesNombres[al.mes - 1]} / {al.anio}
                                            </span>
                                        </td>
                                        <td className="text-center small text-secondary">
                                            {new Date(al.fecha_vencimiento).toLocaleDateString('es-AR')}
                                        </td>
                                        <td className="text-center fw-semibold text-danger">
                                            {diasMora} días
                                        </td>
                                        <td className="text-end fw-bold text-danger">{formatCurrency(parseFloat(al.monto_final))}</td>
                                        <td className="text-end">
                                            <div className="d-flex justify-content-end gap-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-success bg-gradient rounded-pill shadow-xs px-2.5"
                                                    onClick={() => onSelectStudent(al.id_usuario)}
                                                    title="Ir a cobrar esta cuota"
                                                >
                                                    <i className="fa-solid fa-cash-register me-1"></i> Cobrar
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger rounded-pill shadow-xs px-2.5"
                                                    onClick={() => handleEnviarNotificacion(al)}
                                                    disabled={enviandoAlertaId === al.id}
                                                    title="Enviar notificación de mora al portal del alumno"
                                                >
                                                    {enviandoAlertaId === al.id ? (
                                                        <span className="spinner-border spinner-border-sm" role="status"></span>
                                                    ) : (
                                                        <><i className="fa-solid fa-bell me-1"></i> Alertar</>
                                                    )}
                                                </button>
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
    );
}

export default AlertasMora;
