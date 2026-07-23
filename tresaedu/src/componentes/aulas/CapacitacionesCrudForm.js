import './css/Capacitaciones.css';
import { useEffect, useState } from "react";
import { show_alerta } from '../../funciones.js';

function CapacitacionesCrudForm() {
    const [de, setDe] = useState("");
    const [para, setPara] = useState("");
    const [asunto, setAsunto] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [files, setFiles] = useState([]);
    
    return ( 
            <div className="me-2">
                <h5>"Nuevo mensaje"</h5>
                <form onSubmit={handleSubmint} id='form'>
                    <div className='input-group m-1'>
                        <span className='input-group-text'>Para</span>
                        <input type="text" className="form-control"
                        name="para" 
                        placeholder="Destinatario" 
                        value={para} 
                        onChange={(e) => setPara(e.target.value) } 
                    
                        />
                    </div>
                
                    <div className='input-group m-1'>
                        <span className='input-group-text'>Asunto</span>
                        <input type="text" className="form-control"
                        name="asunto" 
                        onChange={(e) => setAsunto(e.target.value)} 
                        value={asunto} 
                        />
                    </div>
                
                    <div className='form-floating m-1'>
                        <textarea className="form-control mensaje-textarea" rows="10" placeholder="mensaje aqui" 
                        id="floatingTextarea2"
                        name="mensaje" 
                        onChange={(e) => setMensaje(e.target.value) } 
                        value={mensaje} 
                        ></textarea>
                        <label htmlFor="floatingTextarea2">Mensaje</label>
                    </div>                    
                    <div className='input-group m-1 my-3'>
                        <span className='input-group-text'><i className="fa-solid fa-paperclip"></i></span>
                        <input type="file" className="form-control"
                        name="file" 
                        placeholder="adjunto" 
                        multiple onChange={(e) => setFiles([...e.target.files])}
                        defaultValue={files} 
                        />
                    </div>
                    
                                    
                <input className="btn btn-success m-1" type="submit" value="Enviar" /> 
                <input className="btn btn-primary" type="reset" value="Limpiar" onClick={handleReset}/>
                </form>
            </div>
    );
}

export default CapacitacionesCrudForm;