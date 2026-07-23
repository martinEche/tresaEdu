import { useState, useEffect } from "react";
import AlertaTarjeta from "./AlertaTerjeta";

function Alertas({userId, rol}) {
    const [vinculados, setVinculados] = useState([]);
    const [alertas, setAlertas] = useState([{'tipo':'Inasistencias', 'datos':[{'id':'1','fecha':'2025/05/04','espacio':''}]},{'tipo':'Logros', 'datos':[{'id':'1','fecha':'2025/03/04','espacio':'Matemática'}]}]);

    useEffect(() => {
        if(rol==8){
            buscaVinculaciones();
            buscaAlertas('tutor');
        }
        if(rol<=4){
            buscaAlertas('general');
        }

    }, []);
    
    const buscaVinculaciones =()=>{

    }
    const  buscaAlertas=(tipo)=>{
        
    }
    return (    
    <>
        {alertas.length!==0 && alertas.map((a,index)=>(
            <div key={index}><AlertaTarjeta titulo={a.tipo} subtitulo={'Martin'} datos={a.datos}/></div>
        ))
        }
        

    </>
     );
}

export default Alertas;