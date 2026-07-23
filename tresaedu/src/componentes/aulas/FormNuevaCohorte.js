import './css/Cursos.css';
import { useState, useEffect } from "react";
import { show_alerta } from '../../funciones.js';
import axios from 'axios';
import CONFIG from '../../config';
import { set } from 'firebase/database';

const URL  = `${CONFIG.API_URL}/operarFormacion.php`;
const URL_Espacios  = `${CONFIG.API_URL}/operarEspacios.php`;
const URL_INSTANCIAS= `${CONFIG.API_URL}/operarInstancias.php`;

function FormNuevaCohorte({enviarFormData, setVerFormularioCohorte}) {
    const fechaActual = new Date();
    const [formaciones, setFormaciones] = useState([]);
    const [espacios, setEspacios] = useState([]);
    
    let filtroEspacios=[];    
    const loggeduserId =localStorage.getItem('loggedUserId');

    const [idFormacion, setIdFormacion] = useState('');
    const [id, setId] = useState("");
    const [cohorte, setCohorte] = useState(fechaActual.getFullYear());
    const [grupos, setGrupos] = useState(2);
    const [seccion, setSeccion] = useState('letras');
    const [orden, setOrden] = useState(-10);    
    const [id_usuario, setId_usuario] = useState(loggeduserId);
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaCierre, setFechaCierre] = useState('');
    const [fechaInicioInscripcion, setFechaInicioInscripcion] = useState('');
    const [fechaCierreInscripcion, setFechaCierreInscripcion] = useState('');
    const [instancias, setInstancias] = useState([]);

    const [nombreInstancia, setNombreInstancia] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [tipoCalificacion, setTipoCalificacion] = useState('');
    const [modoEditar, setModoEditar] = useState(false);
    const [instanciaIndex, setInstanciaIndex] = useState(null);

    useEffect(() => {
        //obtener por API lasformaciones existentes
        axios.get(URL)
        .then(res =>{
            console.log('formacion:',res.data);
            if(!res.data.error){ 
               setFormaciones(res.data);
            }else{
               setFormaciones([]);
            }
        })
        .catch(err =>{
            console.log(err)
        }) 
        //obtener por API los espacios existentes
        axios.get(URL_Espacios)
        .then(res =>{
            if(!res.data.error){ 
               setEspacios(res.data);
            }else{
                setEspacios([]);
            }
        })
        .catch(err =>{
            console.log(err)
        }) 
    }, []);

    //cambiar las instancias si cambia la cohorte o la formacion
    useEffect(() => {
        if(idFormacion){
            obtenerInstanciasPorDefecto(idFormacion);
        }
    }, [cohorte]);
    
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
        const conteoFinal = instancias.filter(i => i.nombre && i.nombre.trim().toLowerCase() === 'final').length;
        if (conteoFinal === 0) {
            show_alerta('Debe incluir una instancia de calificación con la denominación "final"', 'error');
            return;
        }
        if (conteoFinal > 1) {
            show_alerta('No se puede repetir la denominación "final" en más de una instancia', 'error');
            return;
        }
        const formData = new FormData();
        formData.append('nuevo', 'cohorte');
        formData.append('id', id);
        formData.append('cohorte', cohorte);
        formData.append('grupos', grupos);
        formData.append('seccion', seccion);
        formData.append('idFormacion', idFormacion);
        formData.append('orden', orden);
        formData.append('id_usuario', id_usuario);
        formData.append('fechaInicio', fechaInicio);
        formData.append('fechaCierre', fechaCierre);
        formData.append('fechaInicioInscripcion', fechaInicioInscripcion);
        formData.append('fechaCierreInscripcion', fechaCierreInscripcion);
        formData.append('instancias', JSON.stringify(instancias));
        
        enviarFormData(formData);
        handleReset();
      };

//metodo resetear formulario
    const handleReset =(e) => {
        let formulario = document.getElementById('form');
        formulario.reset();
        setId("");
        setCohorte(fechaActual.getFullYear());
        setGrupos(2);
        setIdFormacion('');
        setOrden(-10);
        setId_usuario(loggeduserId);
        setFechaInicio('');
        setFechaCierre('');
        setFechaInicioInscripcion('');
        setFechaCierreInscripcion('');
        setInstancias([]);
    };

//metodo de filtrado
    if(idFormacion){
        //console.log("dd:"+buscar);
        filtroEspacios= espacios.filter((dato)=> {
            if(dato.id_formacion ==(idFormacion)){
                return true;
            }
            return false;
        })
    }

