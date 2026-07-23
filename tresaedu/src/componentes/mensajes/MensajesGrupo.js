import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import CONFIG from "../../config";
import MensajeAdjuntos from "./MensajeAdjuntos";
import { useFirebaseCounter } from "../../hooks/useFirebaseCounter";
import { set } from "firebase/database";
import PerfilLogo from "../usuarios/PerfilLogo";
import { show_alerta } from '../../funciones.js';

import './css/MensajesGrupo.css';
import MensajesGrupoBurbuja from "./MensajesGrupoBurbuja.js";

const URL_MENSAJES = `${CONFIG.API_URL}/operarMensajes.php`;
const URL_GRUPOS = `${CONFIG.API_URL}/operarGrupos.php`; 

function MensajesGrupo({ rol, 
                        userId, 
                        setSoyAdmin, 
                        soyAdmin, 
                        id_curso_grupo, 
                        tipo, setNombreGrupo, 
                        setImagenGrupo, 
                        setDenominacion, 
                        refreshKey, 
                        configuracion, 
                        setEstadoCurso, 
                        responder,
                        eliminarMensaje }) {
    const [mensajesGrupo, setMensajesGrupo] = useState([]);
    const [participantesGrupo, setParticipantesGrupo] = useState([]);
    const chatRef = useRef(null);
    const [abierto, setAbierto] = useState(false); //para controlar acordeon de participantes en móvil
//    const [soyAdmin, setSoyAdmin] = useState(false);
    
    const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);
    const [usuarios, setUsuarios] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [sugerencias, setSugerencias] = useState([]);
    const usuarioEstaAbajoRef = useRef(true); //flag de control de scroll

   
    const handleScroll = () => {
        const el = chatRef.current;
        if (!el) return;

        usuarioEstaAbajoRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };

    const obtenerMensajesGrupo = useCallback(() => {
        if (!id_curso_grupo) {
            setMensajesGrupo([]);
            setNombreGrupo("");
            setImagenGrupo("");
            return;
        }
        //console.log("Obteniendo mensajes para el grupo:", id_curso_grupo,"tipo:", tipo, "query:",`${URL_MENSAJES}?id_curso_grupo=${id_curso_grupo}&tipo=${tipo}&id_usuario=${userId}`);
        //si tipo es C el id_cursoGrupo es el curso y si es G  es el id_cursoGrupo es el id del grupo tengo que avisar a la api mandando tipo
        axios.get(`${URL_MENSAJES}?id_curso_grupo=${id_curso_grupo}&tipo=${tipo}&id_usuario=${userId}`)
            .then(res => {
                //console.log("Respuesta de mensajes:", res.data);
                if (!res.data.error && Array.isArray(res.data.mensajes)) {
                   
                    if (!res.data.mensajes || res.data.mensajes.length === 0) {
                        setMensajesGrupo([]);
                    } else if (res.data.mensajes[0].id_mensaje === null) {
                        setMensajesGrupo([]);
                    } else {
                        setMensajesGrupo(res.data.mensajes);
                    }
                    setNombreGrupo(res.data.mensajes.length > 0 ? res.data.mensajes[0].nombre_curso : "");
                    setImagenGrupo(res.data.mensajes.length > 0 ? res.data.mensajes[0].imagen : "");
                    setDenominacion(res.data.mensajes.length > 0 ? res.data.mensajes[0].denominacion : "");
                    setEstadoCurso(res.data.mensajes.length > 0 ? res.data.mensajes[0].estado : 'Abierto');
                    // Extraer participantes únicos del grupo 
                    setParticipantesGrupo(res.data.participantes);
                    //console.log("Mensajes grupales obtenidos:", res.data.participantes);
                } else {
                    setMensajesGrupo([]);
                    setParticipantesGrupo([]);
                }
            })
            .catch(err => console.error(err));
    }, [id_curso_grupo, setNombreGrupo, setImagenGrupo, participantesGrupo]);

    // Carga inicial y cuando cambia el grupo O cuando se solicita refreshKey
    useEffect(() => {
        obtenerMensajesGrupo();
    }, [obtenerMensajesGrupo, refreshKey]);

    useEffect(() => {
        setSoyAdmin(participantesGrupo.some(
                    p => p.id === parseInt(userId, 10) && p.rolNombre === 'administrador')
                    );
    }, [participantesGrupo]);

    // Escucha Firebase: ruta mensajes_grupo/curso_{id}
    useFirebaseCounter(
        id_curso_grupo ? `mensajes_grupo/curso_${id_curso_grupo}` : null,
        () => {
            // Pequeño delay para evitar condición de carrera con la inserción DB
            setTimeout(() => {
                obtenerMensajesGrupo();
            }, 180);
        }
    );

    // Auto scroll al final cuando llegan mensajes
    //useEffect(() => {
    //    if (chatRef.current) {
    //        chatRef.current.scrollTop = chatRef.current.scrollHeight;
    //    }
    //}, [mensajesGrupo]);
    useEffect(() => {
        const el = chatRef.current;
        if (!el) return;

        if (usuarioEstaAbajoRef.current) {
            el.scrollTop = el.scrollHeight;
        }
    }, [mensajesGrupo]);

    //para  agregar usuarios
    //obtener usuarios
    useEffect(() => {
    axios.get(`${CONFIG.API_URL}/operarTablaUsuario.php?rol_origen=${rol}`)
        .then(res => setUsuarios(res.data))
        .catch(err => console.log(err));
    }, []);

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

    //funcion agregar
    const agregarParticipante = async (idUsuario) => {

        const yaExiste = participantesGrupo.some(p => p.id === idUsuario);
        if (yaExiste) {
            show_alerta('El usuario ya está en el grupo', 'warning');
            return;
        }

        try {
            const res = await axios.post(URL_GRUPOS, {
                modo: 'agregar_participante',
                id_grupo: id_curso_grupo,
                id_usuario: idUsuario
            });

            if (res.data.success) {
                show_alerta('Participante agregado', 'success');
                obtenerMensajesGrupo();
                setMostrarModalAgregar(false);
                setBusqueda('');
            } else {
                show_alerta('Error al agregar', 'error');
            }
        } catch (err) {
            console.log(err);
        }
    };

    const hacerAdmin = (idUsuario) => {
         enviarSolicitud("PUT", {
            modo: 'hacer_admin',
            id_grupo: id_curso_grupo,
            id_usuario: idUsuario
        });
    };

    const quitarParticipante = async (idUsuario) => {
        enviarSolicitud("DELETE", {modo: 'quitar_participante', id_grupo: id_curso_grupo, id_usuario: idUsuario});

    };

    const enviarSolicitud = async (metodo, parametros) => {
        try {
            console.log('enviado:', parametros);
            const res = await axios({ method: metodo, url: URL_GRUPOS, data: parametros });
            console.log('Respuesta delete:', res.data);
            if(res.data.success){
                show_alerta(`Participante ${metodo === 'DELETE' ? 'eliminado' : 'actualizado'}`, 'success');
                obtenerMensajesGrupo();
            } else {
                show_alerta('Error al enviar respuesta', 'error');
            }
        } catch (err) {
            console.log(err);
        }
    };
   
    

    return (
    <>
    <div className="row">
{/* VERSIÓN MÓVIL: ACORDEÓN PARA PARTICIPANTES */}
{/* si se esta redactando no se muestra */}
        {!responder&&
        <div className="col-12 mt-2">
            <div className="accordion-item">
                <h2 className="accordion-header d-flex">
                    <button
                        className={`accordion-button ${abierto ? '' : 'collapsed'}`}
                        type="button"
                        onClick={() => setAbierto(!abierto)}
                    >
                        <i className="fa-solid fa-people-group mx-2"></i>
                        Participantes ({participantesGrupo.length})
                    </button>
                    {soyAdmin && (tipo === 'GRUPOP' || tipo === 'G') && (
                        <button
                            className="btn btn-outline-primary ms-2"
                            onClick={() => setMostrarModalAgregar(true)}
                        >
                            <i className="fa-solid fa-person-circle-plus"></i>
                        </button>
                    )}
                </h2>

                {/* ESTE es el único collapse */}
                <div className={`accordion-collapse collapse ${abierto ? 'show' : ''}`}>
                    <div className="accordion-body p-2">
                        {participantesGrupo.length > 0 ? (
                            participantesGrupo.map(participante => (
                                <div key={participante.id_usuario} className="d-flex align-items-center mb-3 border-bottom">
                                    <PerfilLogo id={participante.id} version="logo_solo" configuracion={configuracion} />
                                    <div className="small ms-1 flex-grow-1 d-flex justify-content-between">
                                        <span>
                                            {participante.nombre} {participante.apellido}
                                            {participante.id === parseInt(userId, 10) &&
                                                <span className="small ps-1">(Tú)</span>
                                            }
                                        </span>
                                        {/* botonera de opciones para  admin */}
                                        {soyAdmin && (tipo === 'GRUPOP' || tipo === 'G') && participante.id !== parseInt(userId, 10) && (
                                            <div className="acciones-participante ms-2">
                                                {/* hacer admin */}
                                                {participante.rolNombre !== 'administrador' && (
                                                    <button
                                                        className="btn btn-sm btn-warning me-1"
                                                        onClick={() => hacerAdmin(participante.id)}
                                                        title="Hacer administrador"
                                                    >
                                                        <i className="fa-solid fa-user-shield"></i>
                                                    </button>
                                                )}
                                                {/* eliminar */}
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => quitarParticipante(participante.id)}
                                                    title="Quitar del grupo"
                                                >
                                                    <i className="fa-solid fa-user-minus"></i>
                                                </button>
                                            </div>
                                        )}
                                        <span className={`small ${participante.rolNombre === 'docente' ? 'text-secondary' : participante.rolNombre === 'administrador'? 'text-warning':'text-success'}`}>
                                            {participante.rolNombre === 'docente' && <i className="fa-solid fa-chalkboard-user mx-1"></i>}
                                            {participante.rolNombre === 'estudiante' && <i className="fa-solid fa-user-graduate mx-1"></i>}
                                            {participante.rolNombre === 'participante' && <i className="fa-solid fa-user mx-1"></i>}
                                            {participante.rolNombre === 'administrador' && <i className="fa-solid fa-user-shield"></i>}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted">
                                No hay participantes en este grupo.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
        }
        {/* espacio de mensajes */}
        <div className="col-12 ">
            <div
                ref={chatRef}
                className="p-3 ventana-chats"
                onScroll={handleScroll}
            >
            {/*MENSAJES*/}
            {mensajesGrupo.map((mensaje, index) => (
                <MensajesGrupoBurbuja
                    key={index}  
                    mensaje={mensaje} 
                    eliminarMensaje={eliminarMensaje} 
                    userId={userId}
                    configuracion={configuracion}
                />
                
            ))}
            </div>
        </div>
    </div>

    {mostrarModalAgregar && (
    <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">

                {/* HEADER */}
                <div className="modal-header">
                    <h5 className="modal-title">
                        <i className="fa-solid fa-user-plus me-2"></i>
                        Agregar participante
                    </h5>
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setMostrarModalAgregar(false)}
                    ></button>
                </div>

                {/* BODY */}
                <div className="modal-body">

                    <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Buscar usuario..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />

                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                        {sugerencias.length > 0 ? (
                            sugerencias.map(u => (
                                <div
                                    key={u.id}
                                    className="d-flex align-items-center justify-content-between p-2 border-bottom hover-bg-light"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => agregarParticipante(u.id)}
                                >
                                    <div className="d-flex align-items-center">
                                        <PerfilLogo
                                            id={u.id}
                                            version="logo_solo"
                                            configuracion={configuracion}
                                        />
                                        <span className="ms-2 small">
                                            {u.nombre} {u.apellido}
                                        </span>
                                    </div>

                                    <i className="fa-solid fa-plus text-primary"></i>
                                </div>
                            ))
                        ) : (
                            <div className="text-muted small text-center mt-2">
                                Escribí al menos 2 letras...
                            </div>
                        )}
                    </div>

                </div>

                {/* FOOTER */}
                <div className="modal-footer">
                    <button
                        className="btn btn-secondary"
                        onClick={() => setMostrarModalAgregar(false)}
                    >
                        Cerrar
                    </button>
                </div>

            </div>
        </div>

    </div>
    )}
    </>
    );
}

export default MensajesGrupo;