import './css/Aulas.css';
import React, { useEffect, useState } from 'react';


function ClaseActividadesForm({setEditaActividad, id_clase, trabajosCurso, cuestionarioCurso, enviarSolicitud}) {
    const [trabajoCursoFijar, setTrabajoCursoFijar] = useState([]);
    const [cuestionarioCursoFijar, setCuestionarioCursoFijar] = useState([]);

    const [cuestionario, setCuestionario] = useState("");
    const [trabajo, setTrabajo] = useState("");
    useEffect(() => {
        setTrabajoCursoFijar(trabajosCurso.filter((a) =>{
            if( a.id_clase == null || a.id_clase === "" || a.id_clase === "null" ){
                return true;
            }
            return false;
        }))   
        setCuestionarioCursoFijar(cuestionarioCurso.filter((c) =>{
            if( c.id_clase == null || c.id_clase === "" || c.id_clase === "null" ){
                return true;
            }
            return false;
        }))
    }, [trabajosCurso, cuestionarioCurso]);
    const handleSubmitTrabajos = (e) =>{
        e.preventDefault();
       // console.log(actividad);
        const formData = new FormData();
        formData.append('nuevo', 'ActividadPoner');
        formData.append('id_trabajo', trabajo);
        formData.append('id_clase', id_clase);
        formData.append('id_usuario', '0');
        enviarSolicitud("POST",formData);
        setEditaActividad(false);
    }
    const handleSubmitCuestionario = (e) =>{
        e.preventDefault();
       // console.log(actividad);
        const formData = new FormData();
        formData.append('nuevo', 'CuestionarioPoner');
        formData.append('id_trabajo', cuestionario);
        formData.append('id_clase', id_clase);
        formData.append('id_usuario', '0');
        enviarSolicitud("POST",formData);
        setEditaActividad(false);
    }
    return (    
        <>
        <form className="my-3" onSubmit={handleSubmitTrabajos}>
            <div className="row">
                <div className="col-10">
                    <select className="form-select" onChange={(e)=>setTrabajo(e.target.value)}>
                        <option>Selecciona una actividad </option>
                      {trabajoCursoFijar.map((a)=>(
                        <option key={a.id} defaultValue={a.id} value={a.id}>{a.titulo}</option>
                      ))}
                    </select>
                </div>
                <div className="col-2">
                    <button type="submit" className="btn btn-sm btn-success"><i className="fa-solid fa-thumbtack"></i> fijar</button>
                </div>
            </div>  
        </form>        
        <form className="my-3" onSubmit={handleSubmitCuestionario}>
            <div className="row">
                <div className="col-10">
                    <select className="form-select" onChange={(e)=>setCuestionario(e.target.value)}>
                        <option>Seleccione un cuestionario</option>
                      {cuestionarioCursoFijar.map((c)=>(
                        <option key={c.id} defaultValue={c.id} value={c.id}>{c.titulo}</option>
                      ))}
                    </select>
                </div>
                <div className="col-2">
                    <button type="submit" className="btn btn-sm btn-success"><i className="fa-solid fa-thumbtack"></i> fijar</button>
                </div>
            </div>  
        </form>        
        </>
     );
}

export default ClaseActividadesForm;    