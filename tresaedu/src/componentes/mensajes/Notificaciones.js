import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import CONFIG from '../../config';
import { useFirebaseCounter } from '../../hooks/useFirebaseCounter';
import { show_alerta } from '../../funciones.js';

const URL = `${CONFIG.API_URL}/operarNotificaciones.php`;

function Notificaciones({ acceder, rol }) {
    const userId = localStorage.getItem('loggedUserId');
    const [notificacionesUsr, setNotificacionesUsr] = useState([]);
    const [filtro, setFiltro] = useState('todas');
    const [cargando, setCargando] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!acceder) {
            localStorage.clear();
            navigate('/');
        } else {
            buscaNotificaciones(userId);
        }
    }, [acceder]);

    const buscaNotificaciones = async (id) => {
        setCargando(true);
        const data = {
            'id': id,
            'modo': 'todas las notificaciones'
        };
        try {
            const res = await axios.post(URL, data);
            if (res.data && !res.data.error) {
                setNotificacionesUsr(res.data.data || []);
            } else {
                setNotificacionesUsr([]);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setNotificacionesUsr([]);
        } finally {
            setCargando(false);
        }
    };

    useFirebaseCounter(
        userId ? `notificaciones/user_${userId}` : null,
        () => {
            buscaNotificaciones(userId);
        }
    );

    const handleMarcarLeida = async (idNoti) => {
        try {
            const res = await axios.post(URL, {
                id: userId,
                modo: 'marcar_leida',
                id_notificacion: idNoti
            });
            if (res.data && !res.data.error) {
                setNotificacionesUsr(prev => 
                    prev.map(noti => noti.id === idNoti ? { ...noti, leida: 1 } : noti)
                );
                window.dispatchEvent(new Event('refreshNotificacionesSinVer'));
            }
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const handleMarcarTodasLeidas = async () => {
        try {
            const res = await axios.post(URL, {
                id: userId,
                modo: 'marcar_leida'
            });
            if (res.data && !res.data.error) {
                setNotificacionesUsr(prev => 
                    prev.map(noti => ({ ...noti, leida: 1 }))
                );
                window.dispatchEvent(new Event('refreshNotificacionesSinVer'));
                show_alerta('Todas las notificaciones marcadas como leídas', 'success');
            }
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const notificacionesFiltradas = notificacionesUsr.filter(noti => {
        if (filtro === 'todas') return true;
        if (filtro === 'leidas') return noti.leida == 1;
        if (filtro === 'no_leidas') return noti.leida == 0;
        if (filtro === 'cuotas') return noti.tipo === 'cuotas';
        return true;
    });

    const getIcon = (tipo) => {
        switch (tipo) {
            case 'cuotas':
                return <i className="fa-solid fa-file-invoice-dollar text-danger fs-4"></i>;
            case 'mensaje':
                return <i className="fa-solid fa-envelope text-primary fs-4"></i>;
            case 'curso':
                return <i className="fa-solid fa-graduation-cap text-success fs-4"></i>;
            default:
                return <i className="fa-solid fa-bell text-secondary fs-4"></i>;
        }
    };

    const formatFecha = (fechaStr) => {
        if (!fechaStr) return '';
        const fecha = new Date(fechaStr.replace(/-/g, '/')); // Reemplazar guiones para compatibilidad cross-browser
        return fecha.toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="container-principal">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mx-4 mb-4 gap-2">
                <div>
                    <h3 className="fw-bold mb-1"><i className="fa-solid fa-bell me-2 text-primary"></i>Notificaciones</h3>
                    <span className="text-secondary small">Revisa los avisos importantes y novedades del instituto.</span>
                </div>
                {notificacionesUsr.some(n => n.leida == 0) && (
                    <button 
                        type="button" 
                        className="btn btn-outline-primary btn-sm rounded-3 fw-semibold shadow-sm"
                        onClick={handleMarcarTodasLeidas}
                    >
                        <i className="fa-solid fa-check-double me-1"></i> Marcar todas como leídas
                    </button>
                )}
            </div>

            {/* Filtros */}
            <div className="card shadow-sm border-0 p-3 mx-4 mb-3 rounded-3 bg-white">
                <div className="d-flex flex-wrap gap-2">
                    <button 
                        type="button" 
                        className={`btn btn-sm rounded-3 px-3 fw-semibold ${filtro === 'todas' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setFiltro('todas')}
                    >
                        Todas ({notificacionesUsr.length})
                    </button>
                    <button 
                        type="button" 
                        className={`btn btn-sm rounded-3 px-3 fw-semibold ${filtro === 'no_leidas' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setFiltro('no_leidas')}
                    >
                        No leídas ({notificacionesUsr.filter(n => n.leida == 0).length})
                    </button>
                    <button 
                        type="button" 
                        className={`btn btn-sm rounded-3 px-3 fw-semibold ${filtro === 'leidas' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setFiltro('leidas')}
                    >
                        Leídas ({notificacionesUsr.filter(n => n.leida == 1).length})
                    </button>
                    {/* si el usuario es tesorero, mostrar este botón */}
                    {rol === 13 && (
                    <button type="button" className={`btn btn-sm rounded-3 px-3 fw-semibold ${filtro === 'cuotas' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFiltro('cuotas')}>
                        Cobranzas
                    </button>
                    )}
                </div>
            </div>

            {/* Listado */}
            <div className="mx-4 mb-4">
                {cargando ? (
                    <div className="card shadow-sm border-0 p-5 rounded-3 text-center text-muted bg-white">
                        <span className="spinner-border spinner-border-sm text-primary me-2" role="status"></span>
                        Cargando notificaciones...
                    </div>
                ) : notificacionesFiltradas.length === 0 ? (
                    <div className="card shadow-sm border-0 p-5 rounded-3 text-center text-muted bg-white">
                        <i className="fa-solid fa-bell-slash fs-1 mb-3 text-black-50"></i>
                        <h5>No tienes notificaciones en esta sección</h5>
                        <span className="small">Te avisaremos cuando haya novedades para ti.</span>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-2">
                        {notificacionesFiltradas.map((noti) => (
                            <div 
                                key={noti.id} 
                                className={`card shadow-sm border-0 rounded-3 p-3 transition-all bg-white ${noti.leida == 0 ? 'border-start border-primary border-4 fw-semibold' : ''}`}
                                style={{ 
                                    cursor: noti.leida == 0 ? 'pointer' : 'default',
                                    transition: 'all 0.2s ease-in-out'
                                }}
                                onClick={() => noti.leida == 0 && handleMarcarLeida(noti.id)}
                            >
                                <div className="d-flex align-items-start gap-3">
                                    <div className="bg-light p-2 rounded-3 flex-shrink-0">
                                        {getIcon(noti.tipo)}
                                    </div>
                                    <div className="flex-grow-1 min-width-0">
                                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-1">
                                            <h6 className={`mb-1 text-dark truncate fw-bold ${noti.leida == 0 ? 'text-primary' : ''}`}>
                                                {noti.titulo}
                                            </h6>
                                            <span className="text-secondary small font-monospace">
                                                {formatFecha(noti.fecha)}
                                            </span>
                                        </div>
                                        <p className="text-secondary mb-0 small text-wrap-break-word">
                                            {noti.desarrollo}
                                        </p>
                                    </div>
                                    {noti.leida == 0 && (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-link text-primary p-0 flex-shrink-0 align-self-center text-decoration-none"
                                            title="Marcar como leída"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarcarLeida(noti.id);
                                            }}
                                        >
                                            <i className="fa-solid fa-circle-check fs-5"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Notificaciones;