//metodo agregar instancia
    const agregarInstancia = () => {
        if (!nombreInstancia || !nombreInstancia.trim()) {
            show_alerta('Ingrese el nombre de la instancia', 'error');
            return;
        }
        const esFinal = nombreInstancia.trim().toLowerCase() === 'final';
        if (esFinal && instancias.some(i => i.nombre && i.nombre.trim().toLowerCase() === 'final')) {
            show_alerta('Ya existe una instancia con la denominación "final"', 'error');
            return;
        }
        // Crear un nuevo objeto con los valores
        const nuevaInstancia = {
        nombre: nombreInstancia.trim(),
        fechaDesde: fechaDesde,
        fechaHasta: fechaHasta,
        tipoCalificacion: tipoCalificacion,
        };
        console.log(JSON.stringify(nuevaInstancia));
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
    
    //metodo editar instancia
    const editarInstancia = (index) => {
        setModoEditar(true);
        const instanciaAEditar = instancias[index];
        setNombreInstancia(instanciaAEditar.nombre);
        setFechaDesde(instanciaAEditar.fechaDesde);
        setFechaHasta(instanciaAEditar.fechaHasta);
        setTipoCalificacion(instanciaAEditar.tipoCalificacion);
        setInstanciaIndex(index);
    };
    //metodo cancelar edicion
    const cancelarEdicion = () => {
        setModoEditar(false);
        setNombreInstancia('');
        setFechaDesde('');
        setFechaHasta('');
        setTipoCalificacion('');
    };

    //metodo para actualizar la instancia editada
    const actualizarInstancia = () => {
        if (!nombreInstancia || !nombreInstancia.trim()) {
            show_alerta('Ingrese el nombre de la instancia', 'error');
            return;
        }
        const esFinal = nombreInstancia.trim().toLowerCase() === 'final';
        if (esFinal && instancias.some((i, index) => index !== instanciaIndex && i.nombre && i.nombre.trim().toLowerCase() === 'final')) {
            show_alerta('Ya existe una instancia con la denominación "final"', 'error');
            return;
        }
        // Copiar el arreglo existente de instancias
        const nuevasInstancias = [...instancias];
        // Actualizar la instancia correspondiente
        nuevasInstancias.splice(instanciaIndex, 1, {
            nombre: nombreInstancia.trim(),
            fechaDesde: fechaDesde,
            fechaHasta: fechaHasta,
            tipoCalificacion: tipoCalificacion,
        });
        // Actualizar el estado con el nuevo arreglo
        setInstancias(nuevasInstancias);
        // Limpiar los valores de los inputs
        setNombreInstancia('');
        setFechaDesde('');
        setFechaHasta('');
        setTipoCalificacion('');
        setModoEditar(false);
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

    const mostrarNombre = (ordenN)=>{
        let nombre="";
        switch(ordenN){
          case "S2":
            nombre='Sala de 2';
            break            
          case "S3":
            nombre='Sala de 3';
          break
          case "S4":
            nombre='Sala de 4';
          break
          case "S5":
            nombre='Sala de 5';
          break
          case "In":
            nombre='Espacio Institucional';
          break
          default:
            nombre=ordenN+'°';
        }
        return nombre
      }
    //funcion complementaria para cambiar el año de una fecha
    const cambiarAnio = (fechaStr, nuevoAnio) => {
        if (!fechaStr) return null;
        const fecha = new Date(fechaStr);
        fecha.setFullYear(nuevoAnio);
        return fecha.toISOString().slice(0, 19).replace('T', ' ');
    };
    const obtenerInstanciasPorDefecto = (idFormacion) => {
        // llamar a la api para obtener las instancias por defecto
        axios.get(`${URL_INSTANCIAS}?idFormacion=${idFormacion}`)
        .then(res =>{
            if(!res.data.error){
                //ajustar las fechas al año de la cohorte seleccionada
               
                const instanciasAjustadas = res.data.instancias.map(inst => ({
                    ...inst,
                    fechaDesde: cambiarAnio(inst.fechaDesde, cohorte),
                    fechaHasta: cambiarAnio(inst.fechaHasta, cohorte),
                }));

                const tieneFinal = instanciasAjustadas.some(inst => inst.nombre && inst.nombre.trim().toLowerCase() === 'final');
                if (!tieneFinal) {
                    instanciasAjustadas.push({
                        nombre: 'final',
                        fechaDesde: fechaInicio || `${cohorte}-03-01T00:00`,
                        fechaHasta: fechaCierre || `${Number(cohorte) + 1}-02-28T23:59`,
                        tipoCalificacion: 'Numerica'
                    });
                }

                setInstancias(instanciasAjustadas);
            }else{
                setInstancias([{
                    nombre: 'final',
                    fechaDesde: fechaInicio || `${cohorte}-03-01T00:00`,
                    fechaHasta: fechaCierre || `${Number(cohorte) + 1}-02-28T23:59`,
                    tipoCalificacion: 'Numerica'
                }]);
            }   
        })
        .catch(err =>{
            console.log(err)
        })
    };

    const seleccionarFormacion = (e) => {
        setIdFormacion(e.target.value);
        obtenerInstanciasPorDefecto(e.target.value);
    }
    //prepara fechas a partir del año de la cohorte colocancoo inicio de cohorte al primer lunes de marzo y finalizando cohorte el ultimo dia de febrero del año siguiente
    const prepararFechasCohorte = (anio) => {

        anio = Number(anio); // viene string hay que ponerlo tipo numero

        // ===== inicio cohorte → primer lunes de marzo =====
        const primerDiaMarzo = new Date(anio, 2, 1);
        const diaSemana = primerDiaMarzo.getDay();
        const primerLunesMarzo =
            diaSemana === 1
                ? primerDiaMarzo
                : new Date(anio, 2, 1 + ((8 - diaSemana) % 7));

        // ===== cierre cohorte → último día de febrero del año siguiente =====
        const ultimoDiaFebrero = new Date(anio + 1, 2, 0, 23, 59);
        const pad = n => n.toString().padStart(2, '0');
        const formatear = (fecha) =>
            fecha.getFullYear() + "-" +
            pad(fecha.getMonth() + 1) + "-" +
            pad(fecha.getDate()) + "T" +
            pad(fecha.getHours()) + ":" +
            pad(fecha.getMinutes());

        setFechaInicio(formatear(primerLunesMarzo));
        setFechaCierre(formatear(ultimoDiaFebrero));

        // inscripción = mismas fechas
        setFechaInicioInscripcion(formatear(primerLunesMarzo));
        setFechaCierreInscripcion(formatear(ultimoDiaFebrero));
    };

    // Actualizar fechas cuando cambia el año de la cohorte
    useEffect(() => {
        prepararFechasCohorte(cohorte);
    }, [cohorte]);

   return ( 
    <div className='contenedor-form-cohorte mb-4'>
        <div className='form-cohorte'>
            <h3 className='my-3'>Información de la cohorte</h3>
            <form onSubmit={handleSubmint} id='form'>
                <input type="hidden" name='id_usuario' value={id_usuario} />

                <div className="form-floating mb-3">
                    <select className="form-select" aria-label="Floating label select example"
                    id="floatingSelect" name='formacion' onChange={(e)=>seleccionarFormacion(e)} >
                        <option>seleccionar formación</option>
                        {formaciones.map((f)=>(
                            <option key={f.id} value={f.id}>Formación {f.tipo_formacion} ({f.nombre_formacion})</option>

                        ))}
                    </select>
                    <label htmlFor="floatingSelect small">Formación</label>
                </div>

                <div className="form-floating mb-3">
                    <select className="form-select" aria-label="Floating label select example"
                    id="orden" name='orden' onChange={(e)=>setOrden(e.target.value)} >
                        <option value={-10}>Todos los cursos para Estudiantes</option>
                        {filtroEspacios.map((e)=>(
                            <option key={e.id} value={e.id}>{mostrarNombre(e.orden)} - {e.dictado}</option>
                        ))}
                    </select>
                    <label htmlFor="orden small">Orden</label>
                </div>

                <div className="form-floating mb-3">
                    <input type="number" className="form-control" 
                    name='cohorte' id="cohorte" placeholder="año"
                    defaultValue={cohorte} onChange={(e) => setCohorte(e.target.value)} />
                    <label htmlFor="cohorte">Cohorte</label>
                </div>
                                
                <div className="form-floating mb-3">
                    <input type="datetime-local" className="form-control" 
                    name='fechaInicio' id="fechaInicio" 
                    defaultValue={fechaInicio} onChange={(e) => (setFechaInicio(e.target.value), setFechaInicioInscripcion(e.target.value))} />
                    <label htmlFor="fechaInicio">fecha inicio de cohorte</label>
                </div>

                <div className="form-floating mb-3">
                    <input type="datetime-local" className="form-control" 
                    name='fechaCierre' id="fechaCierre" 
                    defaultValue={fechaCierre} onChange={(e) => (setFechaCierre(e.target.value), setFechaCierreInscripcion(e.target.value))} />
                    <label htmlFor="fechaCierre">Fecha cierre de cohorte</label>
                </div>

                <div><hr/></div>
                <h3 className='mt-3'>Grupos/Divisiones</h3>
                <div className="form-floating">
                    <input type="number" className="form-control" 
                    name='grupos' id="grupos" placeholder="grupos"  
                    defaultValue={grupos} onChange={(e) => setGrupos(e.target.value)}/>
                    <label htmlFor="grupos">Grupos</label>
                </div>
                <div>
                    <h4>Denominación de cada grupo</h4>

                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="tipoSeccion"
                            id="radioLetras"
                            value="letras"
                            checked={seccion === 'letras'}
                            onChange={() => setSeccion('letras')}
                        />
                        <label className="form-check-label small" htmlFor="radioLetras">
                            Letras: A, B, C, ...
                        </label>
                    </div>

                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="tipoSeccion"
                            id="radioNumeros"
                            value="numeros"
                            checked={seccion === 'numeros'}
                            onChange={() => setSeccion('numeros')}
                        />
                        <label className="form-check-label small" htmlFor="radioNumeros">
                            Números: 1, 2, 3, ...
                        </label>
                    </div>
                </div>

                <div className="alert alert-info small text-secondary mb-3">Luego puede agregar más grupos y editar la denominación</div>

                <h5 className='mb-3 fw-light text-body-secondary'>Configurar fechas de inscripciones</h5>
                <div className="form-floating mb-3">
                    <input type="datetime-local" className="form-control" 
                    name='fechaInicioInscripcion' id="fechaInicioInscripcion" 
                    defaultValue={fechaInicioInscripcion} onChange={(e) => setFechaInicioInscripcion(e.target.value)} 
                    value={fechaInicioInscripcion}/>
                    <label htmlFor="fechaInicioInscripcion">fecha apertura de inscripciones</label>
                </div>

                <div className="form-floating mb-3">
                    <input type="datetime-local" className="form-control" 
                    name='fechaCierreInscripcion' id="fechaCierreInscripcion" 
                    defaultValue={fechaCierreInscripcion} onChange={(e) => setFechaCierreInscripcion(e.target.value)}
                    value={fechaCierreInscripcion} />
                    <label htmlFor="fechaCierreInscripcion">Fecha finalización de inscripciones</label>
                </div>

                <div><hr/></div>
                
                {/* Instancias de calificación */}
                <h3 className='mt-3'>Calificaciones</h3>
                <div className="alert alert-warning small py-2 mb-3">
                    <i className="fa-solid fa-triangle-exclamation me-2"></i>
                    Es obligatorio incluir <strong>al menos una instancia con la denominación "final"</strong> y no se permite repetir dicha denominación.
                </div>
                <h5 className='mb-3 fw-light text-body-secondary'>{modoEditar ? "Editando instancia" : "Crear instancias"}</h5>
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
                            <td>
                                {!modoEditar && <>
                                <button type='button' className='btn btn-sm btn-light mx-1' onClick={() => editarInstancia(index)}> <i className='fa-solid fa-edit'></i> </button>
                                <button type='button' className='btn btn-sm btn-light' onClick={() => eliminarInstancia(index)}> X </button>
                                </> }
                            </td>
                        </tr>
                        ))}
                        </tbody>
                    </table>
                    }
                    <div className={!modoEditar ? 'row g-1 ':'row g-1 border border-success rounded p-1'}>
                        {modoEditar && <div>Editando instancia</div>}
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
                                    <option value="">Seleccionar tipo de calificación</option>
                                    <option value="Numerica">Numerica</option>
                                    <option value="Valorativa">Valorativa</option>
                                    <option value="Logro">Logro</option>
                                    <option value="Participacion">Participación</option>
                                </select>
                                <label htmlFor="tipoCalificacion">Tipo calificación</label>
                            </div> 
                        </div>
                    
                        <div className='mt-2 mb-1 text-center'>
                            {!modoEditar ?
                                <button type='button' className='btn btn btn-sm btn-light' onClick={agregarInstancia}>Agregar instancia</button>
                            :
                            <>
                                <button type='button' className='btn btn btn-sm btn-success me-1' onClick={actualizarInstancia}>Actualizar instancia</button>
                                <button type='button' className='btn btn btn-sm btn-light' onClick={cancelarEdicion}>Cancelar edición</button>
                            </>
                            }
                        </div>
                    </div>
                </div>

                <div><hr/></div>
                <div className='m-3 text-center'>
                    <button type="submit" className="btn btn-sm btn-primary m-1">Generar Cohorte</button>
                    <button type="reset" className="btn btn-sm btn-warning m-1">Limpiar datos</button>
                    <button type="button" className="btn btn-sm btn-secondary m-1" onClick={()=>setVerFormularioCohorte(false)}>Cancelar</button>
                </div>
            </form>
        </div>
    </div>
    );
}

export default FormNuevaCohorte;