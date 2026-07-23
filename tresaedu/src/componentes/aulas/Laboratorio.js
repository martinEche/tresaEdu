import './css/Laboratorio.css';
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Cuestionarios from "../actividades/Cuestionarios";
import Actividades from "../actividades/Actividades";
import Rubricas from "./Rubricas";

function Laboratorio({acceder, rol, configuracion}) {
    const location = useLocation();
    const [ver, setVer] = useState(location.state?.ver || '');
    const { idMC } = useParams();
    const navigate = useNavigate();
    const idCG =localStorage.getItem('loggeduserCursoGrupo');
    const loggeduserCurso = localStorage.getItem('loggeduserCurso');
    
    
    useEffect(() => {
        if(acceder){
            if((rol===null)){
                navigate("/");
            }
            console.log('idMC: ', idMC);
            console.log('idCG: ', idCG);
            console.log('loggeduserCurso: ', loggeduserCurso);
        }
    }, []);
    return (    
        <div className="container-principal mb-4">
            <h3>Laboratorio <i className='fa-solid fa-flask text-success'></i></h3>
            <div className='d-flex-1'>
                <button type="button" className="btn-laboratorio m-1" onClick={()=>setVer('actividades')}>Actividades</button>
                <button type="button" className="btn-laboratorio m-1" onClick={()=>setVer('cuestionario')}>Cuestionarios</button>
                <button type="button" className="btn-laboratorio m-1" onClick={()=>setVer('rubrica')}>Rúbricas de evaluación</button>
            </div>
            {ver==='actividades' && <Actividades idMC={idMC} rol={rol} />}
            {ver==='cuestionario' && <Cuestionarios idMC={idMC} rol={rol}  />}
            {ver==='rubrica' && <Rubricas idMC={idMC} rol={rol} idCG={idCG} configuracion={configuracion}/>}
        </div>
     );
}

export default Laboratorio;