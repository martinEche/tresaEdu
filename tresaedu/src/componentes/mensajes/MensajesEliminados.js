import './css/Mensajes.css';
import axios from 'axios';
import { useState , useEffect} from 'react';
import { show_alerta } from '../../funciones.js';

import CONFIG from '../../config';

const URL_LISTAR_MENSAJES = `${CONFIG.API_URL}/listarMensajes.php`;

function MensajesEliminados({userId, eliminarMensaje, buscaMensajes, mensajesEliminados}){

    useEffect(() => {
        if (userId) {
            buscaMensajes(userId, 'ELIMINADOS');
        }
    }, [userId]);
  
    
    return(
        <div className='container'>
            <table className="table table-sm table-fixed table-hover" width="100%">
                <thead><tr><td colSpan="5"></td></tr></thead>
                <tbody>
                { mensajesEliminados.length===0 ? <tr><td colSpan="5" className='text-center'>Sin mensajes</td></tr> :
                    mensajesEliminados.map((m,index) => (

                    <tr id="row_R_" key={index} className='mensaje-row' onClick={()=>alert("mensaje")}>
                        <td id="col_R_" className="align-top" valign="top" >
                            <span className=""><i className="fa-regular fa-trash-can"></i></span>
                        </td>
                        <td width="20%">
                            <span className="small"><b>{m.apellido}, {m.nombre.substring(0, (23-m.apellido.length))} </b></span>
                        </td>
                        <td width="70%">
                            <span className="align-top small"><b>{m.asunto}</b>- {m.mensaje.substring(0, (80-m.asunto.length))}...</span>
                        </td>
                        <td width="10%">
                            <span className="small" align="right"></span>
                        </td>
                        <td width="5%">
                               
                               <button type='button' 
                               className='btn  btn-ligth text-danger' 
                               onClick={(e) => {
                                       e.stopPropagation(); // Detener la propagación del evento
                                       eliminarMensaje(m.id_me,m.tipo);

                                       
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

export default MensajesEliminados;