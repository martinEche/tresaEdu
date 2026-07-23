// src/components/mensajes/Mensajes.js
import './css/Mensajes.css';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

import { show_alerta } from '../../funciones.js'; 
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from "react-router-dom";

import MensajesRecibidos from './MensajesRecibidos';
import MensajesRecibidosG from './MensajesRecibidosG';
import MensajesEnviados from './MensajesEnviados';
import MensajesEliminados from './MensajesEliminados';
import MensajesCrudForm from './MensajesCrudForm';
import CONFIG from '../../config';
import EsperaElimina from './EsperaElimina.js';
import { useFirebaseCounter } from '../../hooks/useFirebaseCounter';
import MensajesGrupoCrudForm from './MensajesGrupoCrudForm.js';
import Espera from '../Espera.js';
import { set } from 'firebase/database';
import MensajesVisitaChat from './MensajesVistaChat.js';

const URL_MENSAJES = `${CONFIG.API_URL}/operarMensajes.php`;
const URL_LISTAR_MENSAJES = `${CONFIG.API_URL}/listarMensajes.php`;
const URL_CURSOS  = `${CONFIG.API_URL}/operarCursos.php`;
const URL_GRUPOS = `${CONFIG.API_URL}/operarGrupos.php`;

function Mensajes({ acceder, rol, configuracion }) {
    const navigate = useNavigate();
    const userId = localStorage.getItem('loggedUserId');
    const [tabActiva, setTabActiva] = useState('Recibidos');
    const [mensajesRecibidos, setMensajesRecibidos] = useState([]);
    const [mensajesRecibidosG, setMensajesRecibidosG] = useState([]);
    const [mensajesEnviados, setMensajesEnviados] = useState([]);
    const [mensajesEliminados, setMensajesEliminados] = useState([]);
    const [verElimina, setVerElimina] = useState(false);

    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarModalCrearGrupo, setMostrarModalCrearGrupo] = useState(false);
    const [editarGrupoID, setEditarGrupoID] = useState(null);
    
    const [cursos, setCursos] = useState([]);
    const loggeduserId = localStorage.getItem('loggedUserId');
    const [paraGrupo, setParaGrupo] = useState('');
    //modal del menu de grupos
    //const [mostrarMenuGrupo, setMostrarMenuGrupo] = useState(false);
    const [menuGrupoAbierto, setMenuGrupoAbierto] = useState(null);

    const [gruposPersonalisados, setGruposPersonalisados] = useState([]);

    const [preload, setPreload] = useState(false);
    const [responder, setResponder] = useState(false);

    const [vista, setVista] = useState("chat"); // mail | chat
    const [chatsConversaciones, setChatsConversaciones] = useState([]);
    const [chatMensajes, setChatMensajes] = useState([]);

    // ==================== CURSOS ====================
    useEffect(() => {
        if(acceder){
            if((rol===null)){
                navigate("/");
            }else{
                const data= {
                    'id_usuario' : loggeduserId,
                    'modo': 'buscarCursosUsuario',
                    'llama':rol,
                    'componenete':'mensajes'
                }
                
                buscarCursos(data);
                buscarGrupos(data);
                buscaConversaciones(userId);
            }
        }else{
            localStorage.clear();
            navigate('/');
        }        
    }, [acceder, rol]);

    //cerrar la ventana del menu de grupo al hacer click afuera
    useEffect(() => {
        const cerrar = () => setMenuGrupoAbierto(null);
        window.addEventListener('click', cerrar);
        return () => window.removeEventListener('click', cerrar);
    }, []);

    const buscarGrupos = (data)=>{
        console.log("buscando grupos con data: ", data);
        axios.post(URL_GRUPOS, data)
        .then(res =>{
            console.log("grupos obtenidos: ", res.data);
            (!res.data.error)?setGruposPersonalisados(res.data):setGruposPersonalisados([]);
        })
        .catch(err=>{
            console.log(err);
        })
    }
    const eliminarGrupo = (id)=>{
        const MySwal= withReactContent(Swal); 
        MySwal.fire({
            title: '¿Seguro de eliminar el Grupo?',
            icon: 'question', 
            text: 'No se podrá dar marcha atrás',
            showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar'
        })
        .then(res=>{
            if(res.isConfirmed){
                axios.delete(URL_GRUPOS, {'id':id, 'tabla':'mensajes_grupo_creado'})
                .then(res =>{
                    const tipo = res.data[0];
                    const msj = res.data[1];
                    show_alerta(msj, tipo);
                })
                .catch(err=>{ console.log(err); })
            }else{
                show_alerta(' NO fue eliminado');
            }
        });
    }

    const buscarCursos=(data)=>{
        console.log("buscando cursos con data: ", data);
        axios.post(URL_CURSOS, data)
        .then(res =>{
            console.log("cursos obtenidos: ", res.data);
            (!res.data.error)?setCursos(res.data):setCursos([]);
        })
        .catch(err=>{
            console.log(err);
        })
    }

    const buscaConversaciones = useCallback(async (id) => {
        const data = { id: id, tipo: 'conversaciones'};
        try {
            const res = await axios.post(URL_LISTAR_MENSAJES, data);
            console.log('resultadosconversacion:',res.data);
            if(res.data.resultado){
                //setChatMensajes(res.data.mensajes);
                const {
                    chats = [],
                    difusion = [],
                    gruposP = [],
                    gruposC = []
                } = res.data;

                setChatsConversaciones(
                    [...chats, ...difusion, ...gruposP, ...gruposC]
                        .sort(
                            (a, b) =>
                                new Date(b.ultima_fecha || 0) -
                                new Date(a.ultima_fecha || 0)
                        )
                );
            }
        } catch (err) {
            console.error('Error en buscaConversaciones:', err);
        }
    }, []);

