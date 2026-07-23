import { useEffect, useState } from "react";
import axios from 'axios';
import CrearCuestionario from "../actividades/CrearCuestionario";
import CrearCuestionarioIA from "../IA/CrearCuestionarioIA";

import CONFIG from '../../config';
import { useNavigate } from "react-router-dom";


const URL_CUESTIONARIO = `${CONFIG.API_URL}/operarCuestionario.php`;

function Cuestionarios({idMC, rol}) {
   
    const loggeduserId =localStorage.getItem('loggedUserId');
    const [formularios, setFormularios]= useState([]);
    const [cuestionario, setCuestionario] = useState([{"id":0,"titulo":"","descripcion":"","preguntas":{ pregunta_texto: '', pregunta_tipo: 'text', opciones: [''], correctas: [] }}]);
    const [verNuevoCuestionario, setVerNuevoCuestionario] = useState(false);
    const [verNuevoCuestionarioIA, setVerNuevoCuestionarioIA] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        buscaCuestionarios();            
    }, []);

    const buscaCuestionarios= async () => {
        const response = await axios.get(`${URL_CUESTIONARIO}?user_id=${loggeduserId}&curso_id=${idMC}&rol=${rol}`);
            //console.log("datadd:"+ JSON.stringify(response.data));
             if(response.data.success){
                if(rol==6 ||rol==5){ //si es docente o auxiliar
                    
                    setFormularios(response.data.data);
                }
                setFormularios(response.data.data);
               // console.log("data:"+ JSON.stringify(response.data));
            }else{
                setFormularios([]);
                //console.log('sin cuestionarios');
            }
    } 

    const buscaCuestionario=(formId)=>{
        const fetchForm = async () => {
            const response = await axios.get(`${URL_CUESTIONARIO}?form_id=${formId}`);
            //console.log(JSON.stringify(response.data.data));
            if(!response.data.error){   
                setCuestionario(response.data.data);
                //console.log("data:"+ JSON.stringify(res.data));
                setVerNuevoCuestionario(true)
            }else{
                setCuestionario([{"id":0,"titulo":"","descripcion":"","preguntas":{ pregunta_texto: '', pregunta_tipo: 'text', opciones: [''], correctas: [] }}]);
            }
            //setFormulario(response.data);
            //setRespuestas(response.data.preguntas.map(() => ''));
        };
        fetchForm();
    }
    const eliminarCuestionario= async (formId) =>{
        if(window.confirm('¿Está seguro de eliminar el cuestionario?')){
            const response = await axios.delete(URL_CUESTIONARIO, { data: { modo: 'eliminarCuestionario', idCuestionario: formId } });
            console.log('data eliminar: ', response.data);
             if(response.data.success){
                alert('Cuestionario eliminado');    
                buscaCuestionarios();
            }else{
                alert('Error al eliminar cuestionario');
            }
        }
    };

    return (    
        <div>
        {(!verNuevoCuestionario && !verNuevoCuestionarioIA) ?<>
            <h3>cuestionarios del curso</h3>
            <div className="row">
                {(rol==6 || rol==5) &&
                <div className="col-2 col-sm-1">
                    <div className="card p-1">
                        <button type="button" className="btn btn-sm btn-dark my-1" onClick={()=>{setVerNuevoCuestionario(true);setVerNuevoCuestionarioIA(false)}}><i className="fa-regular fa-square-plus" ></i></button>
                        {rol==1 && <button type="button" className="btn btn-sm btn-dark my-1" onClick={()=>{setVerNuevoCuestionario(false);setVerNuevoCuestionarioIA(true)}}><i className="fa-regular fa-square-plus"></i> IA</button>  }              
                    </div>
                </div>
                }
                
                <div className="col-10 col-sm-11 d-flex flex-row">
                    {formularios.length!=0 && formularios.map((c, index)=>(
                    <div key={index} className="card me-2 my-2" style={{width:'18rem'}}>
                        <div className="card-header">
                        {c.cantidad_respuestas==0 ? <b>No hay respuestas</b>:<b>Se respondio {c.cantidad_respuestas} {c.cantidad_respuesta > 1?'veces':'vez'}</b>} 
                        </div>
                        <img src="https://img.freepik.com/vector-gratis/ilustracion-lista-verificacion-moderna_79603-146.jpg?w=740&t=st=1721683227~exp=1721683827~hmac=cb5059bcefbb41c295570572d351240edf8952be4d70ea94cc375923a901b109" className="card-img-top" alt="..." />
                        <div className="card-body">
                            <h5 className="card-title">{c.titulo}</h5>
                            
                            <p className="small text-secondary">{c.creado_el}</p>
                            <div className="d-flex justify-content-center">
                                <button  type='button' className="btn btn-outline-success btn-sm me-1" onClick={()=>navigate(`/cuestionario/${c.id}`)}><i className="fa-solid fa-eye"></i></button>
                                {(rol==6 || rol==5) && (c.creado_por==loggeduserId) && 
                                <>
                                    <button type="button" className="btn btn-outline-warning btn-sm me-1" onClick={()=>buscaCuestionario(c.id)}><i className="fa-regular fa-pen-to-square"></i></button>
                                    <button  type='button' className="btn btn-outline-danger btn-sm me-1" onClick={()=>eliminarCuestionario(c.id)}><i className="fa-regular fa-trash-can"></i></button>
                                </>
                                }
                            </div>
                        </div>
                        <div className="card-footer">
                           {c.porcentaje_promedio_correctas!=null?`Promedio respuesta:${c.porcentaje_promedio_correctas} % `:''} 
                        </div>
                    </div>
                    ))
                    }
                </div>
            </div>
            
            
            </>
            : 
                <>
                    {verNuevoCuestionario && <CrearCuestionario cuestionario={cuestionario} setVerNuevoCuestionario={setVerNuevoCuestionario} buscaCuestionarios={buscaCuestionarios} idMC={idMC}/>}
                    {verNuevoCuestionarioIA && <CrearCuestionarioIA setVerNuevoCuestionarioIA={setVerNuevoCuestionarioIA} buscaCuestionario={buscaCuestionario} idMC={idMC} />}
                </>
        }
        </div>
     );
}

export default Cuestionarios;