import { useState } from "react";
import { show_alerta } from '../../funciones.js';

function PlanificacionForm({ 
          planificacion, 
          setVerAgregarPlanificacion,
          verAgregarPlanificacion,
          agregarPlanificacion, 
          datoBase, 
          setPlanificacion, 
          setVerAgregarPlanificacionArchivo, 
          verAgregarPlanificacionArchivo }) {
  let cap=[];
  let cont=[];

  try {
    cap= JSON.parse(planificacion.capacidades || "[]"); // Asegura que no sea null/undefined
    cont=JSON.parse(planificacion.contenidos_generales|| "[]");
  } catch (error) {
    console.error("Error parsing:", error);
  }

  const [capacidades, setCapacidades] = useState(cap);
  const [capacidad, setCapacidad] = useState('');
  const [contenidos, setContenidos] = useState(cont);
  const [itemContenido, setItemContenido] = useState('');

  const [id, setId] = useState(planificacion.id===null?'':planificacion.id);
  const [id_curso_grupo, setId_curso_grupo] = useState(planificacion.id_curso_grupo);
  const [id_curso_equipo_docente, setId_curso_equipo_docente] = useState(planificacion.id_curso_equipo_docente);
  const [fecha, setFecha] = useState(planificacion.fecha);
  const [tipo, setTipo] = useState(planificacion.tipo);
  const [introduccion, setIntroduccion] = useState(planificacion.introduccion);
  const [propositos, setPropositos] = useState(planificacion.propositos);
  const [estrategia_metodologica, setEstrategia_metodologica] = useState(planificacion.estrategia_metodologica);
  const [evaluacion, setEvaluacion] = useState(planificacion.evaluacion);
  const [entorno, setEntorno] = useState(planificacion.entorno);
  const [recursos, setRecursos] = useState(planificacion.recursos);
  const [bibliografia, setBibliografia] = useState(planificacion.bibliografia);
  const [creado_por, setCreado_por] = useState(planificacion.creado_por);
  const [titulo, setTitulo] = useState(planificacion.titulo);
  const [archivo, setArchivo] = useState(planificacion.archivo);


  //funcion para limpiar datos
  const limpiarTexto = (texto) => {
    return texto
      .replace(/<[^>]*>/g, '')        // elimina HTML
      .replace(/&nbsp;/g, ' ')        // espacios HTML
      .replace(/\u00A0/g, ' ')        // espacio no separable (muy común de Word)
      .replace(/\r?\n|\r/g, ' ')      // saltos de línea a espacio
      .replace(/\s+/g, ' ')           // múltiples espacios a uno solo
      .trim();
  };
  
  // Método para agregar capacidad
  const agregarCapacidad = () => {
    const textoPlano = limpiarTexto(capacidad);
    if (textoPlano !== "") {
      setCapacidades([...capacidades, textoPlano]);
    }
    setCapacidad('');
  };

  // Método para agregar contenido
  const agregarContenido = () => {
    const textoPlano = limpiarTexto(itemContenido);
    if (textoPlano !== "") {
      setContenidos([...contenidos, textoPlano]);
    }
    setItemContenido('');
  };

  // Método para quitar un elemento
  const quitarElemento = (index, tipoLista) => {
    if (tipoLista === 'capacidades') {
      const nuevaLista = [...capacidades];
      nuevaLista.splice(index, 1);
      setCapacidades(nuevaLista);
    } else if (tipoLista === 'contenidos') {
      const nuevaLista = [...contenidos];
      nuevaLista.splice(index, 1);
      setContenidos(nuevaLista);
    }
  };

//metodo enviar formulario
  const handleSubmint=(e)=> {
    e.preventDefault();
    if(setVerAgregarPlanificacion && !verAgregarPlanificacionArchivo){
      //si se presiono agregar planificacion escrita, 
      // validar que haya al menos una capacidad y un contenido, 
      // sino mostrar alerta y no enviar el formulario 
      if(capacidades.length==0){
        show_alerta('Se debe colocar al menos una capacidad','error');
        return;    
      }
      if(contenidos.length==0){
        show_alerta('Se debe colocar al menos un contenido','error');
        return;    
      }
    }
    if(verAgregarPlanificacionArchivo && !setVerAgregarPlanificacion){
      //si se presiono agregar planificacion por archivo, 
      // validar que se haya seleccionado un archivo, 
      // sino mostrar alerta y no enviar el formulario 
      if(archivo==''){
        show_alerta('Se debe seleccionar un archivo','error');
        return;
      }
    }

    const formData = new FormData();
    formData.append('nuevo', 'planificacion');
    formData.append('id', id);
    formData.append('tipo', tipo);
    formData.append('id_curso_grupo', id_curso_grupo);
    formData.append('id_curso_equipo_docente', id_curso_equipo_docente);
    formData.append('fecha', fecha);
    formData.append('introduccion', introduccion);
    formData.append('propositos', propositos);
    formData.append('capacidades',JSON.stringify(capacidades));
    formData.append('contenidos', JSON.stringify(contenidos));
    formData.append('estrategia_metodologica', estrategia_metodologica);
    formData.append('evaluacion', evaluacion);
    formData.append('entorno', entorno);
    formData.append('recursos', recursos);
    formData.append('bibliografia', bibliografia);
    formData.append('creado_por', creado_por);
    formData.append('titulo', titulo);
    // enviar archivo solo si se cargo uno nuevo, sino enviar el mismo valor que ya tenia para que no lo borre
    if(archivo){
      formData.append('archivo', archivo);
    }else{
      formData.append('archivo', planificacion.archivo);
    }
    // Mostrar contenido del FormData
    //console.log("Contenido de FormData:");
    //formData.forEach((value, key) => {
    //  console.log(`${key}: ${value}`);
    //});

    agregarPlanificacion('POST',formData);
    handleReset();
  };

//metodo resetear formulario
  const handleReset =(e) => {
    let formulario = document.getElementById('form');
    formulario.reset();
   
    setId_curso_equipo_docente('');
    setFecha('');
    setIntroduccion('');
    setPropositos('');
    setCapacidades([]);
    setContenidos([]);
    setEstrategia_metodologica('');
    setEvaluacion('');
    setEntorno('');
    setRecursos('');
    setBibliografia('');
    setTitulo('');
    setArchivo('');
  };

  return (    
    <form onSubmit={handleSubmint} id='form'>
      <input type="hidden" 
        id="id" 
        name="id"
        value={id}
       />

      <input type="hidden" 
        id="id_curso_grupo" 
        name="id_curso_grupo"
        onChange={(e)=>setId_curso_equipo_docente(e.target.value)}
        value={id_curso_equipo_docente}/>
        
      <input type="hidden" 
        id="Fecha" 
        name="Fecha"
        onChange={(e)=>setFecha(e.target.value)}
        value={fecha}/>
      
      <input type="hidden" 
        id="creado_por" 
        name="creado_por"
        onChange={(e)=>setCreado_por(e.target.value)}
        value={creado_por}/>

      <div className="form-floating mb-2">
        <input className="form-control" 
        id="titulo"
        onChange={(e)=>setTitulo(e.target.value)}
        value={titulo}
        />
        <label htmlFor="titulo">Título <span className="text-secondary small">(ej. curso/sala - grupo)</span></label>
      </div>
    {verAgregarPlanificacion && !verAgregarPlanificacionArchivo &&
    <>
      <div className="form-floating mb-2">
        <select className="form-select" 
          id="tipo" 
          aria-label="Floating label select example"
          onChange={(e)=>setTipo(e.target.value)}
          value={tipo}>
          <option value="Individual">Individual por curso/grupo</option>
          <option value="Unificada">Unificada por espacio Curricular</option>
        </select>
        <label htmlFor="tipo">Tipo de planificación anual</label>
      </div>

      <div className="form-floating mb-2">
        <textarea className="form-control" 
        id="introduccion"
        onChange={(e)=>setIntroduccion(e.target.value)}
        value={introduccion}>
        </textarea>
        <label htmlFor="introduccion">Introducción</label>
      </div>
      <div className="form-floating mb-2">
        <textarea className="form-control" 
        id="propositos"
        onChange={(e)=>setPropositos(e.target.value)}
        value={propositos}>
        </textarea>
        <label htmlFor="propositos">Propósitos</label>
      </div>
      
      <div className='my-3'>
        <h6><b>Capacidades a lograr</b></h6>
        <div className="px-3">
          {capacidades.length > 0 &&
            <table className='table table-hover table-sm'>
              <thead>
              </thead>
              <tbody>
                {capacidades.map((cap, index) => (
                  <tr key={index}>
                    <td className='small'>{cap}</td>
                    <td><button type='button' className='btn btn-sm btn-light' onClick={() => quitarElemento(index, 'capacidades')}> X </button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
          <div className="form-floating">
            <textarea className="form-control" placeholder="Capacidades" 
              id='capacidad'
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
            >
            </textarea>
            <label htmlFor='capacidad'>Escribir nueva capacidad</label>
          </div>
          <button type='button' className='btn btn-sm btn-secondary my-1' onClick={agregarCapacidad}>Agregar Capacidad</button>
        </div>
      </div>

      <div className='my-3'>
        <h6><b>Contenidos</b></h6>
        <div className="px-3">
          {contenidos.length > 0 &&
            <table className='table table-hover table-sm'>
              <thead>
              </thead>
              <tbody>
                {contenidos.map((con, index) => (
                  <tr key={index}>
                    <td className='small'>{con}</td>
                    <td><button type='button' className='btn btn-sm btn-light' onClick={() => quitarElemento(index, 'contenidos')}> X </button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
          <div className="form-floating">
            <textarea className="form-control" placeholder="Contenidos" 
              id='contenidos'
              value={itemContenido}
              onChange={(e) => setItemContenido(e.target.value)}
            >
            </textarea>
            <label htmlFor='contenidos'>Escribir nuevo contenido</label>
          </div>
          <button type='button' className='btn btn-sm btn-secondary my-1' onClick={agregarContenido}>Agregar Contenido</button>
        </div>
      </div>

      <div className="form-floating mb-2">
        <textarea className="form-control" 
        id="estrategia_metodologica"
        onChange={(e)=>setEstrategia_metodologica(e.target.value)}
        value={estrategia_metodologica}>
        </textarea>
        <label htmlFor="estrategia_metodologica">Estrategia metodológica</label>
      </div>

      <div className="form-floating mb-2">
        <textarea className="form-control" 
        id="evaluacion"
        onChange={(e)=>setEvaluacion(e.target.value)}
        value={evaluacion}>
        </textarea>
        <label htmlFor="evaluacion">Evaluación</label>
      </div>
      
      <div className="form-floating mb-2">
        <textarea className="form-control" 
        id="entorno"
        onChange={(e)=>setEntorno(e.target.value)}
        value={entorno}>
        </textarea>
        <label htmlFor="entorno">Entorno Formativo</label>
      </div>
      
      <div className="form-floating mb-2">
        <textarea className="form-control" 
        id="recursos"
        onChange={(e)=>setRecursos(e.target.value)}
        value={recursos}>
        </textarea>
        <label htmlFor="recursos">Recursos</label>
      </div>
      
      <div className="form-floating mb-2">
        <textarea className="form-control" 
        id="bibliografia"
        onChange={(e)=>setBibliografia(e.target.value)}
        value={bibliografia}>
        </textarea>
        <label htmlFor="bibliografia">Bibliografía</label>
      </div>
    </>
    }
    {/*input tipo file para cargar planificacion desde archivo, y si se carga, ocultar los demas campos y mostrar solo el input file y el boton de enviar */}
    {verAgregarPlanificacionArchivo &&
    <>      
      <div className="mb-3">
        <label htmlFor="archivo" className="form-label"><b>Cargar planificación desde archivo</b></label>
        <input
          type="file"
          className="form-control"
          id="archivo"
          onChange={(e) => setArchivo(e.target.files[0])}
          accept=".doc,.docx,.pdf"
        />
      </div>
    </>
    }

      <div><hr/></div>
      
      <div className='m-3 text-center'>
        <button type="submit" className="btn btn-sm btn-primary m-1">Guardar planificación</button>
        <button type="reset" className="btn btn-sm btn-warning m-1">Limpiar datos</button>
        <button type="button" className="btn btn-sm btn-secondary m-1" onClick={() => {setVerAgregarPlanificacion(false); setVerAgregarPlanificacionArchivo(false);}}>Cancelar</button>
      </div>
    </form>
  );
}

export default PlanificacionForm;
