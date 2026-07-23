import './css/MensajesVistaChat.css';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { show_alerta } from '../../funciones.js';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import { useFirebaseCounter } from '../../hooks/useFirebaseCounter';

import CONFIG from '../../config';
import MensajesGrupo from "./MensajesGrupo";
import MensajesCrudForm from './MensajesCrudForm.js';
import PerfilLogo from '../usuarios/PerfilLogo.js';
import GrupoChat from './GrupoChat.js';
import MensajesGrupoChat from './MensajesGrupoChat.js';
import MensajesGrupoCrudForm from './MensajesGrupoCrudForm.js'; 

const URL_GRUPOS = `${CONFIG.API_URL}/operarGrupos.php`;
const URL_MENSAJES = `${CONFIG.API_URL}/operarMensajes.php`;
const URL_LISTAR_MENSAJES = `${CONFIG.API_URL}/listarMensajes.php`;

function MensajesVisitaChat({ userId, rol, chatsConversaciones, configuracion, navigate, buscaConversaciones, setParaGrupo, setMostrarModal, cursos = [] }) {
    
    const [editarGrupoID, setEditarGrupoID] = useState(null);
    const [mostrarModalCrearGrupo, setMostrarModalCrearGrupo] = useState(false);
    const [mensaje, setMensaje] = useState({});
    const [nombreGrupo, setNombreGrupo] = useState('');
    const [imagenGrupo, setImagenGrupo] = useState('');
    const [denominacion, setDenominacion] = useState('');  
    const [refreshGrupo, setRefreshGrupo] = useState(0); // <-- agregado
    const [estadoCurso, setEstadoCurso] = useState('Abierto');
    const [preload, setPreload] = useState(false);
    const [filtro, setFiltro] = useState('todos');

    const [esMobile, setEsMobile] = useState(window.innerWidth < 768);

    const chatsFiltrados = chatsConversaciones.filter(chat => {
        if (filtro === 'todos') return true;
        if (filtro === 'grupos') return chat.tipo_chat === 'GRUPOP' || chat.tipo_chat === 'GRUPOC';
        if (filtro === 'difusion') return chat.tipo_chat === 'DIFUSION';
        if (filtro === 'md') return chat.tipo_chat === 'USR';
        return true;
    });
    
    const [chatSeleccionado, setChatSeleccionado] = useState(null);

    const seleccionarChat = (chat) => {
        setChatSeleccionado(chat);
    };
    const volver = () => {
        setChatSeleccionado(null);
    };

     useEffect( ()=>{
            //chequear mensajesId si es negativo es un grupo personalizado 
            if(chatSeleccionado){
                const data= { 'id' : chatSeleccionado.id, 'tipo' : chatSeleccionado.origen };
                console.log('Buscando mensaje con datos:', data);
                fetchMensaje(data);
            }
    },[chatSeleccionado]);

    //detectar el tamaño de pantalla para adaptar la vista
    useEffect(() => {
        const resize = () => {
            setEsMobile(window.innerWidth < 768);
        };
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    const fetchMensaje = async (dataInfo) => {
        try {
            console.log('entro en fetch',dataInfo);
            const res = await axios.post(URL_LISTAR_MENSAJES, dataInfo);
            console.log('entro en fetch, Mensaje recibido:', res.data);
            if(!res.data.error){ 
                setMensaje(res.data.dato);
                if (buscaConversaciones) {
                    buscaConversaciones(userId);
                }
            } else {
                setMensaje({});
            }
        } catch (err) {
            console.log(err);
        }
    };

    // escuchar cambios en el hilo de mensajes (ej: respuestas nuevas)
    //no escucha negativos porque son grupos personalizados y no tienen un hilo de mensajes tradicional, 
    // se actualizan a través de MensajesGrupo con la llave de refresh
    const targetThreadId = chatSeleccionado?.id || chatSeleccionado?.id_mensaje;
    useFirebaseCounter(
        targetThreadId
            ? `mensajes/thread_${targetThreadId}`
            : null,
        () => {
            if (targetThreadId) {
                if (buscaConversaciones) {
                    buscaConversaciones(userId);
                }
                setRefreshGrupo(prev => prev + 1);
            }
        }
    );

    // escuchar notificaciones del usuario para refrescar mensajes en tiempo real
    useFirebaseCounter(
        userId ? `mensajes/user_${userId}` : null,
        () => {
            setRefreshGrupo(prev => prev + 1);
        }
    );

    useEffect(() => {
        const handleRefresh = () => setRefreshGrupo(prev => prev + 1);
        window.addEventListener('refreshChatWindow', handleRefresh);
        return () => window.removeEventListener('refreshChatWindow', handleRefresh);
    }, []);

 
    //para  mandar mensajes
    const enviarSolicitud = async (metodo, parametros) => {
        try {
            //console.log('Enviando mensaje...');
            setPreload(true);
            const res = await axios({ method: metodo, url: URL_MENSAJES , data: parametros });
            setPreload(false);
            console.log('Respuesta recibida:', res.data);
           if(metodo=='DELETE'){
                const [tipo, msj] = res.data;
                if (tipo === 'success') { 
                    show_alerta('eliminado', tipo);
                }
            }else{
                if(res.data.success){
                   // show_alerta('Respuesta enviada', 'success');
                    Swal.fire({
                        position: "center",
                        icon: "success",
                        title: "",
                        showConfirmButton: false,
                        timer: 1000
                    }); 
                    //notificacion a firebase
                    const datosFirebase = {
                            id_insertado: res.data.id_insertado,
                            recipient_usernames: res.data.recipient_usernames,
                            mensaje: res.data.mensaje,
                            asunto: res.data.asunto,
                            respuesta_a: res.data.respuesta_a
                    };
                    await axios.post(`${CONFIG.API_URL}/notificarFirebase.php`, datosFirebase);
                    //show_alerta('Notificación enviada', 'success');
                    //final notificacion firebase

                    if (buscaConversaciones) {
                        buscaConversaciones(userId);
                    }

                    // FORZAR refresh en MensajesGrupo para que se renderice inmediatamente
                    setRefreshGrupo(prev => prev + 1);
                } else {
                    console.log('Error en respuesta del servidor:', res.data);
                    show_alerta('Error al enviar respuesta', 'error');
                }
           }

        } catch (err) {
            console.log(err);
        }
    };
    
    const enviarFormData = async (data) => {
        //antes de enviar los datos controlo que  los archivos 
        // NO superen el limite permitido de 100MB para evitar errores en el servidor 
        // y mejorar la experiencia del usuario
        // LIMITE TOTAL 100MB
        const maxSize = 100 * 1024 * 1024;

        let totalSize = 0;

        for (let pair of data.entries()) {
            // Detectar archivos
            if (pair[1] instanceof File) {
                totalSize += pair[1].size;
            }
        }

        if (totalSize > maxSize) {
            show_alerta('Los archivos superan el máximo permitido de 100MB','error');
            //setResponder(false);
            return;
        }

        const modo = data.get('modo');
        if (modo === 'crear_grupo' || modo === 'edita_grupo') {
            setPreload(true);
            try {
                const res = await axios.post(URL_MENSAJES, data);
                setPreload(false);
                if (res.data.success) {
                    show_alerta(modo === 'crear_grupo' ? 'Grupo creado exitosamente' : 'Grupo modificado exitosamente', 'success');
                    if (buscaConversaciones) {
                        buscaConversaciones(userId);
                    }
                    cerrarModal();
                } else {
                    show_alerta(res.data.error || 'Error al procesar el grupo', 'error');
                }
            } catch (err) {
                setPreload(false);
                console.error(err);
                show_alerta('Error en la operación', 'error');
            }
        } else {
            enviarSolicitud("POST", data);
        }
    };

    const cerrarModal = () => {
        setMostrarModal(false);
        setMostrarModalCrearGrupo(false);
        setParaGrupo('');
        setEditarGrupoID(null);
    };

    const eliminarGrupo = (id)=>{
             console.log("eliminacion id::",id)
        const MySwal= withReactContent(Swal); 
        MySwal.fire({
            title: '¿Seguro de eliminar el Grupo?',
            icon: 'question', 
            text: 'No se podrá dar marcha atrás',
            showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar'
        })
        .then(res=>{
            if(res.isConfirmed){
                axios.delete(URL_GRUPOS, {
                    data: {
                        id: id,
                        tabla: 'mensajes_grupo_creado'
                    }
                })
                .then(res =>{
                    //console.log("eliminacion respuesta:",res.data)
                    const tipo = res.data[0];
                    const msj = res.data[1];
                    show_alerta(msj, tipo);
                    // FORZAR refresh en MensajesGrupo para que se renderice inmediatamente
                    setRefreshGrupo(prev => prev + 1);
                })
                .catch(err=>{ console.log(err); })
            }else{
                show_alerta(' NO fue eliminado');
            }
        });
    }

    
    return ( 
    <div className="container-fluid">
        <div className="row">
            {/* LISTA */}
            {(!esMobile || !chatSeleccionado) && (
            <div className={esMobile ? "col-12" : "col-md-4"}>
                <div className="card shadow-sm" style={{height: esMobile ? "auto" : "80vh", display: "flex", flexDirection: "column" }}>
                    <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-2">
                        <span className="fw-semibold text-muted small">Chats</span>
                         <button
                            className='btn btn-sm'
                            onClick={() => {
                                setParaGrupo("");
                                setMostrarModal(true);
                            }}
                            style={{ backgroundColor: 'rgba(219, 226, 237)', color: 'rgba(10, 198, 148, 1)', border: 'none', fontWeight: '500' }}
                        >
                            <i className="fa-solid fa-pencil"></i> Redactar
                        </button>
                        {parseInt(rol) <= 6 && (
                        <button
                            className='btn btn-sm'
                            onClick={() => {setMostrarModalCrearGrupo(true)}}
                             style={{ backgroundColor: '#6c5ce7', color: '#ffffff', border: 'none', fontWeight: '500' }}
                        >
                            <i className="fa-solid fa-plus"></i> grupo
                        </button>
                        )}
                    </div>

                    {/* Filtro superior de conversaciones Todos|Grupos|MD|Difusion*/}
                    <div className="p-2 border-bottom bg-light">
                        <div className="d-flex p-1 bg-light rounded" style={{ gap: '4px', backgroundColor: '#e9ecef' }}>
                            <button
                                type="button"
                                className="btn btn-sm flex-fill border-0 transition-all"
                                style={{
                                    backgroundColor: filtro === 'todos' ? '#ffffff' : 'transparent',
                                    color: filtro === 'todos' ? '#0d6efd' : '#6c757d',
                                    fontWeight: filtro === 'todos' ? '600' : 'normal',
                                    boxShadow: filtro === 'todos' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    fontSize: '0.78rem',
                                    padding: '4px 8px',
                                    borderRadius: '6px'
                                }}
                                onClick={() => setFiltro('todos')}
                            >
                                Todos
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm flex-fill border-0 transition-all"
                                style={{
                                    backgroundColor: filtro === 'md' ? '#ffffff' : 'transparent',
                                    color: filtro === 'md' ? '#0d6efd' : '#6c757d',
                                    fontWeight: filtro === 'md' ? '600' : 'normal',
                                    boxShadow: filtro === 'md' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    fontSize: '0.78rem',
                                    padding: '4px 8px',
                                    borderRadius: '6px'
                                }}
                                onClick={() => setFiltro('md')}
                            >
                                MD
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm flex-fill border-0 transition-all"
                                style={{
                                    backgroundColor: filtro === 'grupos' ? '#ffffff' : 'transparent',
                                    color: filtro === 'grupos' ? '#0d6efd' : '#6c757d',
                                    fontWeight: filtro === 'grupos' ? '600' : 'normal',
                                    boxShadow: filtro === 'grupos' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    fontSize: '0.78rem',
                                    padding: '4px 8px',
                                    borderRadius: '6px'
                                }}
                                onClick={() => setFiltro('grupos')}
                            >
                                Grupos
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm flex-fill border-0 transition-all"
                                style={{
                                    backgroundColor: filtro === 'difusion' ? '#ffffff' : 'transparent',
                                    color: filtro === 'difusion' ? '#0d6efd' : '#6c757d',
                                    fontWeight: filtro === 'difusion' ? '600' : 'normal',
                                    boxShadow: filtro === 'difusion' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    fontSize: '0.78rem',
                                    padding: '4px 8px',
                                    borderRadius: '6px'
                                }}
                                onClick={() => setFiltro('difusion')}
                            >
                                Difusión
                            </button>
                        </div>
                    </div>

                    <div className="list-group list-group-flush" style={{overflowY: "auto", flex: 1}}> 
                        {/* CHATS DE CONVERSACIONES */}
                        {chatsFiltrados.length > 0 ? (
                            chatsFiltrados.map(chat => (
                                <GrupoChat
                                    key={chat.conversacion}
                                    chat={chat}
                                    seleccionado={
                                        chatSeleccionado?.conversacion === chat.conversacion
                                    }
                                    onClick={seleccionarChat}
                                />
                            ))
                        ) : (
                            <div className="text-center py-4 text-muted small">
                                No se encontraron chats
                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}
            {/* CHAT */}
            {(!esMobile || chatSeleccionado) && (
            <div className={esMobile ? "col-12" : "col-md-8"}>
                <div className="card shadow-sm" style={{ height: "80vh" }} >
                    {chatSeleccionado ?
                    <>
                        <MensajesGrupoChat 
                            userId={userId}
                            chatSeleccionado={chatSeleccionado} 
                            volver={volver}
                            enviarFormData={enviarFormData} 
                            configuracion={ configuracion}
                            refreshKey={refreshGrupo}
                            setMostrarModalCrearGrupo={setMostrarModalCrearGrupo}
                            setEditarGrupoID={setEditarGrupoID}
                            eliminarGrupo={eliminarGrupo}
                            buscaConversaciones={buscaConversaciones}
                        />
                        
                        {/*si hay que responder/escribir muestro el formulario para escribir y enviar el mensaje*/}

                    </> 
                    :
                    <>
                        <div className="h-100 d-flex justify-content-center align-items-center">
                            <div className="text-center text-muted">
                                <i className="fa-solid fa-comments fa-4x mb-3"></i>
                                <h5>
                                    Seleccione una conversación
                                </h5>
                            </div>
                        </div>
                    </>
                    }
                </div>

            </div>
            )}
        </div>

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

export default MensajesVisitaChat;
