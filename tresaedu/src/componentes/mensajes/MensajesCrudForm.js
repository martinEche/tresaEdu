import './css/Mensajes.css';
import { useEffect, useRef, useState } from "react";
import axios from 'axios';
import { show_alerta } from '../../funciones.js';
import CONFIG from '../../config';
import EmojiTextarea from './EmojiTextarea';
import Espera from '../Espera.js';
import EsperaFull from '../EsperaFull.js';

const URL_USUARIOS = `${CONFIG.API_URL}/operarTablaUsuario.php`;

function MensajesCrudForm({ enviarFormData, respuesta_a, para_r, asunto_r, llamoNuevo, cerrarModal, textareaRef, preload, esChat = false }) {
    const [de, setDe] = useState("");
    const [para, setPara] = useState(para_r);
    const [asunto, setAsunto] = useState(asunto_r);
    const [mensaje, setMensaje] = useState("");
    const [files, setFiles] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [sugerencias, setSugerencias] = useState([]);
    const [habilitaEnvio, setHabilitaEnvio] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const loggeduserRolId = localStorage.getItem('loggeduserRolId');
    //Para grabacion
    const [grabando, setGrabando] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioURL, setAudioURL] = useState(null);
    const [tiempoGrabacion, setTiempoGrabacion] = useState(0);
    const timerRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        setDe(JSON.parse(localStorage.getItem('loggeddatosuser')).usuario);
        obtenerUsuariosPermitidos(loggeduserRolId);
    }, []);
    
    const obtenerUsuariosPermitidos = (rol_origen) =>{
        axios.get(`${URL_USUARIOS}?rol_origen=${rol_origen}`)
            .then(res => { setUsuarios(res.data); console.log('usuariosPermitidos:',res.data);})
            .catch(err => { console.error("Error al obtener usuarios:", err); });
    }
    
    useEffect(() => {
        const termino = para.split(',').slice(-1)[0].trim();

        if (termino.length >= 2) {

            const texto = normalizarTexto(termino);

            const filteredUsers = usuarios.filter(usuario =>
                normalizarTexto(
                    `${usuario.nombre} ${usuario.apellido} ${usuario.usuario} ${usuario.roles || ''}`
                ).includes(texto)
            );

            setSugerencias(filteredUsers);
        } else {
            setSugerencias([]);
        }
    }, [para, usuarios]);

    const seleccionarUsuario = (usuario) => {
        const nuevosPara = para.split(',').slice(0, -1).concat(`${usuario.usuario} <<${usuario.nombre} ${usuario.apellido}>>,`).join(', ');
        setPara(nuevosPara);
        setHabilitaEnvio(true);
        setSugerencias([]);
    };

    const handleSubmint = async (e) => {
        e.preventDefault();
        
        if (isSubmitting || preload) return;
        setIsSubmitting(true);

        let finalAsunto = asunto;
        if (esChat && !finalAsunto) {
            finalAsunto = 'Chat';
        }

        if (!para) {
            show_alerta('Faltan datos', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('respuesta_a', respuesta_a);
        formData.append('de', de);
        formData.append('para', para);
        formData.append('asunto', finalAsunto);
        formData.append('mensaje', mensaje);

        files.forEach((file, index) => {
            formData.append(`file${index}`, file);
        });
        if (audioBlob) {
            formData.append('audio', audioBlob, 'audio.webm');
        }
        
        try {
            await enviarFormData(formData);
        } finally {
            setIsSubmitting(false);
        }

        //si es vista chat limpiar solo el mensaje adjuntos y audios
        if (esChat) {
            setMensaje("");
            setFiles([]);
            setAudioBlob(null);
            setAudioURL(null);
            return;
        }else{
            handleReset();
        }
    }

    const handleReset = () => {
        setPara("");
        setAsunto("");
        setMensaje("");
        setFiles([]);
        setAudioBlob(null);
        setAudioURL(null);
    };

    const handleCerrar = () => {
        if (llamoNuevo) {
            cerrarModal();
        } else {
            cerrarModal(false);
        }
    };

    const normalizarTexto = (texto) => {
        return (texto || "")
            .toLowerCase()
            .normalize("NFD") // separa letras de acentos
            .replace(/[\u0300-\u036f]/g, ""); // elimina acentos
    };
    
    //Funciones para  grabacion de audio
    const iniciarGrabacion = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            streamRef.current = stream; // 👈 GUARDAR STREAM

            const recorder = new MediaRecorder(stream);

            let chunks = [];

            recorder.ondataavailable = (e) => {
                chunks.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioURL(URL.createObjectURL(blob));
            };

            recorder.start();
            setMediaRecorder(recorder);
            setGrabando(true);

            // 🔥 INICIAR CONTADOR
            setTiempoGrabacion(0);
            timerRef.current = setInterval(() => {
                setTiempoGrabacion(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error(err);
            show_alerta("No se pudo acceder al micrófono", "error");
        }
    };

    const detenerGrabacion = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setGrabando(false);
            
            // 🔥 DETENER MICRÓFONO REAL
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            // DETENER CONTADOR
            clearInterval(timerRef.current);
        }
    };

    const formatearTiempo = (segundos) => {
        const min = Math.floor(segundos / 60);
        const sec = segundos % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    return (
    <div className="me-2 mb-4">
    {!preload?  
        <form onSubmit={handleSubmint} id='form'>
            <input type="hidden" name="respuesta_a" value={respuesta_a} />
            {/*llamoNuevo: si es mensaje directo nuevo acomodo encabezado del form para y asunto */}
            {/*para_r=='': muestro campo de texto para ingresar destinatario y buscador de usuarios */}
            {llamoNuevo? 
            <>
                {para_r==''?
                <>
                    <div className='input-group input-group-sm mb-3'>
                        <span className='input-group-text' id='inputGroup-sizing-sm'>Para</span>
                        <input
                            type="text"
                            className="form-control bg-light"
                            name="para"
                            placeholder="Destinatario"
                            autoComplete="off"
                            value={para}
                            onChange={(e) => setPara(e.target.value)}
                            aria-label="Sizing example input" 
                            aria-describedby="inputGroup-sizing-sm"
                        />
                    </div>
                    {sugerencias.length > 0 && (
                        <ul className="lista-sugerencias">
                            {sugerencias.map(usuario => (
                                <li key={usuario.usuario} onClick={() => seleccionarUsuario(usuario)}>
                                    {usuario.nombre} {usuario.apellido} 
                                    <small style={{color: '#666'}}> ({usuario.roles})</small>
                                </li>
                            ))}
                        </ul>
                    )}
                    {para}
                </>    
                :
                    <input type="hidden" name="para" value={para} />
                }              
                
                {!esChat && (
                    <div className='input-group m-1'>
                        <span className='input-group-text small'>Asunto</span>
                        <input
                            type="text"
                            className="form-control bg-light"
                            name="asunto"
                            onChange={(e) => setAsunto(e.target.value)}
                            value={asunto}
                        />
                    </div>
                )}
            </>
            : 
            <>
                {/*Si es respuesta a mensaje o mensaje grupal, los campos para y asunto vienen ocultos*/}
                <input type="hidden" name="para" value={para} />
                <input type="hidden" name="asunto" value={asunto} />
            </>
            }

            {/* NUEVO TEXTAREA CON EMOJIS */}
            {/* si se activo envio de audio oculto el area de texto */}
            {/* SOLO mensajes nuevos */}
            {(llamoNuevo && para_r=='') && (
                <EmojiTextarea
                    value={mensaje}
                    onChange={setMensaje}
                    rows={5}
                    placeholder="Mensaje aquí"
                    name="mensaje"
                />
            )}
            {/* BOTONERA al PIE  */}
            <div className={`chat-toolbar ${respuesta_a === 0 && para_r === '' ? 'toolbar-directo' : 'toolbar-grupo'}`}>

                {/* IZQUIERDA */}
                <div className="toolbar-left">
                    {!(llamoNuevo && para_r=='') && (
                        <>
                            {!audioURL ?
                                !grabando ? (
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={iniciarGrabacion}
                                    >
                                        <i className="fa-solid fa-microphone"></i>
                                    </button>
                                ) : (
                                    <div className="d-flex align-items-center gap-2 w-100">
                                        <div className="grabando-indicador flex-grow-1">
                                            <div className="punto-rojo-parpadeando"></div>
                                            
                                            <span className="tiempo-grabacion">
                                                {formatearTiempo(tiempoGrabacion)}
                                            </span>

                                            <div className="ondas-audio ms-2">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-danger btn-sm"
                                            onClick={detenerGrabacion}
                                        >
                                            <i className="fa-solid fa-stop"></i>
                                        </button>
                                    </div>
                                )
                            :
                            <>
                                <audio className='audio-url' controls src={audioURL}></audio>
                                <button 
                                    type='button' 
                                    className='btn btn-outline-secondary btn-sm' 
                                    onClick={()=>{
                                        setAudioURL(null);
                                        setAudioBlob(null);
                                    }}>
                                        <i className="fa-regular fa-trash-can"></i>
                                </button>
                            </>
                            }
                        </>
                    )}

                    {!audioURL && !grabando && (
                        <label className="btn btn-outline-secondary btn-sm">
                            <i className="fa-solid fa-paperclip"></i>
                            {files.length > 0 &&
                                <span className="ms-1">
                                    {files.length}
                                </span>
                            }

                            <input
                                type="file"
                                multiple
                                hidden
                                onChange={(e)=>{
                                    setFiles([...e.target.files]);
                                }}
                            />
                        </label>
                    )}
                    {/* TEXTAREA DENTRO DE LA BARRA */}
                    {!(llamoNuevo && para_r=='') && 
                    <>
                        {!audioURL && !grabando &&
                            <EmojiTextarea
                                value={mensaje}
                                onChange={setMensaje}
                                rows={1}
                                placeholder="Mensaje aquí"
                                name="mensaje"
                            />
                        }
                    </>}
                </div>

                {/* DERECHA */}
                <div className="toolbar-right ">
                    {(llamoNuevo && para_r=='') && (
                        <button
                            type="button"
                            className="btn btn-outline-warning btn-sm"
                            onClick={handleReset}
                        >
                            Limpiar
                        </button>
                    )}
                    
                    {!grabando && (
                        <button
                            className="btn btn-success btn-sm px-4"
                            type="submit"
                            disabled={(!habilitaEnvio && !respuesta_a && !para_r) || isSubmitting || preload}
                        >
                            <i className="fa-solid fa-paper-plane"></i>
                        </button>
                    )}
                    {llamoNuevo &&
                        <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={handleCerrar}
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    }
                </div>
            </div>        
        </form>
    :
        <EsperaFull visible={preload} />
    }
    </div>
    )
}

export default MensajesCrudForm;
