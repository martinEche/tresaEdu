import axios from "axios";
import CONFIG from "../../config";
import { useState, useEffect, useRef } from "react";

import PerfilLogo from "../usuarios/PerfilLogo";
import MensajeAdjuntos from "./MensajeAdjuntos";
import { RenderTexto } from "./RenderTexto";

const URL_REACCIONES = `${CONFIG.API_URL}/operarReacciones.php`;

function MensajesGrupoBurbuja({mensaje, eliminarMensaje, userId, configuracion}) {
    
    const [reacciones, setReacciones] = useState([]);
    const [mostrarReacciones, setMostrarReacciones] = useState(false);
    const [miReaccion, setMiReaccion] = useState(null);
    const [totalesReacciones, setTotalesReacciones] = useState({
        like: 0,
        dislike: 0
    });


    const esMio = mensaje.id_usuario === parseInt(userId, 10);

    useEffect(() => {
        cargarReacciones();
    }, [mensaje.id_mensaje]);

    //** Se usa en componente MensajeAdjunto caso audios 
    // para  controlar un solo audio abierto a la vez
    const audioActivoRef = useRef(null);
        
    // Control global para pausar otros audios al reproducir uno nuevo
    const handlePlayGlobal = (audio) => {
            if (audioActivoRef.current && audioActivoRef.current !== audio) {
                audioActivoRef.current.pause();
            }
            audioActivoRef.current = audio;
    };

    //formateo de fecha de esto 2026-05-07 11:42:04 a esto 07-05-2026 11:42
    const formatearFecha = (fecha) => {
        if (!fecha) return '';

        const [fechaParte, horaParte] = fecha.split(' ');
        const [anio, mes, dia] = fechaParte.split('-');
        const horaMinuto = horaParte.substring(0,5);

        return `${dia}-${mes}-${anio} ${horaMinuto}`;
    };
    //Cargar reacciones desde la BD
    const cargarReacciones = async () => {
        try {

            const res = await axios.get(
                `${URL_REACCIONES}?id_mensaje=${mensaje.id_mensaje}`
            );

            //console.log('respuesta reacciones:', res.data);

            if (!res.data.error) {

                // detalle completo
                setReacciones(res.data.reacciones || []);

                // buscar mi reacción
                const miReaccionEncontrada = (res.data.reacciones || []).find(
                    r => parseInt(r.id_usuario, 10) === parseInt(userId, 10)
                );

                setMiReaccion(
                    miReaccionEncontrada
                        ? miReaccionEncontrada.tipo_reaccion
                        : null
                );

                // opcional: guardar totales separados
                setTotalesReacciones(
                    res.data.totales || {
                        like: 0,
                        dislike: 0
                    }
                );
            }

        } catch (err) {
            console.log(err);
        }
    };

    // fucion para reaccionar a un mensaje (like, nolike, etc)
    const reaccionar = async (tipo) => {
        console.log(`Reaccionando con ${tipo} al mensaje ${mensaje.id_mensaje} y mi reaccione es ${miReaccion}`);
        try {
            // si ya reaccionó igual -> eliminar
            if (miReaccion === tipo) {
                await axios.delete(URL_REACCIONES, {
                    data: {
                        id_mensaje: mensaje.id_mensaje,
                        id_usuario: userId
                    }
                });
                setMiReaccion(null);
            } else {
                await axios.post(URL_REACCIONES, {
                    id_mensaje: mensaje.id_mensaje,
                    id_usuario: userId,
                    tipo_reaccion: tipo
                });
                setMiReaccion(tipo);
            }
            cargarReacciones();
        } catch (err) {
            console.log(err);
        }
    };
    //contadores de reacciones
    const likes = reacciones.filter(r => r.tipo_reaccion === 'like').length;
    const dislikes = reacciones.filter(r => r.tipo_reaccion === 'dislike').length;
    
    return ( 
        <>
        <div className={`d-flex mb-3 ${esMio ? "justify-content-end" : "justify-content-start"}`}>
            {/* AVATAR  de quien envia SOLO PARA OTROS */}
            {!esMio && (
                <div className="avatar-chat me-2">
                    <PerfilLogo
                        id={mensaje.id_usuario}
                        version="logo_solo"
                        configuracion={configuracion}
                    />
                </div>
            )}
            {/* BURBUJA chat grupal */}
            {/* primero chequeo que no este eliminado*/}
                <div className={`burbuja-chat ${esMio ? "burbuja-mia" : "burbuja-otro"}`}>   
                {!esMio && (
                    <div className="nombre-chat">
                        {mensaje.nombre} {mensaje.apellido} 
                    </div>
                )}
                {parseInt(mensaje.estado_recibido) === 3 || parseInt(mensaje.estado_enviado) === 3 ?
                    <div className="texto-chat text-secondary small">
                        <i className="fa-solid fa-ban mx-1"></i>
                            mensaje eliminado
                    </div>
                :
                <>
                    <div className="texto-chat">
                        <RenderTexto texto={mensaje.mensaje} />
                    </div>
                    {mensaje.adjunto === "Si" && (
                        <MensajeAdjuntos mensaje_id={mensaje.id_mensaje} onPlayGlobal={handlePlayGlobal} />
                   )}
                    <div className="hora-chat">
                        {formatearFecha(mensaje.fecha)}
                        {/* si es mio muestro el botosn para  eliminarlo */}
                        {esMio && (
                            <span className="text-end">
                                <a href='#' className='ms-2 small' 
                                    onClick={(e) => {
                                            e.stopPropagation(); // Detener la propagación del evento para que no navegue
                                            eliminarMensaje(mensaje.id_mensaje, 'chat');
                                    }}
                                >
                                    <i className="fa-solid fa-trash"></i>
                                </a>
                            </span>
                        )}
                    </div>
                    {/* REACCIONES */}
                    <div className="reacciones-chat mt-2">
                        <button className={`btn btn-sm me-2 ${miReaccion === 'like'? 'btn-primary':'btn-outline-secondary'}`}
                            onClick={() => reaccionar('like')}
                        >
                           <i className="fa-regular fa-thumbs-up"></i> {likes}
                        </button>
                        <button className={`btn btn-sm me-2 ${miReaccion === 'dislike'? 'btn-danger':'btn-outline-secondary'}`}
                            onClick={() => reaccionar('dislike')}
                        >
                            <i className="fa-regular fa-thumbs-down"></i> {dislikes}
                        </button>
                        {reacciones.length > 0 && (
                            <button className="btn btn-sm btn-link"
                                onClick={() =>
                                    setMostrarReacciones(!mostrarReacciones)
                                }
                            >
                                {mostrarReacciones
                                    ? 'Ocultar'
                                    : 'Ver reacciones'}
                            </button>
                        )}
                        {mostrarReacciones && (
                            <div className="mt-2 border-top pt-2">

                                {reacciones.map((r, index) => (
                                    <div
                                        key={index}
                                        className="d-flex align-items-center justify-content-between py-1"
                                    >

                                        {/* IZQUIERDA: avatar + nombre */}
                                        <div className="d-flex align-items-center">

                                            <PerfilLogo
                                                id={r.id_usuario}
                                                version="logo_solo"
                                                configuracion={configuracion}
                                            />
                                            <span className="ms-2 small">
                                                {r.nombre} {r.apellido}
                                            </span>
                                        </div>

                                        {/* DERECHA: reacción */}
                                        <div className="ms-3">
                                            {r.tipo_reaccion === 'like' ? (
                                                <i className="fa-solid fa-thumbs-up text-primary"></i>
                                            ) : (
                                                <i className="fa-solid fa-thumbs-down text-danger"></i>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
                }
            </div>
        </div>
        </>
    );
}
export default MensajesGrupoBurbuja;