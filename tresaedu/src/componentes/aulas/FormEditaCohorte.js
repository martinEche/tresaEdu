import './css/Cursos.css';
import { useState, useEffect } from "react";
import { show_alerta } from '../../funciones.js';
import axios from 'axios';
import CONFIG from '../../config';

const URL  = `${CONFIG.API_URL}/operarCursos.php`;

function FormEditaCohorte({enviarEditaFormData, id_formacion, año, setVerFormularioEditaCohorte}) {
    const fechaActual = new Date();
 
    const [espacios, setEspacios] = useState([]);
    
     
    const loggeduserId =localStorage.getItem('loggedUserId');

 
 
 
    const [grupos, setGrupos] = useState(2);
   
    const [id_usuario, setId_usuario] = useState(loggeduserId);
 
    const [datosCohorte, setDatosCohorte ] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaCierre, setFechaCierre] = useState('');

    const [instancias, setInstancias] = useState([]);
    const [nombreInstancia, setNombreInstancia] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [tipoCalificacion, setTipoCalificacion] = useState('');

    useEffect(() => {
        //obtener datos de la cohorte
        const dato={
            'modo':'buscarDatosEditableCohorte',
            'id_formacion':id_formacion,
            'año':año
        };
        axios.post(URL, dato)
        .then(res =>{
            //console.log(res.data)
            if(!res.data.error){ 
              
               setInstancias();
               setDatosCohorte();
            }else{
              
            }
        })
        .catch(err =>{
            console.log(err)
        }) 
        
    }, []);

//metodo enviar formulario
    const handleSubmint=(e)=> {
        e.preventDefault();
       
        if(grupos<=0 ){
            show_alerta('El valor para grupos no es valido ','error');
            return;
        }
        if(instancias.length==0){
            show_alerta('Se debe crear al menos una instancia de calificación','error');
            return;    
        }
        const formData = new FormData();
        formData.append('nuevo', 'editaCohorte');
        formData.append('grupos', grupos);
        formData.append('id_usuario', id_usuario);
        formData.append('fechaInicio', fechaInicio);
        formData.append('fechaCierre', fechaCierre);
        formData.append('instancias', JSON.stringify(instancias));
        
        enviarEditaFormData(formData);
        handleReset();
      };

//metodo resetear formulario
    const handleReset =(e) => {
        let formulario = document.getElementById('form');
        formulario.reset();
        
        setGrupos(2);
        setId_usuario(loggeduserId);
        setFechaInicio('');
        setFechaCierre('');
        setInstancias([]);
    };

//metodo agregar instancia
    const agregarInstancia = () => {
        // Crear un nuevo objeto con los valores
        const nuevaInstancia = {
        nombre: nombreInstancia,
        fechaDesde: fechaDesde,
        fechaHasta: fechaHasta,
        tipoCalificacion: tipoCalificacion,
        };
        // Copiar el arreglo existente de instancias
        const nuevasInstancias = [...instancias];
        // Agregar el nuevo objeto al arreglo
        nuevasInstancias.push(nuevaInstancia);
        // Actualizar el estado con el nuevo arreglo
        setInstancias(nuevasInstancias);
        // Limpiar los valores de los inputs
        setNombreInstancia('');
        setFechaDesde('');
        setFechaHasta('');
        setTipoCalificacion('');
    }; 
  
