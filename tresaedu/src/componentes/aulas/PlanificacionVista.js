import { useEffect } from "react";
import CONFIG from '../../config';

function PlanificacionVista({ plan }) {
    let capacidades = [];
    let contenidos = [];
    console.log("planificacion vista: ", plan);
    try {
        // Parsear las cadenas en arreglos
        capacidades = JSON.parse(plan.capacidades || "[]"); // Asegura que no sea null/undefined
        contenidos = JSON.parse(plan.contenidos_generales|| "[]");
        //contenidos = plan.contenidos_generales;
    } catch (error) {
        console.error("Error al parsear capacidades o contenidos:", error);
    }
    //console.log("contenidos parseados: ", contenidos);
    //console.log("contenidos no parseadas: ", plan.contenidos_generales);

    //console.log("capacidades parseados: ", capacidades);
    //console.log("capacidades no parseadas: ", plan.capacidades);
    const obtenerIcono = (archivo) => {
      if (!archivo) return null;

      const ext = archivo.split('.').pop().toLowerCase();

      if (ext === 'pdf') return 'icono-pdf.jpg';
      if (['doc', 'docx'].includes(ext)) return 'icono-doc.png';

      return 'icono-doc.png';
    };
    return (    
      <div className="mx-3">
        
        <h3>{plan.nombre_espacio} {plan.orden} {plan.denominacion}</h3>
        
        {plan.cohorte && <h6>cohorte {plan.cohorte}</h6>}
        <hr className="my-4"/>
        {plan.introduccion && (
          <div>
            <h5>Introducción</h5>
            <p className="mx-3">{plan.introduccion}</p>
          </div>
        )}
        {plan.propositos && (
          <div>
            <h5>Propósitos</h5>
            <p className="mx-3">{plan.propositos}</p>
          </div>
        )}
        
        {capacidades.length > 0 && <>
        <h5>Capacidades</h5>
        {Array.isArray(capacidades) && capacidades.length > 0 ? (
          <ul>
            {capacidades.map((capacidad, index) => (
              <li key={index}>{capacidad}</li>
            ))}
          </ul>
        ) : (
          <p>No hay capacidades disponibles</p>
        )}
        </>}
        {contenidos.length > 0 && <>
        <h5>Contenidos</h5>
        {Array.isArray(contenidos) && contenidos.length > 0 ? (
          <ul>
            {contenidos.map((contenido, index) => (
              <li key={index}>{contenido}</li>
            ))}
          </ul>
        ) : (
          <p>No hay contenidos disponibles.</p>
        )}
        </>}
        {plan.estrategia_metodologica && <>
        <h5>Estrategia metodológica</h5>
        <p className="mx-3">{plan.estrategia_metodologica}</p>
        </>}
        {plan.evaluacion && <>
        <h5>Evaluación</h5>
        <p className="mx-3">{plan.evaluacion}</p>
        </>}
        {plan.entorno && <>
        <h5>Entorno</h5>
        <p className="mx-3">{plan.entorno}</p>
        </>}
        {plan.recursos && <>
        <h5>Recursos</h5>
        <p className="mx-3">{plan.recursos}</p>
        </>}
        {plan.bibliografia && <>
        <h5>Bibliografía</h5>        
          <ul className="square">
            {plan.bibliografia.split('-').map((bib, index) => (
              bib && <li key={index}>{bib}</li>
            ))}
          </ul>
        </>}
        {plan.archivo && (
          <div className="my-2 text-center">
            <a href={`${CONFIG.API_URL}/planificaciones/${plan.archivo}`} target="_blank" rel="noopener noreferrer">
              <img 
                src={`${CONFIG.API_URL}/img/${obtenerIcono(plan.archivo)}`}
                alt="Icono PDF"
                width={'150px'}
              />
              <div>click para descargar ver archivo de planificación</div>
            </a>
          </div>
        )}

      </div>
    );
  }
  
  export default PlanificacionVista;
  