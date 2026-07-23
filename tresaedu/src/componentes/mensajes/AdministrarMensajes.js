import { useEffect, useState } from "react";
import ConfiguracionMensajeria from "./ConfiguracionMensajeria";
import MensajeriaGeneral from "./MensajeriaGeneral";

function AdministrarMensajes({acceder, rol, configuracion}) {
    const [verReglasMensajes, setVerReglasMensajes] = useState(false);

    return (    
        <div className="container-principal mb-4 pb-4">
            <h4 className='d-flex justify-content-center'>Administrar mensajeria</h4>
            <div className="d-flex justify-content-center mb-2">
                <button className={`btn btn-sm mx-2 ${!verReglasMensajes ? 'btn-primary' : 'btn-outline-primary'}`} onClick={()=>setVerReglasMensajes(false)}>Mensajeria general</button>
                {rol==3 && <button className={`btn btn-sm mx-2 ${verReglasMensajes ? 'btn-primary' : 'btn-outline-primary'}`} onClick={()=>setVerReglasMensajes(true)}>Configurar reglas de mensajeria</button>}
            </div>
            {verReglasMensajes ?
                <ConfiguracionMensajeria acceder={acceder} rol={rol} configuracion={configuracion}/>
                :
                <MensajeriaGeneral acceder={acceder} rol={rol}/>
            }
        </div>
     );
}

export default AdministrarMensajes;