//metodo eliminar instancia   
    const eliminarInstancia = (index) => {
        // Copiar el arreglo existente de instancias
        const nuevasInstancias = [...instancias];
        // Eliminar la instancia correspondiente
        nuevasInstancias.splice(index, 1);
        // Actualizar el estado con el nuevo arreglo
        setInstancias(nuevasInstancias);
    };

   return ( 
    <div className='contenedor-form-cohorte'>
        <div className='form-cohorte'>
            <h3 className='my-3'>Información de la cohorte</h3>
            <form onSubmit={handleSubmint} id='form'>
                <input type="hidden" name='id_usuario' value={id_usuario} />
                                
                <div className="form-floating mb-3">
                    <input type="datetime-local" className="form-control" 
                    name='fechaInicio' id="fechaInicio" 
                    defaultValue={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                    <label htmlFor="fechaInicio">fecha inicio de cohorte</label>
                </div>

                <div className="form-floating mb-3">
                    <input type="datetime-local" className="form-control" 
                    name='fechaCierre' id="fechaCierre" 
                    defaultValue={fechaCierre} onChange={(e) => setFechaCierre(e.target.value)} />
                    <label htmlFor="fechaCierre">Fecha cierre de cohorte</label>
                </div>

                <div><hr/></div>
                <h3 className='mt-3'>Grupos</h3>
                <div className="form-floating">
                    <input type="number" className="form-control" 
                    name='grupos' id="grupos" placeholder="grupos"  
                    defaultValue={grupos} onChange={(e) => setGrupos(e.target.value)}/>
                    <label htmlFor="grupos">Grupos</label>
                </div>
                <div className="small text-secondary mb-3">Luego puede agregarmas grupos y editar la denominacion</div>


                <div><hr/></div>

                <h3 className='mt-3'>Calificaciones</h3>
                <h5 className='mb-3 fw-light text-body-secondary'>Crear instancias</h5>
                <div className='contenedor-instancias'>
                    {!(instancias.length==0)&&
                    <table className='table table-hover table-sm'>
                         <thead>
                            <tr>
                                <th className='small'>instancia</th>
                                <th className='small'>fecha apertura</th>
                                <th className='small'>fecha cierre</th>
                                <th className='small'>Calificación</th>
                                <th></th>
                            </tr>
                         </thead>
                         <tbody>
                        {instancias.map((instancia, index) => (
                        <tr key={index}>
                            <td className='small'>{instancia.nombre}</td>
                            <td className='small'>{instancia.fechaDesde}</td>
                            <td className='small'>{instancia.fechaHasta}</td>
                            <td className='small'>{instancia.tipoCalificacion}</td>
                            <td><button type='button' className='btn btn-sm btn-light' onClick={() => eliminarInstancia(index)}> X </button></td>
                        </tr>
                        ))}
                        </tbody>
                    </table>
                    }
                    <div className="row g-1">
                        <div className ="col-md-3 ">
                            <div className="form-floating">
                                <input type="text" 
                                className="form-control form-control-sm" 
                                name='instancia' id="instancia" 
                                value={nombreInstancia}
                                onChange={(e) => setNombreInstancia(e.target.value)}/>
                                <label htmlFor="instancia">Instancia</label>
                            </div>
                        </div>
                        <div className ="col-md-3 small">
                            <div className="form-floating">
                                <input type="datetime-local" 
                                className="form-control form-control-sm" 
                                name='fdesde' id="fdesde" 
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                />
                                <label htmlFor="fdesde">fecha desde</label>
                            </div>
                        </div>
                        <div className ="col-md-3 small">
                            <div className="form-floating">
                                <input type="datetime-local" className="form-control form-control-sm" 
                                name='fhasta' id="fhasta" 
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}/>
                                <label htmlFor="fhasta">Fecha hasta</label>
                            </div>
                        </div>
                        <div className ="col-md-3 small">
                            <div className="form-floating">
                                <select className="form-select" id="tipoCalificacion"
                                 name='tipoCalificacion'
                                 value={tipoCalificacion}
                                 onChange={(e) => setTipoCalificacion(e.target.value)}
                                >
                                    <option value="numero">Numerica</option>
                                    <option value="Valorativa">Valorativa</option>
                                    <option value="Logro">Logro</option>
                                    <option value="Particiapcion">Particiapcion</option>
                                </select>
                                <label htmlFor="tipoCalificacion">Tipo calificación</label>
                            </div> 
                        </div>
                    </div>
                    <div className='mt-2 mb-1 text-center'>
                        <button type='button' className='btn btn btn-sm btn-light' onClick={agregarInstancia}>agregar instancia</button>
                    </div>
                </div>

                <div><hr/></div>
                <div className='m-3 text-center'>
                    <button type="submit" className="btn btn-sm btn-primary m-1">Generar Cohorte</button>
                    <button type="reset" className="btn btn-sm btn-warning m-1">Limpiar datos</button>
                    <button type="button" className="btn btn-sm btn-secondary m-1" onClick={()=>setVerFormularioEditaCohorte(false)}>Cancelar</button>
                </div>
            </form>
        </div>
    </div>
    );
}

export default FormEditaCohorte;