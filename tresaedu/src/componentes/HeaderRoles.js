import './css/HeaderRoles.css';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useNavigate } from "react-router-dom";
import PerfilLogo from './usuarios/PerfilLogo';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

import CONFIG from '../config';
import { useFirebaseCounter } from '../hooks/useFirebaseCounter';
import { show_alerta } from '../funciones.js';

const URL_LISTAR_MENSAJES = `${CONFIG.API_URL}/listarMensajes.php`;
const URL_NOTI = `${CONFIG.API_URL}/operarNotificaciones.php`;

function HeaderRoles({
  acceder,
  rolSelect,
  configuracion,
  mensajesSinLeer,
  setMensajesSinLeer,
  notificacionesSinVer,
  setNotificacionesSinVer,
  rolesUsuario
}) {
  const navigate = useNavigate();
  const datosUser = JSON.parse(localStorage.getItem('loggeddatosuser') || '{}');
  const userId = datosUser?.id;
  const loggeduserNombre = localStorage.getItem('loggeduserNombre') || '';

  /* ===============================
     REFS PARA CONTROL DE NOTIFICACIONES
     =============================== */
  const mensajesInitRef = useRef(false);
  const ultimoMensajesSinLeerRef = useRef(0);

  const notiInitRef = useRef(false);
  const ultimaNotiSinVerRef = useRef(0);

  /* ===============================
     PERMISO DE NOTIFICACIONES
     =============================== */
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  /* ===============================
     FETCH INICIAL DE CONTADORES
     =============================== */
  useEffect(() => {
    if (!userId) return;

    // Mensajes sin leer
    const fetchMensajes = async () => {
      try {
        const res = await axios.post(URL_LISTAR_MENSAJES, {
          id: userId,
          tipo: 'SIN_LEER'
        });
        if (!res.data?.error) {
          setMensajesSinLeer(res.data.cantidad || 0);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchMensajes();
    window.addEventListener('refreshMensajesSinLeer', fetchMensajes);

    // Notificaciones sin ver
    const fetchNotificaciones = async () => {
      try {
        const res = await axios.post(URL_NOTI, {
          id: userId,
          modo: 'contador'
        });
        if (!res.data?.error) {
          setNotificacionesSinVer(res.data.cantidad || 0);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchNotificaciones();
    window.addEventListener('refreshNotificacionesSinVer', fetchNotificaciones);

    return () => {
      window.removeEventListener('refreshMensajesSinLeer', fetchMensajes);
      window.removeEventListener('refreshNotificacionesSinVer', fetchNotificaciones);
    };
  }, [userId]);

  /* ===============================
     FIREBASE - MENSAJES
     =============================== */
  useFirebaseCounter(
    userId ? `mensajes/user_${userId}` : null,
    async () => {
      try {
        const res = await axios.post(URL_LISTAR_MENSAJES, {
          id: userId,
          tipo: 'SIN_LEER'
        });
        if (!res.data?.error) {
          setMensajesSinLeer(res.data.cantidad || 0);
        }
      } catch (e) {
        console.error(e);
      }
    }
  );

  /* ===============================
     FIREBASE - NOTIFICACIONES
     =============================== */
  useFirebaseCounter(
    userId ? `notificaciones/user_${userId}` : null,
    async () => {
      try {
        const res = await axios.post(URL_NOTI, {
          id: userId,
          modo: 'contador'
        });
        if (!res.data?.error) {
          setNotificacionesSinVer(res.data.cantidad || 0);
        }
      } catch (e) {
        console.error(e);
      }
    }
  );

  /* ===============================
     VERIFICACIÓN DE EVENTOS DE HOY
     =============================== */
  const verificarEventosHoy = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${CONFIG.API_URL}/operarCalendario.php?id_usiario=${userId}`);
      if (Array.isArray(res.data)) {
        const hoy = new Date();
        const localYear = hoy.getFullYear();
        const localMonth = String(hoy.getMonth() + 1).padStart(2, '0');
        const localDay = String(hoy.getDate()).padStart(2, '0');
        const hoyStr = `${localYear}-${localMonth}-${localDay}`;
        
        // Filtrar eventos de hoy (excluyendo creados por mí para evitar auto-notificación al crearlo)
        const eventosHoy = res.data.filter(e => e.fecha === hoyStr && e.creada_por != userId);
        
        if (eventosHoy.length > 0) {
          if ("Notification" in window && Notification.permission === "granted") {
            eventosHoy.forEach(evento => {
              new Notification("Evento para hoy", {
                body: `Hoy tienes: ${evento.evento} (${evento.hora_desde} a ${evento.hora_hasta})`,
                icon: "/icono.png"
              });
            });
          }
        }
      }
    } catch (e) {
      console.error("Error al verificar eventos de hoy:", e);
    }
  };

  // Verificar eventos al montar el componente
  useEffect(() => {
    if (userId) {
      verificarEventosHoy();
    }
  }, [userId]);

  /* ===============================
     VERIFICACIÓN DE EMAIL DE USUARIO (AL LOGUEARSE)
     =============================== */
  useEffect(() => {
    if (!userId) return;
    if (sessionStorage.getItem('mail_alert_shown') === 'true') return;

    const checkUserEmails = async () => {
      try {
        const res = await axios.post(`${CONFIG.API_URL}/listarUsuarios.php`, {
          id_usuario: userId,
          modo: 'buscarPerfilUsuario'
        });
        if (res.data && res.data.datos) {
          const { email, email2 } = res.data.datos;
          const isValido = (val) => val && val.trim() !== '' && val.toLowerCase() !== 'null' && val.toLowerCase() !== 'undefined';
          const hasEmail = isValido(email) || isValido(email2);
          if (!hasEmail) {
            sessionStorage.setItem('mail_alert_shown', 'true');
            Swal.fire({
              title: '¡Mejoremos la comunicación!',
              text: 'Agregando uno o dos correos electrónicos a su cuenta mejoraremos la comunicación notificándole la llegada de un nuevo mensaje.',
              icon: 'info',
              showCancelButton: true,
              confirmButtonText: 'Ir a Editar Perfil',
              cancelButtonText: 'Más tarde',
              confirmButtonColor: configuracion.color_primario || '#3085d6',
              cancelButtonColor: '#aaa',
              customClass: {
                popup: 'rounded-4 shadow-sm border',
                title: 'fs-5 fw-bold',
                htmlContainer: 'fs-6'
              }
            }).then((result) => {
              if (result.isConfirmed) {
                navigate('/perfil');
              }
            });
          } else {
            sessionStorage.setItem('mail_alert_shown', 'true');
          }
        }
      } catch (err) {
        console.error('Error checking user emails:', err);
      }
    };

    const timer = setTimeout(() => {
      checkUserEmails();
    }, 1500);

    return () => clearTimeout(timer);
  }, [userId, navigate, configuracion.color_primario]);

  /* ===============================
     FIREBASE - AGENDA (EVENTOS HOY)
     =============================== */
  const [agendaInit, setAgendaInit] = useState(false);
  const ultimoAgendaUpdate = useRef("");

  useFirebaseCounter(
    userId ? `agenda/user_${userId}` : null,
    async (val) => {
      if (!val) return;
      if (!agendaInit) {
        ultimoAgendaUpdate.current = val.lastUpdate;
        setAgendaInit(true);
        return;
      }
      if (val.lastUpdate !== ultimoAgendaUpdate.current) {
        ultimoAgendaUpdate.current = val.lastUpdate;
        verificarEventosHoy();
      }
    }
  );

  /* ===============================
     NOTIFICAR MENSAJES NUEVOS
     =============================== */
  useEffect(() => {
    if (mensajesSinLeer == null) return;

    // Primer render / F5
    if (!mensajesInitRef.current) {
      ultimoMensajesSinLeerRef.current = mensajesSinLeer;
      mensajesInitRef.current = true;
      return;
    }

    // Aumentó → mensaje nuevo real
    if (mensajesSinLeer > ultimoMensajesSinLeerRef.current) {
      // 1. Mostrar cartel (Toast) interno de la plataforma (100% compatible con PC y teléfonos, incluso en HTTP)
      show_alerta('Tiene un nuevo mensaje en su bandeja', 'info');

      // 2. Intentar mostrar notificación nativa del navegador (requiere HTTPS en producción)
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("Nuevo mensaje recibido", {
            body: "Tiene mensajes sin leer en su bandeja",
            icon: "/icono.png"
          });
          //navigator.serviceWorker?.ready.then(reg => {
          //  reg.showNotification("Nuevo mensaje recibido", {
          //  body: "Tiene mensajes sin leer",
          //  icon: "/icono.png"
          //  });
          //});
        } catch (e) {
          console.error(e);
        }
      }
    }

    ultimoMensajesSinLeerRef.current = mensajesSinLeer;
  }, [mensajesSinLeer]);

  /* ===============================
     NOTIFICAR NOTIFICACIONES NUEVAS
     =============================== */
  useEffect(() => {
    if (notificacionesSinVer == null) return;

    // Primer render / F5
    if (!notiInitRef.current) {
      ultimaNotiSinVerRef.current = notificacionesSinVer;
      notiInitRef.current = true;
      return;
    }

    // Aumentó → notificación nueva real
    if (notificacionesSinVer > ultimaNotiSinVerRef.current) {
      // 1. Mostrar cartel (Toast) interno de la plataforma
      show_alerta('Tiene una nueva notificación pendiente', 'info');

      // 2. Intentar mostrar notificación nativa del navegador (requiere HTTPS en producción)
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("Nueva notificación", {
            body: "Tiene notificaciones pendientes",
            icon: "/icono.png"
          });
        } catch (e) {
          console.error(e);
        }
      }
    }

    ultimaNotiSinVerRef.current = notificacionesSinVer;
  }, [notificacionesSinVer]);

  /* ===============================
     ACCIONES
     =============================== */
  const handleLogout = async () => {
    acceder(false);
    rolSelect(null);
    await axios.post(`${CONFIG.API_URL}/logout.php`, {}, { withCredentials: true }); // Limpiamos la cookie de acceso
    localStorage.clear();
    sessionStorage.removeItem('mail_alert_shown');
    navigate("/");
  };

  const handleRol = () => {
    rolSelect(null);
    localStorage.removeItem("loggeduserRolId");
    navigate("/");
  };

  const title = (
    <PerfilLogo
      usuario={datosUser}
      configuracion={configuracion}
      version="logo_solo"
      habilitarModal={false}
    />
  );

  /* ===============================
     RENDER
     =============================== */
  return (
    <header
      id="header"
      className="fixed-top"
      style={{
        backgroundColor: configuracion.fondo_barra_superior,
        color: configuracion.color_texto_barra_superior
      }}
    >
      <Navbar>
        <Container>
          <Navbar.Brand>
            <span className="logo1">
              <img
                src={`${CONFIG.API_URL}/${configuracion.logo_chico}`}
                alt=""
                className="hidden-xs"
              />
            </span>
            {/* Texto SOLO en pantallas grandes */}
            <div className="ms-3 d-none d-lg-block">
              <div className="logo-texto" style={{ color: configuracion.color_primario }} >
                {configuracion.nombre}
              </div>
              <div className="logo-texto" style={{ color: configuracion.color_primario }} >
                {configuracion.sub_titulo}
              </div>
            </div>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <div className="align-derecha">
              <Nav>
                {localStorage.getItem('loggeduserRolId') && (
                  <>
                    <OverlayTrigger
                      placement="bottom"
                      overlay={<Tooltip>Mensajería interna</Tooltip>}
                    >
                      <Nav.Link
                        onClick={() => navigate('/Mensajes')}
                        className="mx-2"
                      >
                        <h4>
                          <i className="fa-solid fa-envelope"></i>
                          {mensajesSinLeer > 0 && (
                            <span className="info-mensajes-head text-white">
                              {mensajesSinLeer}
                            </span>
                          )}
                        </h4>
                      </Nav.Link>
                    </OverlayTrigger>

                    <OverlayTrigger
                      placement="bottom"
                      overlay={<Tooltip>Notificaciones</Tooltip>}
                    >
                      <Nav.Link
                        onClick={() => navigate('/Notificaciones')}
                        className="mx-2"
                      >
                        <h4>
                          <i className="fa-solid fa-bell"></i>
                          {notificacionesSinVer > 0 && (
                            <span className="info-mensajes-head text-white bg-danger">
                              {notificacionesSinVer}
                            </span>
                          )}
                        </h4>
                      </Nav.Link>
                    </OverlayTrigger>
                  </>
                )}

                <OverlayTrigger
                  placement="bottom"
                  overlay={<Tooltip>{loggeduserNombre}</Tooltip>}
                >
                  <NavDropdown drop="start" title={title}>
                    <NavDropdown.Header>
                      <i className="fa-solid fa-user"></i> <strong>{loggeduserNombre}</strong>
                    </NavDropdown.Header>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={() => navigate("/perfil")}>
                      <i className="fa-solid fa-user-pen"></i> Editar perfil
                    </NavDropdown.Item>
                    <NavDropdown.Item onClick={() => navigate("/Pass")}>
                      <i className="fa-solid fa-key"></i> Cambiar contraseña
                    </NavDropdown.Item>
                   
                      <NavDropdown.Item onClick={handleRol}>
                        <i className="fa-solid fa-rotate"></i> Seleccionar rol
                      </NavDropdown.Item>
                  
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout}>
                      <i className="fa-solid fa-arrow-right-from-bracket"></i> Cerrar sesión
                    </NavDropdown.Item>
                  </NavDropdown>
                </OverlayTrigger>
              </Nav>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
}

export default HeaderRoles;