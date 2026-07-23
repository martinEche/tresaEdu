import { useState, useEffect, useRef } from "react";
import "./css/Sidebar.css";
import { Link } from "react-router-dom";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import CONFIG from "../config";

function Sidebar({ acceder, rol, rolSelect, configuracion }) {
    const [expandida, setExpandida] = useState(false);
    const sidebarRef = useRef(null);

    const navigate = useNavigate();
    let location = useLocation();

    const loggeduserCurso = localStorage.getItem('loggeduserCurso');


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setExpandida(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!acceder) {
            localStorage.clear();
            rolSelect(null);
            navigate('/');
        }
    }, [acceder, navigate, rolSelect]);


    const volver = () => {
        localStorage.removeItem('loggeduserCurso');
        localStorage.removeItem('loggeduserClasesCurso');
        localStorage.removeItem('loggeduserCursoGrupoO');
        setExpandida(false);
    }

    return (
        <div className={`${expandida ? 'show-sidebar' : ''}`} ref={sidebarRef}>
            <aside className="sidebar" style={{
                backgroundColor: configuracion.fondo_barra_lateral,
                color: configuracion.color_texto_barra_lateral
            }}>
                <div className="toggle">
                    <span className="burger" onClick={() => setExpandida(!expandida)}><span></span><span></span><span></span></span>
                </div>
                <div className="side-inner">
                    <span className="logo"><img src={`${CONFIG.API_URL}/${configuracion.logo_grande}`} alt="" className="img-fluid" /></span>
                    <div className="nav-menu">
                        {location.pathname !== '/' && (
                            <ul>
                                {((loggeduserCurso === null) || (rol == 9 || rol == "9" || rol < 5)) && (rol !== 1) && (
                                    <li>
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={<Tooltip id="tooltip-principal">Principal</Tooltip>}
                                        >
                                            <Link
                                                className="d-flex align-items-center"
                                                onClick={volver}
                                                to={'/Principal'}>
                                                <i className="wrap-icon fa-solid fa-home mr-3"></i>
                                                <span className="menu-text">Principal</span>
                                            </Link>
                                        </OverlayTrigger>
                                    </li>
                                )}
                                {rol === 1 && (
                                    <li>
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={<Tooltip id="tooltip-principal">Dashboard</Tooltip>}
                                        >
                                            <Link className="d-flex align-items-center" onClick={() => setExpandida(false)} to={'/Dashboard'} >
                                                <i className="wrap-icon fa-solid fa-sliders mr-3"></i>
                                                <span className="menu-text">Dashboard</span>
                                            </Link>
                                        </OverlayTrigger>
                                    </li>
                                )}
                                {rol < 5 && (
                                    <>
                                        <li>
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={<Tooltip id="tooltip-usuarios">Usuarios</Tooltip>}
                                            >
                                                <Link className="d-flex align-items-center" onClick={() => setExpandida(false)} to={'/Usuarios'}>
                                                    <i className="wrap-icon fa-brands fa-slideshare mr-3"></i>
                                                    <span className="menu-text">Usuarios</span>
                                                </Link>
                                            </OverlayTrigger>
                                        </li>
                                        <li>
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={<Tooltip id="tooltip-cursos">Estructura de cursos</Tooltip>}
                                            >
                                                <Link className="d-flex align-items-center" onClick={() => setExpandida(false)} to={'/Formaciones'}>
                                                    <i className="wrap-icon fa-solid fa-box-archive mr-3"></i>
                                                    <span className="menu-text">Estructura de cursos</span>
                                                </Link>
                                            </OverlayTrigger>
                                        </li>
                                        <li>
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={<Tooltip id="tooltip-espacios">Espacios/Cursos</Tooltip>}
                                            >
                                                <Link className="d-flex align-items-center" onClick={() => setExpandida(false)} to={'/Cursos'}>
                                                    <i className="wrap-icon fa-solid fa-boxes-stacked mr-3"></i>
                                                    <span className="menu-text">Espacios/Cursos</span>
                                                </Link>
                                            </OverlayTrigger>
                                        </li>
                                        <li>
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={<Tooltip id="tooltip-reportes">Reportes</Tooltip>}
                                            >
                                                <Link className="d-flex align-items-center" onClick={() => setExpandida(false)} to={'/Reportes'}>
                                                    <i className="wrap-icon fa-solid fa-chart-pie mr-3"></i>
                                                    <span className="menu-text">Reportes</span>
                                                </Link>
                                            </OverlayTrigger>
                                        </li>
                                        {(rol <5 ) && (
                                            <li>
                                                <OverlayTrigger
                                                    placement="right"
                                                    overlay={<Tooltip id="tooltip-calificaciones-general">Calificaciones General</Tooltip>}
                                                >
                                                    <Link className="d-flex align-items-center" onClick={() => setExpandida(false)} to={'/CalificacionesGeneral'}>
                                                        <i className="wrap-icon fa-regular fa-star mr-3"></i>
                                                        <span className="menu-text">Calificaciones General</span>
                                                    </Link>
                                                </OverlayTrigger>
                                            </li>
                                        )}                                        
                                        {rol == 4 && (
                                            <li>
                                                <OverlayTrigger
                                                    placement="right"
                                                    overlay={<Tooltip id="tooltip-promocion">Promover estudiantes</Tooltip>}
                                                >
                                                    <Link className="d-flex align-items-center" onClick={() => setExpandida(false)} to={'/Promocion'}>
                                                        <i className="wrap-icon fa-solid fa-chalkboard-user mr-3"></i>
                                                        <span className="menu-text">Promover estudiantes</span>
                                                    </Link>
                                                </OverlayTrigger>
                                            </li>
                                        )}
                                        <li>
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={<Tooltip id="tooltip-horarios">Horarios de los cursos</Tooltip>}
                                            >
                                                <Link className="d-flex align-items-center" onClick={() => setExpandida(false)} to={'/Horarios'}>
                                                    <i className="wrap-icon fa-regular fa-clock mr-3"></i>
                                                    <span className="menu-text">Horarios de los cursos</span>
                                                </Link>
                                            </OverlayTrigger>
                                        </li>
                                    </>
                                )}

                                {(rol == 7 || rol == 6 || rol == 5) && loggeduserCurso === null && (
                                    <li>
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={<Tooltip id="tooltip-miscursos">Mis Cursos</Tooltip>}
                                        >
                                            <Link className="d-flex align-items-center" onClick={() => setExpandida(false)} to={'/MC'}>
                                                <i className="wrap-icon fa-solid fa-box-archive mr-3"></i>
                                                <span className="menu-text">Mis Cursos</span>
                                            </Link>
                                        </OverlayTrigger>
                                    </li>
                                )}
                                {(rol == 7 || rol == 6 || rol == 5) && loggeduserCurso !== null && (
                                    <>
                                        <li>
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={<Tooltip id="tooltip-volver">Volver a Mis Cursos</Tooltip>}
                                            >
                                                <Link className="d-flex align-items-center mb-4" to={'/MC'} onClick={volver}>
                                                    <i className="wrap-icon fa-regular fa-circle-left mr-3"></i>
                                                    <span className="menu-text">Volver</span>
                                                </Link>
                                            </OverlayTrigger>
                                        </li>

                                        <li>
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={<Tooltip id="tooltip-curso">Curso</Tooltip>}
                                            >
                                                <Link className="d-flex align-items-center" onClick={() => setExpandida(false)} to={`/MC/${loggeduserCurso}`}>
                                                    <i className="wrap-icon fa-regular fa-folder-open mr-3"></i>
                                                    <span className="menu-text">Curso</span>
                                                </Link>
                                            </OverlayTrigger>
                                        </li>
                                        <li>
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={<Tooltip id="tooltip-planificacion">Clases</Tooltip>}
                                            >
                                                <Link className="d-flex align-items-center" onClick={() => setExpandida(false)} to={`/MC/${loggeduserCurso}/c`}>
                                                    <i className="wrap-icon fa-solid fa-file-signature mr-3"></i>
                                                    <span className="menu-text">Clases</span>
                                                </Link>
                                            </OverlayTrigger>
                                        </li>
                                        <li>
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={<Tooltip id="tooltip-estudiantes">Estudiantes</Tooltip>}
                                            >
                                                <Link className="d-flex align-items-center" onClick={() => setExpandida(false)} to={`/MC/${loggeduserCurso}/e`}>
                                                    <i className="wrap-icon fa-solid fa-graduation-cap mr-3"></i>
                                                    <span className="menu-text">Estudiantes</span>
                                                </Link>
                                            </OverlayTrigger>
                                        </li>
                                        <li>
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={<Tooltip id="tooltip-laboratorio">Laboratorio de Práctica</Tooltip>}
                                            >
                                                <Link className="d-flex align-items-center" onClick={() => setExpandida(false)} to={`/MC/${loggeduserCurso}/l`}>
                                                    <i className="wrap-icon fa-solid fa-flask mr-3"></i>
                                                    <span className="menu-text">Laboratorio de Práctica</span>
                                                </Link>
                                            </OverlayTrigger>
                                        </li>
                                    </>
                                )}
                                {/** tesoreria*/}
                                {rol == 13 && (
                                    <>

                                        <li>
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={<Tooltip id="tooltip-cuotas">Gestión de Cuotas</Tooltip>}
                                            >
                                                <Link className="d-flex align-items-center" onClick={() => setExpandida(false)} to={'/Cuotas'}>
                                                    <i className="fa-solid fa-money-bill-1 m-1"></i>
                                                    <span className="menu-text">Administrar cuotas</span>
                                                </Link>
                                            </OverlayTrigger>
                                        </li>
                                       
                                    </>
                                )}
                                {(rol == 7) && loggeduserCurso === null && (
                                    <>
                                        <li>
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={<Tooltip id="tooltip-calificaciones">Calificaciones</Tooltip>}
                                            >
                                                <Link className="d-flex align-items-center" onClick={() => setExpandida(false)} to={'/Calificaciones'}>
                                                    <i className="wrap-icon fa-regular fa-star mr-3"></i>
                                                    <span className="menu-text">Calificaciones</span>
                                                </Link>
                                            </OverlayTrigger>
                                        </li>
                                        <li>
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={<Tooltip id="tooltip-inscripcionqr">Inscribir por QR</Tooltip>}
                                            >
                                                <Link className="d-flex align-items-center" onClick={() => setExpandida(false)} to={'/inscripcionqr'}>
                                                    <i className="wrap-icon fa-solid fa-qrcode mr-3"></i>
                                                    <span className="menu-text">Inscribir por QR</span>
                                                </Link>
                                            </OverlayTrigger>
                                        </li>
                                    </>
                                )}
                                <li>
                                    <OverlayTrigger
                                        placement="right"
                                        overlay={<Tooltip id="tooltip-agenda">Agenda</Tooltip>}
                                    >
                                        <Link className="d-flex align-items-center" onClick={() => setExpandida(false)} to={'/Agenda'}>
                                            <i className="wrap-icon fa-solid fa-calendar-days mr-3"></i>
                                            <span className="menu-text">Agenda</span>
                                        </Link>
                                    </OverlayTrigger>
                                </li>
                                {rol == 3 && (
                                    <li>
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={<Tooltip id="tooltip-admmensajes">Adm. de mensajeria</Tooltip>}
                                        >
                                            <Link className="d-flex align-items-center" onClick={() => setExpandida(false)} to={'/AdmMensajes'}>
                                                <i className="wrap-icon fa-solid fa-envelopes-bulk mr-3"></i>
                                                <span className="menu-text">Adm. de mensajeria</span>
                                            </Link>
                                        </OverlayTrigger>
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                </div>
            </aside>
        </div>
    );
}

export default Sidebar;
