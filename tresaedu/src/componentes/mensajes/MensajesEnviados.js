import './css/Mensajes.css';
import axios from 'axios';
import { useState , useEffect} from 'react';
import { show_alerta } from '../../funciones.js';

import CONFIG from '../../config';

const URL_LISTAR_MENSAJES = `${CONFIG.API_URL}/listarMensajes.php`;

function MensajesEnviados({userId, eliminarMensaje, buscaMensajes, mensajesEnviados}){
  

    useEffect(() => {
        if (userId) {
            buscaMensajes(userId, 'ENVIADOS');
        }
    }, [userId]);
  
   
    const handleEventContainerClick = (e) => e.stopPropagation();

    return(
        <div className='container'>
            <table className="table table-sm table-fixed table-hover" width="100%">
                <thead><tr><td colSpan="6"></td></tr></thead>
                <tbody>
                { mensajesEnviados.length===0 ? <tr><td colSpan="5" className='text-center'>Sin mensajes</td></tr> :
                    mensajesEnviados.map(m => (

                    <tr id="row_R_" key={m.id_mensajeE} className='mensaje-row' onClick={()=>alert("mensaje")}>
                        <td><input type="checkbox" onClick={handleEventContainerClick} /></td>
                        <td id="col_R_" className="align-top" valign="top" >
                            <span className=""><i className={`fa-regular ${m.estado==1 ? "fa-envelope-open" : "fa-envelope"}`}></i></span>
                        </td>
                        <td width="15%">
                            <span className="small">Para:{m.para.substring(0, (23-m.para.length))}</span>
                        </td>
                        <td width="70%">
                            <span className="align-top small"><b>{m.asunto}</b>- {m.mensaje.substring(0, (80-m.asunto.length))}...</span>
                        </td>
                        <td width="10%">
                            <span className="small" align="right">{m.fecha.substring(0, 10)}</span>
                        </td>
                        <td width="5%">
                               
                               <button type='button' 
                               className='btn btn-sm btn-ligth'  
                               onClick={(e) => {
                                       e.stopPropagation(); // Detener la propagación del evento
                                       eliminarMensaje(m.id_mensajeE,'mensajes_enviados');
                                       buscaMensajes(userId, 'ENVIADOS');
                               }}
                               >
                                   <i className="fa-solid fa-trash"></i>
                               </button>
                           </td>
                    </tr>
                    ))
                }  
                </tbody>					  
            </table>
        </div>
    );
}

export default MensajesEnviados;