import React, { useState } from 'react';
import { useParams } from "react-router-dom";
import axios from 'axios';
import './css/ia.css';
import CONFIG from '../../config';

const URL_API_IA=`${CONFIG.API_URL}/generar_plan_clase.php`;
//const URL_API_IA=`${CONFIG.API_URL}/test_conectividad_IA.php`;

function CursoIA(){
  const [capacidades, setCapacidades] = useState(['']);
  const [contenidosGenerales, setContenidosGenerales] = useState('');
  const [contenidosEspecificos, setContenidosEspecificos] = useState(['']);
  const [cantidadClases, setCantidadClases] = useState(1);
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  let { idMC, idCG } = useParams();

  const handleAgregarClase = () => {
    setClases([...clases, { contenido: '', foro: false, trabajoPractico: false }]);
  };

  const handleAddCapacidad = () => {
    setCapacidades([...capacidades, '']);
  };

  const handleEliminarCapacidad = (index) =>{
    const nuevasCapacidades = capacidades.filter((_, i) => i !== index);
    setCapacidades(nuevasCapacidades);
  }

  const handleCapacidadChange = (index, value) => {
    const nuevaCapacidad = capacidades.map((cap, i) => (i === index ? value : cap));
    setCapacidades(nuevaCapacidad);
  };

	const handleAddContenidosEspecificos = () => {
    setContenidosEspecificos([...contenidosEspecificos, '']);
  };

  const handleEliminarContenidoEspecifico = (index) =>{
    const nuevosContenidos = contenidosEspecificos.filter((_, i) => i !== index);
    setContenidosEspecificos(nuevosContenidos);
  }

  const handleContenidosEspecificosChange = (index, value) => {
    const nuevoContenido = contenidosEspecificos.map((obj, i) => (i === index ? value : obj));
    setContenidosEspecificos(nuevoContenido);
  };



  const handleClaseChange = (index, field) => (e) => {
    const updatedClases = clases.map((clase, i) =>
      i === index ? { ...clase, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value } : clase
    );
    setClases(updatedClases);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    //console.log(idMC);
    
    setLoading(true);
    const data = {
      id_grupo_curso:idCG,
      capacidades,
      contenidosGenerales,
      contenidosEspecificos,
      cantidadClases,
      clases,
    };
    try {
      const response = await axios.post(URL_API_IA, data);
      console.log(response.data);
      if (response.data.success) {
        console.log("entro: "+response.data.planificacion);
        //setResultado(response.data.planificacion.prompt);
         // este set result para cuando habilite la IA
        setResultado(response.data.planificacion);
      } else {
        console.error('Error en la generación de la planificación:', response.data.message);
      }
    } catch (error) {
      console.error('Error al obtener la planificación:', error);
    }
    setLoading(false);
  };

  const contenidosEspecificosArray = contenidosEspecificos.map(contenido => contenido.trim());

  return (
    <div className='container-principal mb-4'>
    {!resultado ?
    <div className='m2'>
      <h2>Generador de Plan de Curso asistido con IA</h2>
      <div className="alert alert-info" role="alert">
        <b>¡Atención!</b> Estre asistente elaborara mediante inteligencia Artificial una sugerencia de palnificacion y una sugerencia de posibles clases, para que sean utilizadas como bases de la presentacion final de las mismas. 
      </div>
      <div className='card p-4'>
        <form onSubmit={handleSubmit}>
          <div className='my-2'>
            <h4>Capacidades/habilidades a Lograr</h4>
            <div className="alert alert-light" role="alert">
              <b>Información:</b> Detallar cada capacidad/habilidad a trabajar en el curso, con el boton agregar capacidad podra agregar una nueva linea de escritura.
            </div>
            {capacidades.map((cap, index) => (
              <div key={index} className="row g-3 align-items-center mb-1">
                <div className="col-auto">
                  <label htmlFor="inputPassword6" className="col-form-label">{(index+1)}.</label>
                </div>
                <div className="col-auto">
                  <input type='text' className="form-control" placeholder="Capacidades/habilidades" 
                    id={`floatingTextarea2-${index}`}
                    value={cap}
                    onChange={(e) => handleCapacidadChange(index, e.target.value)}
                  />
                </div>
                <div className="col-auto">
                  <button type='button' className='btn btn-sm btn-outline-danger' onClick={()=>handleEliminarCapacidad(index)}>X</button>
                </div>
              </div>
            ))}
            <button type='button' className='btn btn-sm btn-secondary ms-4 my-1' onClick={handleAddCapacidad}>Agregar Capacidad/habilidad</button>
          </div>

          
          <div className='card p-4'>
            <h4>Contenidos</h4>
            <div className="alert alert-light" role="alert">
              <b>Información:</b> Contenidos generales ingresalos en el area de texto correspondiente separados por comas y a continuacion ingresara en cada linea tema a tratar con sus contenidos correspondientes, con el boton agregar contenidos especificos podra agregar una nueva linea de escritura.
            </div>
            <div className='my-2'>
              <div className="form-floating">
                <textarea className="form-control" placeholder="Objetivos" 
                  id="floatingTextarea"
                  value={contenidosGenerales}
                  onChange={(e) => setContenidosGenerales(e.target.value)}
                ></textarea>
                <label htmlFor="floatingTextarea">Contenidos Generales</label>
              </div>
            </div>
      
            <div className='my-2'>
              <label className="form-label">Contenidos Específicos</label>
            
              {contenidosEspecificos.map((obj, index) => (
              <div key={index} className="row g-3 align-items-center mb-1">
                <div className="col-auto">
                  <label htmlFor="input" className="col-form-label">{(index+1)}.</label>
                </div>
                <div className="col-auto">
                  <input type='text' className="form-control" placeholder="contenido" 
                  id={`floatingTextarea1-${index}`}
                  value={obj}
                  onChange={(e) => handleContenidosEspecificosChange(index, e.target.value)}
                  />
                </div>
                <div className="col-auto">
                  <button type='button' className='btn btn-sm btn-outline-danger' onClick={()=>handleEliminarContenidoEspecifico(index)}>X</button>
                </div>
              </div>
              ))}
              <button type='button' className='btn btn-sm btn-secondary ms-4 my-1' onClick={handleAddContenidosEspecificos}>Agregar Contenidos Específico</button>
            </div>
          </div>
          <div className='card p-4 my-2'>
            <h4>Clases</h4>
            <div className="alert alert-warning" role="alert">
             <b>¡Atención!</b> Estre asistente solo le permite crear un maximo de 3 (tres) clases de manera asistida mediante inteligencia Artificial. Las restantes clases podran ser creadas desde el administrador de clases <i className="wrap-icon fa-solid fa-file-signature mr-3"></i>. 
            </div>
            <div className="form-floating mb-3">
              <input type="number" className="form-control" id="floatingInput"
              value={cantidadClases} onChange={(e) => {
                setCantidadClases(Number(e.target.value));
                setClases(Array.from({ length: Number(e.target.value) }, () => ({ contenido: '', foro: false, trabajoPractico: false })));
                }} min="1" max='3' required />
              <label htmlFor="floatingInput">Cantidad de Clases:</label>
            </div>
          
            {Array.from({ length: cantidadClases }).map((_, index) => (
              <div key={index}>
                <h5><i className="fa-regular fa-file-lines"></i> Clase {index + 1}</h5>
                <label>Contenido:</label>
                <select className="form-select" value={clases[index]?.contenido || ''} onChange={handleClaseChange(index, 'contenido')}>
                  <option value="">Seleccione un contenido</option>
                  {contenidosEspecificosArray.map((contenido, i) => (
                    <option key={i} value={contenido}>{contenido}</option>
                  ))}
                </select>
                
                <div className="form-check">
                  <input className="form-check-input" id={`foro_${index}`}
                    type="checkbox"
                    checked={clases[index]?.foro || false}
                    onChange={handleClaseChange(index, 'foro')}
                  />
                  <label className="form-check-label" htmlFor={`foro_${index}`}>Incluir Foro</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" id={`tp_${index}`}
                    type="checkbox"
                    checked={clases[index]?.trabajoPractico || false}
                    onChange={handleClaseChange(index, 'trabajoPractico')}
                  />
                  <label className="form-check-label" htmlFor={`tp_${index}`}>Incluir Trabajo Práctico</label>
                </div>
              </div>
            ))}
          </div>
          <div className='d-flex justify-content-center'>
          <button type="submit" className='btn-11 mt-4' disabled={loading}>
            <i className="fa-solid fa-brain"></i> <br></br>{loading ? 'Generando...' : 'Generar Planificación'}
          </button>
          </div>
        </form>
      </div>
    </div>
    :
      resultado && (
        <div>
          <h2>Planificación Generada</h2>
          <pre>{resultado}</pre>
        </div>
      )
    }
    </div>
  );
};

export default CursoIA;
