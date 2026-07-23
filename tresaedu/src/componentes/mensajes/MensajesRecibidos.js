// src/components/mensajes/MensajesRecibidos.js
import './css/Mensajes.css';
import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import MensajeAdjuntos from './MensajeAdjuntos.js';

function MensajesRecibidos({ userId, eliminarMensaje, buscaMensajes, mensajesRecibidos }){
    const navigate = useNavigate();
    
    useEffect(() => {
        if (userId) {
            buscaMensajes(userId, 'RECIBIDOS');
        }
    }, [userId, buscaMensajes]);
    
    return (
        <div className='container'>
            <table className="table table-sm table-fixed table-hover" width="100%">
                <thead><tr><td colSpan="5"></td></tr></thead>
                <tbody>
                { !Array.isArray(mensajesRecibidos) || mensajesRecibidos.length === 0 ? ( 
                    <tr><td colSpan="4" className='text-center'>Sin mensajes</td></tr> 
                ) : (
                    mensajesRecibidos.map(m => {
                        // aseguramos un id consistente (preferimos id_mensaje si existe)
                        // sie m.id_curso es mayor a 0 va con C si es menor que 0 va con G y si es 0 va con D
                        return (
                        <tr
                            key={m.id_mensajeR}
                            className='mensaje-row'
                            onClick={() => navigate(`/Mensajes/enRecibidos/${m.id_mensajeR}/${m.id_curso > 0 ? 'C' : m.id_curso < 0 ? 'G' : 'D'}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <td className="align-top " valign="top">
                                <span><i className={` ${m.estado == 1 ? "fa-regular fa-envelope-open" : "text-warning fa-solid fa-envelope"}`}></i></span>
                                {m.id_curso > 0 &&<span className="badge text-bg-warning small text-muted mx-1">grupo C</span>}
                                {m.id_curso < 0 &&<span className="badge text-bg-info small text-muted mx-1">grupo P</span>}
                            </td>
                            <td width="20%">
                                <span className="small"><b>{m.apellido}, {m.nombre && m.nombre.length > (23 - (m.apellido?.length || 0)) ? m.nombre.substring(0, (23 - (m.apellido?.length || 0))) : m.nombre}</b></span>
                            </td>
                            <td width="55%">
                                <span className="align-top small"><b>{m.asunto}</b> - {m.mensaje && m.mensaje.length > (80 - (m.asunto?.length || 0)) ? m.mensaje.substring(0, (80 - (m.asunto?.length || 0))) : m.mensaje}...</span>
                                {m.adjunto === 'Si' && <MensajeAdjuntos mensaje_id={m.id_mensaje ?? m.id_mensajeR} />}
                            </td>
                            <td width="10%">
                                <span className="small" align="right">{m.fecha ? m.fecha.substring(0, 10) : ''}</span>
                            </td>
                            <td width="5%">
                                <button type='button' 
                                    className='btn btn-sm btn-ligth'  
                                    onClick={(e) => {
                                        e.stopPropagation(); // Detener la propagación del evento para que no navegue
                                        eliminarMensaje(m.id_mensajeR ?? m.id_mensaje,'mensajes_recibidos');
                                    }}
                                >
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                        )
                    })
                )}
                </tbody>					  
            </table>
        </div>
    );
}

export default MensajesRecibidos;
