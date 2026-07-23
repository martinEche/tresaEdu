import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { show_alerta } from '../../funciones.js';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import CONFIG from "../../config";

import MensajesGrupoBurbuja from "./MensajesGrupoBurbuja";
import MensajesCrudForm from "./MensajesCrudForm";

import './css/MensajesGrupoChat.css';

const URL_LISTAR_MENSAJES = `${CONFIG.API_URL}/listarMensajes.php`;
const URL_GRUPOS = `${CONFIG.API_URL}/operarGrupos.php`;

function MensajesGrupoChat({ userId, chatSeleccionado, volver, enviarFormData, configuracion, refreshKey, setMostrarModalCrearGrupo, setEditarGrupoID, eliminarGrupo, buscaConversaciones}) {
    const chatRef = useRef(null);
    const [mensajes, setMensajes] = useState([]);
    const [participantes, setParticipantes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalParticipantes, setModalParticipantes] = useState(false);
    const [menuGrupoAbierto, setMenuGrupoAbierto] = useState(null);
    const [soyAdmin, setSoyAdmin] = useState(false);

    const [usuarios, setUsuarios] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [sugerencias, setSugerencias] = useState([]);
    const loggeduserRolId = localStorage.getItem('loggeduserRolId');

    const tChat = chatSeleccionado?.tipo || chatSeleccionado?.tipo_chat;
    const esGrupo = tChat === "GRUPOC" || tChat === "GRUPOP";
    const esDifusion = tChat === "DIFUSION";

    useEffect(() => {
        if (!chatSeleccionado) return;
        cargarMensajes();
    }, [chatSeleccionado, refreshKey]);

    //cerrar la ventana del menu de grupo al hacer click afuera
    useEffect(() => {
        const cerrar = () => setMenuGrupoAbierto(null);
        window.addEventListener('click', cerrar);
        return () => window.removeEventListener('click', cerrar);
    }, []);

    useEffect(() => {
        setSoyAdmin(participantes.some(
                p => p.id === parseInt(userId, 10) && p.estado === 'administrador')
                    );
    }, [participantes]);

    //obtener usuarios
    useEffect(() => {
        axios.get(`${CONFIG.API_URL}/operarTablaUsuario.php?rol_origen=${loggeduserRolId}`)
            .then(res => setUsuarios(res.data))
            .catch(err => console.log(err));
    }, [loggeduserRolId]);

    //filtro de busqueda
    useEffect(() => {
        if (busqueda.length >= 2) {
            const filtrados = usuarios.filter(u =>
                `${u.nombre} ${u.apellido}`.toLowerCase().includes(busqueda.toLowerCase())
            );
            setSugerencias(filtrados);
        } else {
            setSugerencias([]);
        }
    }, [busqueda, usuarios]);

    const idGrupo = chatSeleccionado?.conversacion?.split('_')[1] || 0;

    const agregarParticipante = async (idUsuario) => {
        const yaExiste = participantes.some(p => p.id === idUsuario);
        if (yaExiste) {
            show_alerta('El usuario ya está en el grupo', 'warning');
            return;
        }
        try {
            const res = await axios.post(URL_GRUPOS, {
                modo: 'agregar_participante',
                id_grupo: idGrupo,
                id_usuario: idUsuario
            });
            if (res.data.success) {
                show_alerta('Participante agregado', 'success');
                cargarMensajes();
                setBusqueda('');
            } else {
                show_alerta('Error al agregar', 'error');
            }
        } catch (err) {
            console.log(err);
        }
    };

    const enviarSolicitudParticipante = async (metodo, parametros) => {
        try {
            const res = await axios({ method: metodo, url: URL_GRUPOS, data: parametros });
            if(res.data.success){
                show_alerta(`Participante ${metodo === 'DELETE' ? 'eliminado' : 'actualizado'}`, 'success');
                cargarMensajes();
            } else {
                show_alerta('Error al modificar participante', 'error');
            }
        } catch (err) {
            console.log(err);
        }
    };

    const hacerAdmin = (idUsuario) => {
         enviarSolicitudParticipante("PUT", { modo: 'hacer_admin', id_grupo: idGrupo, id_usuario: idUsuario });
    };

    const quitarParticipante = (idUsuario) => {
        enviarSolicitudParticipante("DELETE", { modo: 'quitar_participante', id_grupo: idGrupo, id_usuario: idUsuario });
    };

    const cargarMensajes = async () => {
        console.log('chatSeleccionado:',chatSeleccionado);
        try {
            setLoading(true);
            const data = {
                tipo: chatSeleccionado.conversacion,
                conversacion: chatSeleccionado.conversacion,
                id: userId,
                id_mensaje: chatSeleccionado.id_mensaje
            };
            console.log('Dato enviadooo:',data);
            const res = await axios.post(URL_LISTAR_MENSAJES, data);
            console.log('respuestaaaaaaaa mensajes:',res.data);
            //if (res.data.resultado) {
                setMensajes(res.data.mensajes || []);
                setParticipantes(res.data.participantes || []);
                setTimeout(() => {
                    scrollAbajo();
                }, 200);

                // Update unread badges dynamically in the chats list and main header
                if (buscaConversaciones) {
                    buscaConversaciones(userId);
                }
                window.dispatchEvent(new Event('refreshMensajesSinLeer'));
            //}
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const scrollAbajo = () => {
        if (chatRef.current) {
            chatRef.current.scrollTop =
                chatRef.current.scrollHeight;
        }
    };

     const eliminarMensaje = (id, tabla) => {
            let texto = 'Se eliminará el mensaje para todos.';
            const MySwal = withReactContent(Swal);
            MySwal.fire({
                title: '¿Seguro de eliminar el mensaje?',
                icon: 'question',
                text: texto,
                showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
            })
                .then(res => {
                    if (res.isConfirmed) {
                        axios.delete(`${CONFIG.API_URL}/operarMensajes.php`, { data: { id: id, tabla: tabla } })
                            .then(response => {
                                const [tipo, msj] = response.data;
                                if (tipo === 'success') {
                                    show_alerta('Mensaje eliminado');
                                    cargarMensajes();
                                } else {
                                    show_alerta('Error: ' + msj, 'error');
                                }
                            })
                            .catch(err => {
                                show_alerta('Error al eliminar', 'error');
                            });
                    } else {
                        show_alerta('NO fue eliminado');
                    }
                });
        };

    return (
        <div className="chat-container">
            {/* CABECERA */}
            <div className="chat-header">
                <button
                    className="btn btn-light"
                    onClick={volver}
                >
                    <i className="fa-solid fa-arrow-left"></i>
                </button>

                <div className="chat-header-info" style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '2px', padding: '4px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                        <h6 className="mb-0 text-truncate" style={{ maxWidth: '200px' }}>
                            {chatSeleccionado.nombre_chat}
                        </h6>
                        {/* ES GRUPO AGREGO: PARTICIPANTES BADGE y SI ES GRUPO P EL MENU */}
                        {esGrupo && 
                        <>
                            <button
                                className="participantes-badge"
                                onClick={() => setModalParticipantes(true)}
                                title="Ver participantes"
                                style={{ marginTop: '0' }}
                            >
                                <i className="fa-solid fa-users me-1"></i>
                                <span>{participantes.length} participante{participantes.length !== 1 ? 's' : ''}</span>
                            </button>
                            {/* Menu solo para grupo personalizado */}
                            {chatSeleccionado.tipo === 'GRUPOP' && soyAdmin &&
                                <div style={{ position: 'relative', display: 'inline-block', marginLeft: 'auto' }}>
                                    <span
                                        className="text-end-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuGrupoAbierto(prev =>
                                                prev === chatSeleccionado.id ? null : chatSeleccionado.id
                                            );
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <i className="fa-solid fa-ellipsis-vertical px-2"></i>
                                    </span>
                                    {menuGrupoAbierto === chatSeleccionado.id && (
                                        <div className='menu-grupo'>
                                            <div>
                                                <span
                                                    className='btn btn-sm btn-light w-100 text-start'
                                                    onClick={() => {
                                                        setEditarGrupoID(chatSeleccionado.conversacion.split('_')[1]);
                                                        setMostrarModalCrearGrupo(true);
                                                        setMenuGrupoAbierto(null);
                                                    }}
                                                >
                                                    <i className="fa-solid fa-pencil mx-1"></i>Editar grupo
                                                </span>
                                            </div>
                                            <div>
                                                <span
                                                    className='btn btn-sm btn-light w-100 text-start'
                                                    onClick={() => {
                                                        eliminarGrupo(chatSeleccionado.conversacion.split('_')[1]);
                                                        setMenuGrupoAbierto(null);
                                                    }}
                                                >
                                                    <i className="fa-solid fa-trash mx-1"></i>Eliminar grupo
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            }  
                        </>
                        }
                    </div>

                    {chatSeleccionado.tipo === 'GRUPOP' && chatSeleccionado.descripcion_grupo && (
                        <small className="text-muted d-block w-100 text-truncate" style={{ fontSize: '0.75rem', lineHeight: '1' }}>
                            {chatSeleccionado.descripcion_grupo}
                        </small>
                    )}
                    {chatSeleccionado.tipo === 'GRUPOC' && (
                        <small className="text-muted d-block w-100 text-truncate" style={{ fontSize: '0.75rem', lineHeight: '1' }}>
                            Grupo con estudiantes y docentes del curso
                        </small>
                    )}
                </div>

                    {/* MODAL PARTICIPANTES */}
                    {modalParticipantes && (
                        <div className="participantes-modal-overlay" onClick={() => setModalParticipantes(false)}>
                            <div className="participantes-modal" onClick={e => e.stopPropagation()}>
                                <button
                                    className="participantes-modal-close"
                                    onClick={() => setModalParticipantes(false)}
                                    title="Cerrar"
                                >
                                    ✕
                                </button>
                                <h6 className="participantes-modal-title">
                                    <i className="fa-solid fa-users me-2"></i>
                                    Participantes ({participantes.length})
                                </h6>
                                <ul className="participantes-modal-list">
                                    {participantes.map(p => (
                                        <li key={p.id} className="participantes-modal-item">
                                            <div className={`participante-avatar ${p.estado === 'administrador' ? 'avatar-admin' : 'avatar-participante'}`}>
                                                {(p.nombre?.[0] || '?').toUpperCase()}
                                            </div>
                                            <div className="participante-info">
                                                <span className="participante-nombre">{p.apellido}, {p.nombre} {p.id === parseInt(userId, 10) && '(Tú)'}</span>
                                                {p.estado && (
                                                    <span className={`participante-rol ${p.estado === 'administrador' ? 'rol-admin' : 'rol-participante'}`}>
                                                        {p.estado === 'administrador' ? '★ Administrador' : 'Participante'}
                                                    </span>
                                                )}
                                            </div>
                                            {soyAdmin && chatSeleccionado.tipo === 'GRUPOP' && p.id !== parseInt(userId, 10) && (
                                                <div className="acciones-participante ms-2">
                                                    {p.estado !== 'administrador' && (
                                                        <button
                                                            className="btn btn-sm btn-warning me-1"
                                                            onClick={() => hacerAdmin(p.id)}
                                                            title="Hacer administrador"
                                                        >
                                                            <i className="fa-solid fa-user-shield"></i>
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => quitarParticipante(p.id)}
                                                        title="Quitar del grupo"
                                                    >
                                                        <i className="fa-solid fa-user-minus"></i>
                                                    </button>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>

                                {/* Búsqueda y agregar participante solo para admins en grupos personalizados */}
                                {soyAdmin && chatSeleccionado.tipo === 'GRUPOP' && (
                                    <div className="mt-3 border-top pt-3">
                                        <h6 className="small fw-bold mb-2">Agregar participante</h6>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm mb-2"
                                            placeholder="Buscar usuario..."
                                            value={busqueda}
                                            onChange={(e) => setBusqueda(e.target.value)}
                                        />
                                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                            {sugerencias.length > 0 ? (
                                                sugerencias.map(u => (
                                                    <div
                                                        key={u.id}
                                                        className="d-flex align-items-center justify-content-between p-2 border-bottom hover-bg-light"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => agregarParticipante(u.id)}
                                                    >
                                                        <div className="d-flex align-items-center">
                                                            <span className="ms-2 small">
                                                                {u.nombre} {u.apellido}
                                                            </span>
                                                        </div>
                                                        <i className="fa-solid fa-plus text-primary"></i>
                                                    </div>
                                                ))
                                            ) : busqueda.length >= 2 ? (
                                                <div className="text-muted small text-center mt-2">
                                                    No se encontraron usuarios.
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
    
            
            {/* MENSAJES */}
            <div
                className="chat-mensajes"
                ref={chatRef}
            >
                {mensajes.map(m => (
                    <MensajesGrupoBurbuja
                        key={m.id_mensaje}
                        mensaje={m}
                        eliminarMensaje={eliminarMensaje} 
                        userId={userId}
                        configuracion={configuracion}
                    />
                ))}
            </div>
            {/* ESCRITURA */}
            {!esDifusion && (
                <div className="chat-footer">
                    <MensajesCrudForm
                        key={chatSeleccionado.conversacion}
                        enviarFormData={enviarFormData} 
                        respuesta_a={0}
                        para_r={
                            tChat === 'USR'
                                ? chatSeleccionado.conversacion.replace('USR_', '')
                                : tChat === 'GRUPOC'
                                    ? `@curso, cohorte, #${chatSeleccionado.conversacion.replace('GRUPOC_', '')}`
                                    : tChat === 'GRUPOP'
                                        ? `@grupo, cohorte, #${-parseInt(chatSeleccionado.conversacion.replace('GRUPOP_', ''))}`
                                        : ''
                        }
                        asunto_r={
                            tChat === 'USR'
                                ? `Mensaje de chat con ${chatSeleccionado.nombre_chat}`
                                : tChat === 'GRUPOC'
                                    ? `Chat de curso: ${chatSeleccionado.nombre_chat}`
                                    : tChat === 'GRUPOP'
                                        ? `Chat de grupo: ${chatSeleccionado.nombre_chat}`
                                        : 'Chat'
                        }
                        llamoNuevo={false}
                        preload={false}
                        esChat={true}
                    />
                </div>
            )}
        </div>
    );
}

export default MensajesGrupoChat;