import './css/Mensajes.css';
import axios from 'axios';
import { useState , useEffect} from 'react';
import { useRef } from 'react';
import AudioBurbuja from "./AudioBurbuja";
import CONFIG from '../../config';

const URL_LISTAR_MENSAJES = `${CONFIG.API_URL}/listarMensajes.php`;

function MensajeAdjuntos({ mensaje_id, onPlayGlobal }) {
    const [adjuntos, setAdjuntos] = useState([]);
    const [mediaModal, setMediaModal] = useState(null);

    const data= {
        'id' :  mensaje_id,
        'tipo'  :'ADJUNTOS'
    }


    useEffect( ()=>{
        axios.post(URL_LISTAR_MENSAJES, data)
        .then(res =>{
           // console.log('listarmensajesres.data:', res.data);
            if(!res.data.error){ 
                setAdjuntos(res.data);
            }else{
                setAdjuntos([]);                
            }
        })
        .catch(err=>{
            console.log(err);
        })
    },[mensaje_id]);

    useEffect(() => {
        if (mediaModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [mediaModal]);

    const handleEventContainerClick = (e) => e.stopPropagation();

    const esImagen = (nombre) => {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(nombre);
    };

    const esVideo = (nombre) => {
        return /\.(mp4|webm|ogg|mov|avi)$/i.test(nombre);
    };
    
    const esAudio = (nombre) => {
        return /\.(mp3|wav|ogg|webm|m4a)$/i.test(nombre);
    };

    const obtenerIcono = (nombre) => {
        if (nombre.match(/\.pdf$/i)) return "fa-file-pdf";
        if (nombre.match(/\.doc|\.docx$/i)) return "fa-file-word";
        if (nombre.match(/\.xls|\.xlsx$/i)) return "fa-file-excel";
        return "fa-file-lines";
    };

    return(
    <>
        <div className="contenedor-adjuntos" onClick={handleEventContainerClick}>
        {adjuntos.map(ad => {
            const url = `${CONFIG.API_URL}/${ad.path_archivo}`;

            if (esImagen(ad.nombre_archivo)) {
                return (
                    <div key={ad.id} onClick={() => setMediaModal({ url: url, tipo: 'imagen' })} style={{ display: 'inline-block' }}>
                        <img 
                            src={url}
                            alt={ad.nombre_archivo}
                            className="adjunto-img"
                        />
                    </div>
                );
            }

            if (esVideo(ad.nombre_archivo) && !(ad.nombre_archivo.includes("audio_"))) {
                return (
                    <video 
                        src={url}
                        muted
                        preload="metadata"
                        className="adjunto-video"
                        onClick={() => setMediaModal({ url: url, tipo: 'video' })}
                        onLoadedMetadata={(e) => {
                            e.target.currentTime = 1;
                        }}
                    />                
                );
            }

            if (esAudio(ad.nombre_archivo) && ad.nombre_archivo.includes("audio_")) {
                return (
                    <AudioBurbuja 
                        key={ad.id}
                        src={url}
                        esPropio={ad.de == localStorage.getItem('loggedUserId')}
                        onPlayGlobal={onPlayGlobal}
                    />
                );
            }

            return (
                <a 
                    key={ad.id} 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="adjunto-doc"
                >
                    <i className={`fa-solid ${obtenerIcono(ad.nombre_archivo)} me-2`}></i>
                    <span className="nombre-doc">{ad.nombre_archivo}</span>
                </a>
            );
        })}        
        </div>
        {mediaModal && (
            <div 
                className="modal-video-overlay" 
                onClick={() => setMediaModal(null)}
            >
                <div 
                    className="modal-video-content"
                    onClick={(e) => e.stopPropagation()} // 👈 evita que cierre al hacer click en el media
                >
                    <button 
                        className="cerrar-modal-video"
                        onClick={() => setMediaModal(null)}
                    >
                        ✕
                    </button>

                    {mediaModal.tipo === 'video' ? (
                        <video 
                            src={mediaModal.url} 
                            controls 
                            autoPlay 
                        />
                    ) : (
                        <img 
                            src={mediaModal.url} 
                            alt="Vista previa" 
                            style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: "10px" }}
                        />
                    )}
                </div>
            </div>
        )}
    </>
    )
};

export default MensajeAdjuntos;