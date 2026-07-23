import './css/Aulas.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { show_alerta } from '../../funciones.js';
import CONFIG from '../../config';

const URL  = `${CONFIG.API_URL}/operarCursos.php`;

function CursoGrupos({id,idGrupo, setIdGrupo, docentes, setDocenteSeleccionado, docenteSeleccionado}) {
    const [grupos, setGrupos] = useState([]);
    const [buscar, setBuscar] = useState('');
   

    let filtroDocente=[];
 

    useEffect( ()=>{
        buscaGrupos();
    },[])

    function buscaGrupos(){
        // console.log(id);
        axios.post(URL, {'id' :  id, 'modo': 'buscarGrupoCurso'})
        .then(res =>{
            if(!res.data.error){ 
                setGrupos(res.data);
            }else{
                setGrupos([]);
            }
        })
        .catch(err=>{
            console.log(err);
        })
    }

    function handleSubmint(e) {
        e.preventDefault();
       //console.log("enviar: id_grupo:"+idGrupo+" modo: asignarDocente, idDocente:"+docenteSeleccionado);
       
       axios.post(URL,{'id_grupo':idGrupo, 'modo': 'asignarDocente', 'idDocente': docenteSeleccionado})
        .then(res =>{
            var tipo = res.data[0];
            var msj = res.data[1];
            buscaGrupos();
            show_alerta(msj,tipo);
        })
        .catch(err=>{
            show_alerta('Error en la accionooooo ','error');
            console.log('error '+err);
        })
      }
    
    

    //filtro
    if(!buscar){
        filtroDocente= docentes;
    }else{
        filtroDocente= docentes.filter((dato)=>{
            if( (dato.nombre.toLowerCase().includes(buscar.toLocaleLowerCase())) || 
                (dato.apellido.toLowerCase().includes(buscar.toLocaleLowerCase())) ||
                (dato.documento.toString().toLowerCase().includes(buscar.toLocaleLowerCase())) ){
                return true;
            }
            return false;
        });
    }

    return ( 
        <div>
           { grupos.length==0 ? 'Sin grupos':
            grupos.map(g=>
                <div key={g.id}>
                    <span className='small'>Grupo {g.denominacion}({g.id}): 
                        <i>{g.id_usuario==null ? 
                                <button type='button' className='btn btn-sm btn-outline-info m-1' onClick={()=>setIdGrupo(g.id)} data-bs-toggle="modal" data-bs-target={`#modalAgregarDocente_${id}`} >agregar docente ({g.id})</button> 
                                :<span> {g.apellido} {g.nombre}</span>}
                        </i>
                    </span>
                </div>
            )}



            <div className="modal fade" id={`modalAgregarDocente_${id}`}  aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5" id="exampleModalLabel">
                                Docentes
                                <div className="input-group ">
                                    <span className="input-group-text" id="basic-addon1"><i className="fa-solid fa-magnifying-glass"></i></span>
                                    <input type="text" className="form-control" id='buscar' name='buscar' defaultValue={buscar} onChange={(e)=>setBuscar(e.target.value)} placeholder='buscar...' aria-label='buscar' aria-describedby='basic-addon1' />
                                </div>
                            </h1>
                            
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            
                        </div>
                        <div className="modal-body">
                            <form id="form" onSubmit={handleSubmint}>
                                {idGrupo}
                               
                                {filtroDocente.map((d)=>(
                                    <div key={d.id}>
                                        <input className="form-check-input" type="radio" name='docente' onClick={()=>setDocenteSeleccionado(d.id)} id={`chek_${d.id}_${id}`} value={d.id}/>
                                        <label className="form-check-label mx-1 small" htmlFor={`chek_${d.id}_${id}`}> {d.apellido}, {d.nombre} ({d.documento})</label> 
                                    </div>
                                ))}
                            </form>                          
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" name='botonCerrar' id="botonCerrar" data-bs-dismiss="modal">Close</button>
                            <button type="submit" form='form' className='btn btn-success' data-bs-dismiss="modal">Aceptar seleccionado</button>
                        </div>
                    </div>
                </div>
            </div>



        </div>
     );
}

export default CursoGrupos;