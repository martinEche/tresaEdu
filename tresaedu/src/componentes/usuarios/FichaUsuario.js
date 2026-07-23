import { useParams } from "react-router-dom";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { show_alerta } from '../../funciones.js';
import { useNavigate } from "react-router-dom";

import CONFIG from '../../config';
import PerfilInfo from "./PerfilInfo";
import FichaUsuarioRolInfo from "./FichaUsuarioRolInfo";
import PerfilForm from "./PerfilForm";
import './css/fichaUsuario.css';
import TutorCrudForm from "./TutorCrudForm.js";

const URL_LISTAR = `${CONFIG.API_URL}/listarUsuarios.php`;
const URL = `${CONFIG.API_URL}/operarTablaUsuario.php`;

function FichaUsuario({ configuracion, acceder, rol, vista }) {
    const { usuarioId } = useParams();
    const defaultFilePerfil = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
    const [perfil, setPerfil] = useState({
        id: null,
        nombre: "",
        apellido: "",
        apodo: "",
        imagen_perfil: "",
        fecnac: "",
        email: "",
        genero: "",
        telefono: "",
        calle: "",
        numero: "",
        piso: "",
        depto: "",
        ciudad: "",
        provincia: ""
    });
    const [tutores, setTutores] = useState([]);
    const [roles, setRoles] = useState([]);
    const [activeIndex, setActiveIndex] = useState(null); // Estado para el índice activo
    const [mostrarEditar, setMostrarEditar] = useState(false);
    const [mostrarFormulafio, setMostrarFormulario] = useState(false);
    
    // Estados del Legajo
    const [documentos, setDocumentos] = useState([]);
    const [tipoDoc, setTipoDoc] = useState("");
    const [archivoDoc, setArchivoDoc] = useState(null);
    const [subiendoDoc, setSubiendoDoc] = useState(false);
    
    const navigate = useNavigate();

    const puedeGestionarLegajo = [1, 2, 3, 4].includes(rol);

    useEffect(() => {
        if (acceder) {
            if (rol === null) {
                navigate("/");
            }
        } else {
            localStorage.clear();
            navigate("/");
        }
        obtenerDatos();
        obtenerDocumentos();
    }, [usuarioId]);

    // Establecer el primer rol como activo por defecto
    useEffect(() => {
        if (roles.length > 0) {
            setActiveIndex(roles[0].id);
        }
    }, [roles]);

    const obtenerDatos = async () => {
        const data = {
            'id_usuario': usuarioId,
            'modo': 'buscarFichalUsuario'
        };

        try {
            const res = await axios.post(URL_LISTAR, data);
            if (!res.data.error) {
                setPerfil(res.data.info);
                setRoles(res.data.roles);
                setTutores(res.data.tutores);
            } else {
                setPerfil(null);
                setRoles([]);
                setTutores([]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const obtenerDocumentos = async () => {
        try {
            const res = await axios.get(`${CONFIG.API_URL}/operarLegajo.php?id_usuario=${usuarioId}`);
            if (res.data.success) {
                setDocumentos(res.data.documentos || []);
            }
        } catch (err) {
            console.error("Error al obtener documentos del legajo:", err);
        }
    };

    const handleSubirDocumento = async (e) => {
        e.preventDefault();
        if (!tipoDoc) {
            show_alerta("Por favor selecciona el tipo de documento", "warning");
            return;
        }
        if (!archivoDoc) {
            show_alerta("Por favor selecciona un archivo", "warning");
            return;
        }

        setSubiendoDoc(true);
        const formData = new FormData();
        formData.append("id_usuario", usuarioId);
        formData.append("tipo_documentacion", tipoDoc);
        formData.append("archivo", archivoDoc);

        try {
            const res = await axios.post(`${CONFIG.API_URL}/operarLegajo.php`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            if (res.data.success) {
                show_alerta("Documento subido correctamente", "success");
                setTipoDoc("");
                setArchivoDoc(null);
                const fileInput = document.getElementById("legajo-file-input");
                if (fileInput) fileInput.value = "";
                obtenerDocumentos();
            } else {
                show_alerta(res.data.message || "Error al subir documento", "error");
            }
        } catch (err) {
            show_alerta("Error de conexión al subir el documento", "error");
            console.error(err);
        } finally {
            setSubiendoDoc(false);
        }
    };

    const handleEliminarDocumento = async (idDoc) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este documento del legajo?")) {
            return;
        }

        try {
            const res = await axios.post(`${CONFIG.API_URL}/operarLegajo.php`, {
                accion: "eliminar",
                id: idDoc
            });
            if (res.data.success) {
                show_alerta("Documento eliminado correctamente", "success");
                obtenerDocumentos();
            } else {
                show_alerta(res.data.message || "Error al eliminar documento", "error");
            }
        } catch (err) {
            show_alerta("Error de conexión al eliminar el documento", "error");
            console.error(err);
        }
    };

    const actualizarData = (data) => {
        enviarSolicitud("POST", data);
    };

    const enviarSolicitud = async (metodo, parametros) => {
        await axios({ method: metodo, url: URL, data: parametros })
            .then(res => {
                var tipo = res.data[0];
                var msj = res.data[1];
                setMostrarEditar(false);
                obtenerDatos();
                show_alerta(msj, tipo);
            })
            .catch(err => {
                show_alerta('Error en la solicitud ', 'error');
                console.log(err);
            })
    }

    const previewFoto = (e) => {
        let img = document.getElementById('imagen');
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                img.src = e.target.result;
            }
            reader.readAsDataURL(e.target.files[0])
        } else {
            img.src = defaultFilePerfil;
        }
    }

    const obtenerEdad = (dateString) => {
        let hoy = new Date();
        let fechaNacimiento = new Date(dateString);
        let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
        let diferenciaMeses = hoy.getMonth() - fechaNacimiento.getMonth();
        if (diferenciaMeses < 0 || (diferenciaMeses === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
            edad--;
        }
        return edad;
    };

    const obtenerIniciales = (nombre, apellido) => {
        const n = nombre ? nombre.charAt(0).toUpperCase() : "";
        const a = apellido ? apellido.charAt(0).toUpperCase() : "";
        return n + a;
    };

    const generarColor = (texto) => {
        const colores = ["#3b82f6", "#10b981", "#ef4444", "#f97316", "#8b5cf6"];
        let index = texto ? texto.charCodeAt(0) % colores.length : 0;
        return colores[index];
    };

    const getDocBadgeClass = (tipo) => {
        const clean = tipo.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/[^a-z0-9]/g, "-");
        return `legajo-badge ${clean}`;
    };

    if (!perfil) {
        return (
            <div className="ficha-container text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3 text-secondary">Cargando información del usuario...</p>
            </div>
        );
    }

    return (
        <div className="container-principal ">
            {/* ── TARJETA PRINCIPAL DEL PERFIL ── */}
            <div className="ficha-usuario-card">
                <div className="row align-items-center">
                    <div className="col-12 col-md-3 text-center text-md-start mb-3 mb-md-0">
                        <div className="avatar-wrapper">
                            {perfil.imagen_perfil && perfil.imagen_perfil !== '' ? (
                                <div className="imagen-circular-estudiante">
                                    <img src={`${CONFIG.API_URL}/${perfil.imagen_perfil}`} alt="Perfil" />
                                </div>
                            ) : (
                                <div
                                    className="imagen-circular-estudiante"
                                    style={{ backgroundColor: generarColor(perfil.nombre) }}
                                >
                                    {obtenerIniciales(perfil.nombre, perfil.apellido)}
                                </div>
                            )}
                            {configuracion.logo_solo && (
                                <img
                                    src={`${process.env.PUBLIC_URL}/img/${configuracion.logo_solo}`}
                                    className="logo-inferior"
                                    alt="Logo"
                                />
                            )}
                        </div>
                    </div>
                    <div className="col-12 col-md-9 text-center text-md-start">
                        <h2 className="profile-title">{perfil.nombre} {perfil.apellido}</h2>
                        <div className="profile-subtitle">
                            <i className="fa-solid fa-id-card"></i>
                            <span>Documento: <strong>{perfil.documento || "—"}</strong></span>
                            {perfil.apodo && <span className="ms-2 text-muted">({perfil.apodo})</span>}
                        </div>
                        {perfil.fecnac && (
                            <div className="profile-subtitle">
                                <i className="fa-solid fa-cake-candles"></i>
                                <span>Edad: <strong>{obtenerEdad(perfil.fecnac)} años</strong> ({new Date(perfil.fecnac).toLocaleDateString('es-AR')})</span>
                            </div>
                        )}
                        {perfil.email && (
                            <div className="profile-subtitle">
                                <i className="fa-solid fa-envelope"></i>
                                <span className="profile-email">{perfil.email}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── DOS COLUMNAS PRINCIPALES ── */}
            <div className="row g-4">
                {/* COLUMNA IZQUIERDA: Datos personales y Tutores */}
                <div className="col-12 col-lg-4">
                    <div className="d-flex flex-column gap-4">
                        {/* Datos Personales */}
                        <div className="card-info-fija">
                            <h5>
                                <span><i className="fa-solid fa-user me-2"></i>Datos personales</span>
                                {rol < 3 && (
                                    <button
                                        className="btn btn-outline-primary btn-sm border-0"
                                        onClick={() => setMostrarEditar(!mostrarEditar)}
                                        title={mostrarEditar ? "Cancelar edición" : "Editar perfil"}
                                    >
                                        {mostrarEditar ? <i className="fa-solid fa-xmark"></i> : <i className="fa-solid fa-user-pen"></i>}
                                    </button>
                                )}
                            </h5>
                            {!mostrarEditar ? (
                                <PerfilInfo perfil={perfil} />
                            ) : (
                                <PerfilForm perfil={perfil} actualizarData={actualizarData} previewFoto={previewFoto} />
                            )}
                        </div>

                        {/* Tutores */}
                        <div className="tutores-section">
                            <div className="tutores-header">
                                <h5 className="tutores-titulo">
                                    <i className="fa-solid fa-people-roof me-2"></i>Tutor/es
                                </h5>
                                {puedeGestionarLegajo && (
                                    <button
                                        className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                                        onClick={() => setMostrarFormulario(true)}
                                    >
                                        <i className="fa-solid fa-plus"></i> Tutor
                                    </button>
                                )}
                            </div>
                            {mostrarFormulafio && (
                                <TutorCrudForm
                                    idEstudiante={perfil.id}
                                    mostrarFormulafio={mostrarFormulafio}
                                    setMostrarFormulario={setMostrarFormulario}
                                />
                            )}
                            {tutores.length > 0 ? (
                                tutores.map((tutor) => (
                                    <div key={tutor.id} className="tutor-card-chip">
                                        <div className="tutor-header">
                                            <h6 className="tutor-nombre">{tutor.nombre} {tutor.apellido}</h6>
                                            {puedeGestionarLegajo && (
                                                <button
                                                    className="btn btn-link text-warning p-0 border-0"
                                                    onClick={() => setMostrarFormulario(true)}
                                                    title="Editar Tutor"
                                                >
                                                    <i className="fa-solid fa-pen-to-square"></i>
                                                </button>
                                            )}
                                        </div>
                                        {tutor.email && (
                                            <div className="tutor-info-line">
                                                <i className="fa-regular fa-envelope"></i>
                                                <span>{tutor.email}</span>
                                            </div>
                                        )}
                                        {tutor.telefono && (
                                            <div className="tutor-info-line">
                                                <i className="fa-solid fa-mobile-screen"></i>
                                                <span>{tutor.telefono}</span>
                                            </div>
                                        )}
                                        {tutor.calle && (
                                            <div className="tutor-info-line">
                                                <i className="fa-solid fa-location-dot"></i>
                                                <span>
                                                    {tutor.calle} N°{tutor.numero}
                                                    {tutor.depto && ` Dpto: ${tutor.depto}`}
                                                    {tutor.piso && ` Piso: ${tutor.piso}`}
                                                    {` (${tutor.ciudad} - ${tutor.provincia})`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="alert alert-light border text-center text-muted p-3 mb-0">
                                    Sin datos de tutores asociados.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: Legajo de documentos y Roles */}
                <div className="col-12 col-lg-8">
                    <div className="d-flex flex-column gap-4">
                        {/* ── SECCIÓN LEGAJO DE DOCUMENTACIÓN ── */}
                        <div className="card-info-fija">
                            <div className="legajo-title">
                                <i className="fa-solid fa-folder-open text-primary"></i>
                                <span>Legajo de Documentación</span>
                            </div>

                            {/* Formulario para subir archivos (solo roles 1, 2, 3, 4) */}
                            {puedeGestionarLegajo && (
                                <form onSubmit={handleSubirDocumento} className="legajo-upload-card">
                                    <div className="legajo-form-grid">
                                        <div className="legajo-input-group">
                                            <label htmlFor="tipo-doc-select">Tipo de Documentación</label>
                                            <select
                                                id="tipo-doc-select"
                                                className="legajo-select"
                                                value={tipoDoc}
                                                onChange={(e) => setTipoDoc(e.target.value)}
                                                required
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                <option value="Documento de Identidad">Documento de Identidad</option>
                                                <option value="Partida de Nacimiento">Partida de Nacimiento</option>
                                                <option value="Ficha Médica">Ficha Médica</option>
                                                <option value="Autorizaciones">Autorizaciones</option>
                                                <option value="Certificados Médicos">Certificados Médicos</option>
                                                <option value="Actas Realizadas">Actas Realizadas</option>
                                                <option value="Otro">Otro</option>
                                            </select>
                                        </div>

                                        <div className="legajo-input-group">
                                            <label htmlFor="legajo-file-input">Seleccionar Archivo</label>
                                            <input
                                                id="legajo-file-input"
                                                type="file"
                                                className="legajo-file-input"
                                                onChange={(e) => setArchivoDoc(e.target.files[0])}
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="legajo-btn-upload"
                                            disabled={subiendoDoc}
                                        >
                                            {subiendoDoc ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                    <span>Subiendo...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa-solid fa-cloud-arrow-up"></i>
                                                    <span>Agregar</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Listado de documentos */}
                            {documentos.length > 0 ? (
                                <div className="legajo-table-wrapper">
                                    <table className="legajo-table">
                                        <thead>
                                            <tr>
                                                <th>Tipo Documento</th>
                                                <th>Fecha Alta</th>
                                                <th>Registrado Por</th>
                                                <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {documentos.map((doc) => (
                                                <tr key={doc.id}>
                                                    <td>
                                                        <span className={getDocBadgeClass(doc.tipo_documentacion)}>
                                                            <i className="fa-solid fa-file-invoice"></i>
                                                            {doc.tipo_documentacion}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {new Date(doc.fecha).toLocaleDateString('es-AR')}
                                                    </td>
                                                    <td>
                                                        {doc.creador_nombre ? `${doc.creador_nombre} ${doc.creador_apellido}` : "Sistema"}
                                                    </td>
                                                    <td>
                                                        <div className="legajo-actions justify-content-center">
                                                            <button
                                                                className="legajo-btn-action view"
                                                                onClick={() => window.open(`${CONFIG.API_URL}/uploads/legajos/${doc.archivo}`, '_blank')}
                                                                title="Visualizar documento"
                                                            >
                                                                <i className="fa-solid fa-eye"></i>
                                                            </button>
                                                            {puedeGestionarLegajo && (
                                                                <button
                                                                    className="legajo-btn-action delete"
                                                                    onClick={() => handleEliminarDocumento(doc.id)}
                                                                    title="Eliminar documento"
                                                                >
                                                                    <i className="fa-solid fa-trash-can"></i>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center p-4 border rounded bg-light text-muted">
                                    <i className="fa-regular fa-folder-open mb-2" style={{ fontSize: '2rem' }}></i>
                                    <p className="mb-0">No se dispone de documentación registrada en el legajo de este usuario.</p>
                                </div>
                            )}
                        </div>

                        {/* Roles del Usuario */}
                        {vista === 'general' && (
                            <div className="card-info-fija">
                                <h5><i className="fa-solid fa-user-shield me-2"></i>Roles del usuario</h5>
                                {roles.length > 0 ? (
                                    <ul className="nav nav-tabs">
                                        {roles.map((rolItem, index) => (
                                            <li key={index} className="nav-item">
                                                <button
                                                    className={`nav-link ${rolItem.id === activeIndex ? 'active' : ''}`}
                                                    onClick={() => setActiveIndex(rolItem.id)}
                                                >
                                                    <i className={rolItem.icono}></i> {rolItem.nombre}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="alert alert-light border text-center text-muted p-3">Sin roles asociados</div>
                                )}
                                <div className="contenedor-tab">
                                    {activeIndex === 1 && <h5 className="mt-2 text-primary fw-bold">Administrador Principal</h5>}
                                    {activeIndex === 2 && <h5 className="mt-2 text-primary fw-bold">Administrador de datos</h5>}
                                    {activeIndex === 3 && <h5 className="mt-2 text-primary fw-bold">Equipo directivo de la institución</h5>}
                                    {activeIndex === 4 && <h5 className="mt-2 text-primary fw-bold">Secretario/a de la institución</h5>}

                                    {activeIndex > 4 && (
                                        <FichaUsuarioRolInfo rol={activeIndex} usuarioId={usuarioId} />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FichaUsuario;
