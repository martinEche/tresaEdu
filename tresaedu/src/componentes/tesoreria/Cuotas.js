import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CONFIG from '../../config.js';
import MetricasTesoreria from './MetricasTesoreria.js';
import GeneradorCuotas from './GeneradorCuotas.js';
import SeguimientoCuotas from './SeguimientoCuotas.js';
import AlertasMora from './AlertasMora.js';

const URL_CUOTAS = `${CONFIG.API_URL}/operarCuotas.php`;
const URL_COHORTES = `${CONFIG.API_URL}/operarCohortes.php`;

function Cuotas() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Control de roles: Sólo Tesorero (Rol 13) es permitido
    const loggeduserRolId = localStorage.getItem('loggeduserRolId');
    
    useEffect(() => {
        if (loggeduserRolId !== '13') {
            navigate('/');
        }
    }, [loggeduserRolId, navigate]);

    const [activaTab, setActivaTab] = useState('metricas');
    const [cohortes, setCohortes] = useState([]);
    const [mesesGeneradosTodos, setMesesGeneradosTodos] = useState([]);
    const [metricas, setMetricas] = useState(null);
    const [selectedStudentId, setSelectedStudentId] = useState(null);

    const cicloActual = new Date().getFullYear();

    useEffect(() => {
        if (loggeduserRolId === '13') {
            obtenerCohortes();
            obtenerDatosGlobales();
        }
    }, [loggeduserRolId]);

    // Detectar redirección desde la lista de alumnos
    useEffect(() => {
        if (location.state && location.state.estudianteId) {
            setSelectedStudentId(location.state.estudianteId);
            setActivaTab('seguimiento');
            
            // Limpiar estado de ubicación para evitar bucles al recargar
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const obtenerDatosGlobales = () => {
        obtenerTodosMesesGenerados();
        obtenerMetricas();
    };

    const obtenerCohortes = async () => {
        try {
            // Se asume listar todas las cohortes para poder facturarlas
            const res = await axios.get(`${URL_COHORTES}?accion=listar`);
            if (res.data.success) {
                setCohortes(res.data.cohortes || []);
            } else {
                setCohortes([]);
            }
        } catch (err) {
            console.error(err);
            setCohortes([]);
        }
    };

    const obtenerTodosMesesGenerados = async () => {
        try {
            const res = await axios.get(URL_CUOTAS);
            if (res.data.success) {
                setMesesGeneradosTodos(res.data.mesesGeneradosTodos || []);
            } else {
                setMesesGeneradosTodos([]);
            }
        } catch (err) {
            console.error(err);
            setMesesGeneradosTodos([]);
        }
    };

    const obtenerMetricas = async () => {
        try {
            const res = await axios.get(`${URL_CUOTAS}?accion=metricas`);
            if (res.data.success) {
                setMetricas(res.data.metricas);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSwitchToCobrarStudent = (studentId) => {
        setSelectedStudentId(studentId);
        setActivaTab('seguimiento');
    };

    if (loggeduserRolId !== '13') {
        return null; // Ocultar mientras se realiza la redirección
    }

    return (
        <div className="container-principal">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 border-bottom pb-3">
                <div>
                    <h2 className="fw-bold mb-1 text-dark">Gestión de Tesorería</h2>
                    <p className="text-muted mb-0">Portal de administración de cuotas escolares y estados de cuentas.</p>
                </div>
                <div className="badge bg-primary bg-opacity-10 text-primary py-2 px-3 rounded-pill fw-semibold mt-2 mt-md-0">
                    <i className="fa-solid fa-user-tie me-1.5"></i> Rol: Tesorero
                </div>
            </div>

            {/* Pestañas (Tabs) de navegación */}
            <div className="card shadow-sm border-0 mb-4 rounded-3 bg-white">
                <div className="card-header bg-white border-bottom-0 pt-3 px-3">
                    <ul className="nav nav-pills card-header-pills gap-1.5">
                        <li className="nav-item">
                            <button
                                className={`nav-link fw-semibold rounded-3 ${activaTab === 'metricas' ? 'active bg-primary bg-gradient' : 'text-secondary'}`}
                                onClick={() => setActivaTab('metricas')}
                            >
                                <i className="fa-solid fa-chart-pie me-1.5"></i> Métricas Generales
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link fw-semibold rounded-3 ${activaTab === 'generacion' ? 'active bg-primary bg-gradient' : 'text-secondary'}`}
                                onClick={() => setActivaTab('generacion')}
                            >
                                <i className="fa-solid fa-calculator me-1.5"></i> Generación de Cuota/s
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link fw-semibold rounded-3 ${activaTab === 'seguimiento' ? 'active bg-primary bg-gradient' : 'text-secondary'}`}
                                onClick={() => setActivaTab('seguimiento')}
                            >
                                <i className="fa-solid fa-graduation-cap me-1.5"></i> Seguimiento de Alumnos
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link fw-semibold rounded-3 position-relative ${activaTab === 'alertas' ? 'active bg-primary bg-gradient' : 'text-secondary'}`}
                                onClick={() => setActivaTab('alertas')}
                            >
                                <i className="fa-solid fa-triangle-exclamation me-1.5"></i> Alertas de Mora
                                {metricas && parseInt(metricas.cuotas_vencidas) > 0 && (
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light">
                                        {metricas.cuotas_vencidas}
                                    </span>
                                )}
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Contenedor de Vistas */}
            <div className="fade-in">
                {activaTab === 'metricas' && (
                    <MetricasTesoreria 
                        metricas={metricas} 
                    />
                )}

                {activaTab === 'generacion' && (
                    <GeneradorCuotas
                        cohortes={cohortes}
                        mesesGeneradosTodos={mesesGeneradosTodos}
                        onRefresh={obtenerDatosGlobales}
                    />
                )}

                {activaTab === 'seguimiento' && (
                    <SeguimientoCuotas
                        cohortes={cohortes}
                        selectedStudentId={selectedStudentId}
                        onClearSelectedStudent={() => setSelectedStudentId(null)}
                    />
                )}

                {activaTab === 'alertas' && (
                    <AlertasMora
                        onSelectStudent={handleSwitchToCobrarStudent}
                        onRefresh={obtenerMetricas}
                    />
                )}
            </div>
        </div>
    );
}

export default Cuotas;
