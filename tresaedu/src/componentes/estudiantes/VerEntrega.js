import { useState, useEffect } from 'react';
import axios from 'axios';
import CONFIG from '../../config';
import Swal from 'sweetalert2';
import { show_alerta } from '../../funciones';

function VerEntrega({ actividad, entregaEstudiante, historialEntregas = [], rol, onEvaluacionGuardada }) {
    const [evaluacion, setEvaluacion] = useState(entregaEstudiante?.estado || '');
    const [devolucion, setDevolucion] = useState(entregaEstudiante?.devolucion || '');
    const [fechaReentrega, setFechaReentrega] = useState(
        entregaEstudiante?.fecha_reentrega ? entregaEstudiante.fecha_reentrega.split(' ')[0] : ''
    );

    useEffect(() => {
        setEvaluacion(entregaEstudiante?.estado || '');
        setDevolucion(entregaEstudiante?.devolucion || '');
        setFechaReentrega(entregaEstudiante?.fecha_reentrega ? entregaEstudiante.fecha_reentrega.split(' ')[0] : '');
    }, [entregaEstudiante]);

    if ((!entregaEstudiante)||(!actividad)){
    return <p>No hay entrega disponible.</p>;
  }

  const handleEvaluar = (e) => {
      e.preventDefault();
      if (!evaluacion) {
          show_alerta('Debes seleccionar un estado de evaluación', 'warning');
          return;
      }
      
      const formData = new FormData();
      formData.append('modo', 'evaluarEntrega');
      formData.append('id_entrega', entregaEstudiante.id_entrega);
      formData.append('estado', evaluacion);
      formData.append('devolucion', devolucion);
      formData.append('id_grupo', entregaEstudiante.id_grupo || 0);
      formData.append('fecha_reentrega', fechaReentrega);

      axios.post(`${CONFIG.API_URL}/operarEntregas.php`, formData)
          .then(res => {
              if (!res.data.error) {
                  show_alerta('Evaluación guardada exitosamente', 'success');
                  if (onEvaluacionGuardada) {
                      onEvaluacionGuardada();
                  }
              } else {
                  show_alerta(res.data.mensaje, 'error');
              }
          })
          .catch(err => {
              console.error(err);
              show_alerta('Error al guardar evaluación', 'error');
          });
  };

  return (<>
        <div className="card p-3 my-1">
            <h5>{actividad.titulo}</h5>
            <p className="small">{actividad.desarrollo}</p>
            <div className="small"><i className="fa-regular fa-clock"></i><b> fecha de entrega:</b> {actividad.fecha_entrega}</div>
            <div className="alert alert-warning small" role="alert">
                <div><i className="fa-solid fa-circle-exclamation"></i> <b>Presentación</b>: {" "}
                {actividad.forma_presentacion ? actividad.forma_presentacion: 'no especificado'}
                </div>
            </div>
            <div className="small">El trabajo es de entrega <b>{actividad.tipo_trabajo}</b></div>
        </div>
        <hr />
        <div className="px-3">
            <div className="small"><i className="fa-regular fa-clock me-1"></i><strong> entregado el </strong> {entregaEstudiante.fecha_entrega}</div>
            <div className="alert alert-info small" role="alert"><strong>Comentario del estudiante:</strong> {entregaEstudiante.comentario}</div>
            {entregaEstudiante.adjunto && (
                <p>
                    <i className="fa-solid fa-paperclip"></i>
                    <strong>Archivo adjunto:</strong>{" "}
                    <a href={`${CONFIG.API_URL}/${entregaEstudiante.adjunto}`} target="_blank" rel="noopener noreferrer">
                        Ver archivo
                    </a>
                </p>
            )}
        </div>

        {/* Sección de Evaluación para el docente */}
        {rol !== '7' && (
            <div className="card p-3 mt-3 border-info">
                <h6><i className="fa-solid fa-check-double text-info me-2"></i>Evaluación Docente</h6>
                
                {entregaEstudiante.estado === 'entregado' ? (
                    <form onSubmit={handleEvaluar}>
                        <div className="mb-2">
                            <label className="form-label small fw-bold">Estado</label>
                            <select className="form-select form-select-sm" value={evaluacion} onChange={(e) => setEvaluacion(e.target.value)}>
                                <option value="">Seleccionar...</option>
                                <option value="aprobado">Aprobado</option>
                                <option value="aprobado con sugerencias">Aprobado con sugerencias</option>
                                <option value="reentrega">Rehacer (Habilita re-entrega)</option>
                                <option value="desaprobado">Desaprobado</option>
                            </select>
                        </div>
                        {evaluacion === 'reentrega' && (
                            <div className="mb-2">
                                <label className="form-label small fw-bold text-danger">Fecha límite de reentrega</label>
                                <input 
                                    type="date" 
                                    className="form-control form-control-sm" 
                                    value={fechaReentrega} 
                                    onChange={(e) => setFechaReentrega(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="mb-2">
                            <label className="form-label small fw-bold">Devolución / Comentario</label>
                            <textarea 
                                className="form-control form-control-sm" 
                                rows="3" 
                                value={devolucion} 
                                onChange={(e) => setDevolucion(e.target.value)}
                                placeholder="Escribe la devolución para el estudiante..."
                            ></textarea>
                        </div>
                        <div className="text-end mt-2">
                            <button type="submit" className="btn btn-sm btn-primary">Guardar Evaluación</button>
                        </div>
                    </form>
                ) : (
                    <div>
                        <div className="mb-2">
                            <span className="badge bg-secondary">{entregaEstudiante.estado.toUpperCase()}</span>
                            {entregaEstudiante.estado === 'reentrega' && (
                                <span className="ms-2 text-warning fw-bold small"><i className="fa-solid fa-hourglass-half me-1"></i>Esperando nueva entrega del estudiante...</span>
                            )}
                        </div>
                        {entregaEstudiante.devolucion && (
                            <div className="p-2 alert alert-warning small mb-0 mt-2">
                                <b>Tu devolución:</b> {entregaEstudiante.devolucion}
                                <small className="d-block text-muted mt-1">Evaluado el: {entregaEstudiante.fecha_devolucion}</small>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        {/* Mostrar historial si hay más de una entrega */}
        {historialEntregas.length > 1 && (
            <div className="mt-4 pt-3 border-top">
                <h6 className="text-secondary mb-3"><i className="fa-solid fa-clock-rotate-left me-2"></i>Historial de Entregas Previas</h6>
                {historialEntregas.slice(1).map((ent, idx) => (
                    <div key={idx} className="mb-3 p-3 bg-light border rounded">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="badge bg-secondary">{ent.estado.toUpperCase()}</span>
                            <small className="text-muted">{ent.fecha_entrega}</small>
                        </div>
                        {ent.nombre_archivo && (
                            <p className="mb-1 small">
                                <b>Archivo adjunto:</b> <a href={`${CONFIG.API_URL}/${ent.adjunto}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary ms-2"><i className="fa-solid fa-download me-1"></i> Descargar {ent.nombre_archivo}</a>
                            </p>
                        )}
                        {ent.comentario && (
                            <div className="mt-2 p-2 bg-white border rounded small">
                                <small className="text-muted d-block">Comentario del estudiante:</small>
                                {ent.comentario}
                            </div>
                        )}
                        {ent.devolucion && (
                            <div className="mt-3 p-2 alert alert-warning small mb-0">
                                <h6 className="alert-heading small fw-bold mb-1">Tu devolución previa:</h6>
                                {ent.devolucion}
                                <small className="d-block text-muted mt-1">Evaluado el: {ent.fecha_devolucion}</small>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
    </>
  );
}

export default VerEntrega;