// ==================== BUSCAR MENSAJES (con protección) ====================
    const buscaMensajes = async (id, tipo) => {
        const data = { id: id, tipo: tipo };
        try {
            const res = await axios.post(URL_LISTAR_MENSAJES, data);
           //console.log(`Mensajes ${tipo} obtenidossssssssssssssssssss:`, res.data);
            // PROTECCIÓN TOTAL: solo aceptamos array real
            if (Array.isArray(res.data)) {
                if (tipo === 'RECIBIDOS') setMensajesRecibidos(res.data);
                if (tipo === 'ENVIADOS') setMensajesEnviados(res.data);
                if (tipo === 'ELIMINADOS') setMensajesEliminados(res.data);
                if (tipo === 'RECIBIDOSG') setMensajesRecibidosG(res.data);
            } else {
                console.warn(`Respuesta inválida para ${tipo}:`, res.data);
                if (tipo === 'RECIBIDOS') setMensajesRecibidos([]);
                if (tipo === 'ENVIADOS') setMensajesEnviados([]);
                if (tipo === 'ELIMINADOS') setMensajesEliminados([]);
                if (tipo === 'RECIBIDOSG') setMensajesRecibidosG([]);
            }
        } catch (err) {
            console.error('Error en buscaMensajes:', err);
            if (tipo === 'RECIBIDOS') setMensajesRecibidos([]);
            if (tipo === 'ENVIADOS') setMensajesEnviados([]);
            if (tipo === 'ELIMINADOS') setMensajesEliminados([]);
            if (tipo === 'RECIBIDOSG') setMensajesRecibidosG([]);
        }
    };

    // ==================== CARGA INICIAL ====================
    useEffect(() => {
        if (userId) {
            buscaMensajes(userId, 'RECIBIDOS');
            //buscaMensajes(userId, 'ENVIADOS');
            //buscaMensajes(userId, 'ELIMINADOS');
            //buscaMensajes(userId, 'RECIBIDOSG');
        }
    }, [userId]);

    // ==================== REFRESCAR CON FIREBASE (versión estable) ====================
    const refrescarMensajes = useCallback(() => {
        // Solo refresca la pestaña que está activa (evita spamear 3 llamadas)
        if (tabActiva === 'Recibidos' || !tabActiva) buscaMensajes(userId, 'RECIBIDOS');
        if (tabActiva === 'Enviados') buscaMensajes(userId, 'ENVIADOS');
        if (tabActiva === 'Eliminados') buscaMensajes(userId, 'ELIMINADOS');
        if (tabActiva === 'RecibidosG') buscaMensajes(userId, 'RECIBIDOSG');
        
        // También refrescar las conversaciones del chat
        buscaConversaciones(userId);
    }, [tabActiva, userId, buscaConversaciones]);

    useFirebaseCounter(userId ? `mensajes/user_${userId}` : null, refrescarMensajes);

    // ==================== MODAL SCROLL ====================
    useEffect(() => {
        if (mostrarModal) {
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.classList.add("modal-open");
            document.body.style.overflow = "hidden";
            document.body.style.paddingRight = `${scrollBarWidth}px`;
        } else {
            document.body.classList.remove("modal-open");
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        }

        return () => {
            document.body.classList.remove("modal-open");
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        };
    }, [mostrarModal]);

    const mostrarMensajes = (valor) => setTabActiva(valor);

    
    const enviarFormData = async (data) => {
        setPreload(true);
        try {
            const res = await axios.post(URL_MENSAJES, data);
            setPreload(false);
            if (res.data.success) {
                //si data mensaje tiene modo crear_grupo notificar grupo creado 
                // y no ejecutar firebase que es para mensajes individuales
                if(data.get('modo') === 'crear_grupo'){
                    show_alerta('Grupo creado exitosamente', 'success');
                    buscarGrupos({
                        'id_usuario' : loggeduserId,
                        'modo': 'buscarCursosUsuario',
                        'llama':rol
                    });
                    buscaConversaciones(userId);
                }else{
                    if(data.get('modo') === 'edita_grupo'){
                        show_alerta('Grupo modificado exitosamente', 'success');
                        buscarGrupos({
                            'id_usuario' : loggeduserId,
                            'modo': 'buscarCursosUsuario',
                            'llama':rol
                        });
                        buscaConversaciones(userId);
                    }else{
                        //envio mensaje
                        show_alerta('Mensaje enviado exitosamente', 'success');
                        const datosFirebase = {
                            id_insertado: res.data.id_insertado,
                            recipient_usernames: res.data.recipient_usernames,
                            mensaje: res.data.mensaje,
                            asunto: res.data.asunto,
                            respuesta_a: res.data.respuesta_a
                        };
                        await axios.post(`${CONFIG.API_URL}/notificarFirebase.php`, datosFirebase);
                        //show_alerta('Notificación enviada', 'success');
                        mostrarMensajes('Recibidos');
                        buscaConversaciones(userId);
                        window.dispatchEvent(new Event('refreshChatWindow'));
                    }
                }
                cerrarModal();
            } else {
                show_alerta(res.data.error || 'Error guardando mensaje', 'error');
            }
        } catch (err) {
            console.error(err);
            show_alerta('Error en la operación', 'error');
        }
    };

    const eliminarMensaje = (id, tabla) => {
        let texto = 'Se envía a la papelera para eliminarlo definitivamente elimineló de ahí.';
        if (tabla === 'enviado' || tabla === 'recibido') {
            texto = 'Se eliminará definitivamente el mensaje.'
        }
        const MySwal = withReactContent(Swal);
        MySwal.fire({
            title: '¿Seguro de eliminar el mensaje?',
            icon: 'question',
            text: texto,
            showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar'
        })
            .then(res => {
                if (res.isConfirmed) {
                    enviarSolicitud('DELETE', { 'id': id, 'tabla': tabla })
                    if (tabla == 'mensajes_enviados') {
                        mostrarMensajes('Enviados');
                    } else if (tabla == 'mensajes_recibidos') {
                        mostrarMensajes('Recibidos');
                    } else {
                        mostrarMensajes('Eliminados');
                    }
                } else {
                    show_alerta(' NO fue eliminado');
                }
            });
    };

    const enviarSolicitud = async (metodo, parametros) => {
        try {
            if (metodo == 'DELETE') { setVerElimina(true) }
            const res = await axios({ method: metodo, url: URL_MENSAJES, data: parametros });
            if (metodo == 'DELETE') { setVerElimina(false) }
            const [tipo, msj] = res.data;
            show_alerta(msj, tipo);
            if (tipo === 'success') {
                cerrarModal();
                if (parametros.tabla == 'mensajes_enviados') {
                    buscaMensajes(userId, 'ENVIADOS');
                } else if (parametros.tabla == 'mensajes_recibidos') {
                    buscaMensajes(userId, 'RECIBIDOS');
                } else {
                    buscaMensajes(userId, 'ELIMINADOS');
                }
            }
        } catch (err) {
            console.log(err);
        }
    };

    const cerrarModal = () => {
        setMostrarModal(false);
        setMostrarModalCrearGrupo(false);
        setParaGrupo('');
        setEditarGrupoID(null);
    };

    const mostrarNombre = (orden)=>{
        let nombre="";
        switch(orden){
          case "S2":
            nombre='Sala de 2';
            break        
          case "S3":
            nombre='Sala de 3';
          break
          case "S4":
            nombre='Sala de 4';
          break
          case "S5":
            nombre='Sala de 5';
          break
          case "In":
            nombre='Espacio Institucional';
          break
          default:
            nombre=orden+'°';
        }
        return nombre
      };

    return (
        <div className="container-principal">
            <EsperaElimina ver={verElimina} />
            <div className="d-flex justify-content-between align-items-center mb-2">
                {!responder && vista==='mail' &&
                <>
                <h6>Mis mensajes</h6>
                <button
                        className='btn btn-primary btn-sm'
                        onClick={() => {
                            setParaGrupo("");
                            setMostrarModal(true);
                        }}
                >
                        <i className="fa-solid fa-pencil"></i> Redactar mensaje
                </button>
                
                <div className="btn-group">
                    <button
                        className={`btn btn-sm ${vista==="mail" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={()=>setVista("mail")}
                    >
                        <i className="fa-solid fa-envelope"></i> Mail
                    </button>
                    <button
                        className={`btn btn-sm ${vista==="chat" ? "btn-success" : "btn-outline-success"}`}
                        onClick={()=>setVista("chat")}
                    >
                        <i className="fa-solid fa-comments"></i> Chat
                    </button>
                </div>
                </>
                }
            </div>
        {vista==="mail" && (
        <>
            <div className='alert alert-light shadow-sm'>
                <h6 className='ps-1 pt-0'>
                    <i className="fa-solid fa-people-group"></i> grupos mensajería
                    {parseInt(rol) <= 6 && 
                    <button
                        className='btn btn-sm m-2'
                        style={{ backgroundColor: '#b4e9f7', color: '#000', border: 'none', fontWeight: '500' }}
                        onClick={() => {setMostrarModalCrearGrupo(true)}}
                    >
                        + Crear grupo
                    </button>
                    }
                </h6>
                <div className="contenedor-grupos">
                {/* CURSOS */}
                    {cursos.length > 0 && cursos.map((c, index) => (
                        c.estado === 'Abierto' && (
                        <button 
                            className="grupo-card grupo-curso" 
                            key={index} 
                            onClick={() => navigate(`/Mensajes/enRecibidos/-${c.id_curso_grupo}/C`)}
                        >
                            <img 
                            src={`${
                                c.imagen_curso_grupo 
                                ? c.imagen_curso_grupo 
                                : `${CONFIG.API_URL}/uploads/espacios/escudo_solo_instituto.png`
                            }`}
                            alt="Grupo" 
                            className="grupo-img"
                            />
                            <span className="grupo-nombre">
                            {!c.orden.includes('S') ? mostrarNombre(c.orden) :''} {c.denominacion} {c.nombre} ({c.cohorte})
                            </span>
                            {c.mensajes_sin_leer > 0 && (
                                <span className="badge bg-danger">{c.mensajes_sin_leer}</span>
                            )}
                        </button>
                        )
                    ))}               
                    {/* PERSONALIZADOS */}
                    {gruposPersonalisados.length > 0 && gruposPersonalisados.map((g, index) => (
                    <div key={index}>
                        <div 
                            className="grupo-card grupo-personalizado"
                            key={index} 
                            onClick={() => navigate(`/Mensajes/enRecibidos/-${g.id}/G`)}
                        >
                            <img 
                            src={g.imagen 
                                ? `${CONFIG.API_URL}/${g.imagen}` 
                                : 'https://placehold.co/40'
                            } 
                            alt="Grupo" 
                            className="grupo-img"
                            />
                            <span className="grupo-nombre">{g.nombre_grupo}</span> 
                             {g.mensajes_sin_leer > 0 && (
                                <span className="badge bg-danger">{g.mensajes_sin_leer}</span>
                            )}   
                            <div className="text-end-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuGrupoAbierto(prev => 
                                        prev === g.id ? null : g.id
                                    );
                                    // Detener la propagación del evento para que no navegue
                                    //eliminarMensaje(mensaje.id_mensajeR ?? mensaje.id_mensajeR,'mensajes_recibidos');
                                    //obtenerMensajesGrupo();
                                }}
                            >    
                                <i className="fa-solid fa-ellipsis-vertical"></i>
                            </div>                           
                        </div>
                        {menuGrupoAbierto === g.id && (
                        <div className='menu-grupo'>
                            <div>
                                <span 
                                className='btn btn-sm btn-ligth'
                                onClick={()=>{
                                    setEditarGrupoID(g.id);
                                    setMostrarModalCrearGrupo(true);
                                    setMenuGrupoAbierto(null);
                                }}
                                >
                                    <i className="fa-solid fa-pencil mx-1"></i>editar {g.id}
                                </span>
                            </div>
                            <div>
                                <span 
                                className='btn btn-sm btn-ligth'
                                onClick={()=>{
                                    eliminarGrupo(g.id);
                                    setMenuGrupoAbierto(null);
                                }}
                                >
                                    <i className="fa-solid fa-trash mx-1"></i>eliminar
                                </span>    
                            </div>
                        </div>
                        )}
                    </div>
                    ))}
                </div>
            </div> 
            <div className="row">
                <div className="col-12 ps-2">
                    <ul className="nav nav-tabs">
                        <li className="nav-item">
                            <button className={`nav-link ${tabActiva === 'Recibidos' && "active"}`} aria-current="page" onClick={() => mostrarMensajes('Recibidos')}>Recibidos</button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link ${tabActiva === 'RecibidosG' && "active"}`} aria-current="page" onClick={() => mostrarMensajes('RecibidosG')}>Grupales</button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link ${tabActiva === 'Enviados' && "active"}`} onClick={() => mostrarMensajes('Enviados')}>Enviados</button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link ${tabActiva === 'Eliminados' && "active"}`} onClick={() => mostrarMensajes('Eliminados')}>Eliminados</button>
                        </li>
                    </ul>
                </div>
                <div className="col-12 ">
                    {tabActiva === 'Recibidos' && <MensajesRecibidos userId={userId} eliminarMensaje={eliminarMensaje} buscaMensajes={buscaMensajes} mensajesRecibidos={mensajesRecibidos} />}
                    {tabActiva === 'RecibidosG' && <MensajesRecibidosG userId={userId} eliminarMensaje={eliminarMensaje} buscaMensajes={buscaMensajes} mensajesRecibidosG={mensajesRecibidosG} />}
                    {tabActiva === 'Enviados' && <MensajesEnviados userId={userId} eliminarMensaje={eliminarMensaje} buscaMensajes={buscaMensajes} mensajesEnviados={mensajesEnviados} />}
                    {tabActiva === 'Eliminados' && <MensajesEliminados userId={userId} eliminarMensaje={eliminarMensaje} buscaMensajes={buscaMensajes} mensajesEliminados={mensajesEliminados} />}
                </div>
            </div>
        </>
        )}  
        {vista==="chat" && (
        <> 
            <MensajesVisitaChat
                userId={userId}
                rol={rol}
                chatsConversaciones={chatsConversaciones}
                configuracion={configuracion}
                navigate={navigate}
                buscaConversaciones={buscaConversaciones}
                setParaGrupo={setParaGrupo}
                setMostrarModal={setMostrarModal}
                cursos={cursos}
            />

        </>  
        )}

            {/* modal escritura */}
            {mostrarModal && (
            <>
                <div className="modal-backdrop fade show"></div>
                <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header bg-light">
                                <h6 className="modal-title">{paraGrupo? `Mensaje grupal para ${paraGrupo}`: "Nuevo mensaje"}</h6>
                                <button className="btn-close" onClick={cerrarModal}></button>
                            </div>
                            <div className="modal-body">
                                <MensajesCrudForm
                                    enviarFormData={enviarFormData}
                                    respuesta_a={0}
                                    para_r={paraGrupo}
                                    asunto_r=""
                                    llamoNuevo={true}
                                    cerrarModal={cerrarModal}
                                    preload={preload}
                                    esChat={vista === 'chat'}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </>
            )}

            {/* modal creación/edicion de grupo personalizado */}
            {mostrarModalCrearGrupo && (
            <>
                <div className="modal-backdrop fade show"></div>
                <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header bg-light">
                                <h6 className="modal-title">{!editarGrupoID?'Crear Grupo':'Editar Grupo'}</h6>
                                <button className="btn-close" onClick={cerrarModal}></button>
                            </div>
                            <div className="modal-body">
                                <MensajesGrupoCrudForm
                                    enviarFormData={enviarFormData}
                                    editarGrupoID={editarGrupoID}
                                    cursos={cursos}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </>
            )}
        </div>
    );
}

export default Mensajes;