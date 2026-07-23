import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from "react-router-dom";
import CONFIG from '../../config';

function ResponderCuestionario(){
    const { formId } = useParams();
    const [formulario, setFormulario] = useState(null);
    const [respuestas, setRespuestas] = useState([]);
		const [mostrarResultados, setMostrarResultados] = useState(false);
		const [resultados, setResultados] = useState(null);
        const loggedUserId = localStorage.getItem('loggedUserId');
    
		useEffect(() => {
        const fetchForm = async () => {
            const response = await axios.get(`${CONFIG.API_URL}/operarCuestionario.php?form_id=${formId}&user_id=${loggedUserId}`);
           // console.log("dd: "+JSON.stringify(response.data.data))
            setFormulario(response.data.data);
            setRespuestas(response.data.data.preguntas.map(() => ''));
        };
        fetchForm();
    }, [formId]);

    const handleRespuestaChange = (index, value) => {
        const nuevasRespuestas = [...respuestas];
        nuevasRespuestas[index] = value;
		//console.log(value);
        setRespuestas(nuevasRespuestas);
    };

		const handleSubmit = async () => {
			try {
				const datos_respuesta={
					formulario_id: formId,
                    usuario_id: loggedUserId,
					respuestas: formulario.preguntas.map((p, index) => ({
							pregunta_id: p.id,
							respuesta_texto: respuestas[index]
					}))
				}
				//console.log(datos_respuesta)
					const response = await axios.post(`${CONFIG.API_URL}/operarCuestionario.php`,datos_respuesta);
					// Aquí puedes manejar la lógica para mostrar los resultados al usuario
					//console.log(response.data);
					setMostrarResultados(true);
					setResultados(response.data.resultado)
			} catch (error) {
					console.error("Error enviando las respuestas: ", error);
			}
		};

    return (
        formulario ? (
            <div className='container-principal'>
							{!mostrarResultados ?	
								<div className='card p-4 shadow-sm'>
                                    {formulario.intentos > 0 && (
                                        <div className="alert alert-info mb-4">
                                            <i className="fa-solid fa-clock-rotate-left me-2"></i>
                                            <strong>Historial:</strong> Ya has respondido este cuestionario {formulario.intentos} vez/veces. 
                                            Tu mejor porcentaje de acierto es <strong>{Math.round(formulario.mejor_acierto * 100)}%</strong>.
                                        </div>
                                    )}
									<h2 className="text-primary">{formulario.titulo}</h2>
									<p className="lead text-muted">{formulario.descripcion}</p>
									{formulario.preguntas.map((p, index) => (
											<div key={index} className='card p-3 my-3 border-light'>
												<p className="fw-bold">{index+1}. {p.pregunta_texto}</p>
													{p.pregunta_tipo === 'text' ? (
															<input
																	type="text"
                                                                    className="form-control"
																	value={respuestas[index]}
																	onChange={(e) => handleRespuestaChange(index, e.target.value)}
															/>
													) : (
															p.opciones.map((opc, oIndex) => (
																<div key={oIndex} className="form-check">
																	<input 
																		className="form-check-input" 
																		type={p.pregunta_tipo} 
																		name={`pregunta_${index}`}  
																		value={opc}  
																		onChange={(e) => handleRespuestaChange(index, e.target.value)} 
																		id={`pregunta_${oIndex}_${index}`} 
																	/>
																	<label className="form-check-label" htmlFor={`pregunta_${oIndex}_${index}`}>
																		{opc}
																	</label>
																</div>
															))
													)}
											</div>
									))}
									<button className='btn btn-primary my-3 btn-lg w-100' onClick={handleSubmit}><i className="fa-solid fa-paper-plane me-2"></i>Enviar Respuestas</button>
								</div>
							:
							<div className='card p-5 text-center shadow-sm'>
                                <h3 className="mb-4 text-success"><i className="fa-regular fa-circle-check fa-2x mb-3 d-block"></i>¡Cuestionario Completado!</h3>
                                
                                <div className="row justify-content-center mb-4">
                                    <div className="col-md-6">
                                        <ul className="list-group list-group-flush text-start fs-5">
                                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                                Aciertos
                                                <span className="badge bg-primary rounded-pill">{resultados.correctas} de {resultados.total}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                                Porcentaje Obtenido
                                                <span className="badge bg-info rounded-pill">{Math.round(resultados.porcentaje_actual * 100)}%</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                                Mejor Porcentaje Histórico
                                                <span className="badge bg-success rounded-pill">{Math.round(resultados.mejor_acierto * 100)}%</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between align-items-center text-muted">
                                                Total de Intentos
                                                <span className="badge bg-secondary rounded-pill">{resultados.intentos}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div>
                                    <button type='button' className='btn btn-outline-primary me-2' onClick={()=>window.history.back()}>
                                        <i className="fa-solid fa-arrow-left me-2"></i>Volver a la clase
                                    </button>
                                    <button type='button' className='btn btn-primary' onClick={()=>setMostrarResultados(false)}>
                                        <i className="fa-solid fa-rotate-right me-2"></i>Volver a intentar
                                    </button>
                                </div>
							</div>
							}
							</div>
        ) : (
            <p>Cargando formulario...</p>
        )
    );
};

export default ResponderCuestionario;
