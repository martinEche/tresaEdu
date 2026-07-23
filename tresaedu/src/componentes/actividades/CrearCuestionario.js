import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from "react-router-dom";
import { show_alerta } from '../../funciones.js';
import CONFIG from '../../config';

const URL_CUESTIONARIO = `${CONFIG.API_URL}/operarCuestionario.php`;

function CrearCuestionario({cuestionario, setVerNuevoCuestionario, buscaCuestionarios, idMC}) {
   // const { idMC } = useParams();
    const loggeduserId =localStorage.getItem('loggedUserId');
    const [idCuestionario, setidCuestionario] = useState(0);
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [preguntas, setPreguntas] = useState([{ pregunta_texto: '', pregunta_tipo: 'text', opciones: [''], correctas: [] }]);

    useEffect(() => {
        if(cuestionario.id>0){
            setidCuestionario(cuestionario.id);
            setTitulo(cuestionario.titulo);
            setDescripcion(cuestionario.descripcion);
            setPreguntas(cuestionario.preguntas);
        }
    }, [cuestionario]);


    const handlePreguntaChange = (index, campo, value) => {
        const nuevasPreguntas = [...preguntas];
        nuevasPreguntas[index][campo] = value;
        setPreguntas(nuevasPreguntas);
    };

    const handleOpcionChange = (pIndex, oIndex, value) => {
        const nuevasPreguntas = [...preguntas];
        nuevasPreguntas[pIndex].opciones[oIndex] = value;
        setPreguntas(nuevasPreguntas);
    };

    const handleCorrectaChange = (pIndex, opc) => {
        const nuevasPreguntas = [...preguntas];
        if (nuevasPreguntas[pIndex].pregunta_tipo === 'checkbox') {
            if (nuevasPreguntas[pIndex].correctas.includes(opc)) {
                nuevasPreguntas[pIndex].correctas = nuevasPreguntas[pIndex].correctas.filter(item => item !== opc);
            } else {
                nuevasPreguntas[pIndex].correctas.push(opc);
            }
        } else {
            nuevasPreguntas[pIndex].correctas = [opc];
        }
        setPreguntas(nuevasPreguntas);
    };

    const agregarPregunta = () => {
        setPreguntas([...preguntas, { pregunta_texto: '', pregunta_tipo: 'text', opciones: [''], correctas: [] }]);
    };

    const quitarPregunta = (index) => {
        const nuevasPreguntas = preguntas.filter((_, pIndex) => pIndex !== index);
        setPreguntas(nuevasPreguntas);
    };

    const agregarOpcion = (index) => {
        const nuevasPreguntas = [...preguntas];
        nuevasPreguntas[index].opciones.push('');
        setPreguntas(nuevasPreguntas);
    };

    const quitarOpcion = (pIndex, oIndex) => {
        const nuevasPreguntas = [...preguntas];
        nuevasPreguntas[pIndex].opciones = nuevasPreguntas[pIndex].opciones.filter((_, opcIndex) => opcIndex !== oIndex);
        setPreguntas(nuevasPreguntas);
    };

    const handleSubmit = async () => {
        const datos={
            modo: 'cuestionario',
            idCuestionario,
            curso_id:idMC,
            user_id:loggeduserId,
            titulo,
            descripcion,
            preguntas
        }
        //console.log('datos a enviar: ', datos);
        const response = await axios.post(URL_CUESTIONARIO, datos);
        //console.log('data Cuestionario: ', response.data);
        if(response.data.success){
            var tipo = 'success';
            var msj = 'cuestionario creado correctamente';
            if (buscaCuestionarios) buscaCuestionarios();
        }else{
            var tipo = 'error';
            var msj = response.data.message;
        }
        show_alerta(msj,tipo);
        setVerNuevoCuestionario(false);  
    };

    return (
        <div className='card p-3'>
            <h2>Crear Cuestionario</h2>
            <div>
                <input type="text" className='form-control mb-2' placeholder="Título cuestionario" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
                <textarea className='form-control mb-2' placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
           
            {preguntas.map((p, index) => (
                <div key={index} className='card p-2 mb-2'>
                    <h5>Pregunta {index+1}</h5>
                    <div className='row'>
                        <div className='col-8'>
                        
                                <input
                                type="text"
                                placeholder="Pregunta"
                                className='form-control'
                                value={p.pregunta_texto}
                                onChange={(e) => handlePreguntaChange(index, 'pregunta_texto', e.target.value)}
                                />
                        </div>
                        <div className='col-4'>
                                <select className='form-select' value={p.pregunta_tipo} onChange={(e) => handlePreguntaChange(index, 'pregunta_tipo', e.target.value)}>
                                    <option value="text">Texto</option>
                                    <option value="radio">Opción única</option>
                                    <option value="checkbox">Múltiples opciones</option>
                                </select>
                        </div>
                    </div>
                    <hr/>   
                    {p.pregunta_tipo == 'text' &&
                        <div className="alert alert-light my-2" role="alert">
                            <b>Información:</b> La pregunta de tipo texto podra contener hasta 65 mil caracteres.
                        </div>
                    }    
                    {p.pregunta_tipo !== 'text' && p.opciones.map((opc, oIndex) => (
                        <div key={oIndex} className='m-1 p-1 alert alert-light'>
                            <div className='row'>
                                <div className='col-7'>
                                    <input
                                    type="text"
                                    className='form-control'
                                    placeholder="Opción"
                                    value={opc}
                                    onChange={(e) => handleOpcionChange(index, oIndex, e.target.value)}
                                    />
                                </div>
                                <div className='col-4'>
                                    {p.pregunta_tipo === 'radio' ? (
                                    <>
                                        <input
                                        type="radio"
                                        className='form-check-input'
                                        name={`correcta-${index}`}
                                        id={`correcta-${index}-${oIndex}`}
                                        checked={p.correctas[0] === opc}
                                        onChange={() => handleCorrectaChange(index, opc)}
                                        /> 
                                        <label className='px-1' htmlFor={`correcta-${index}-${oIndex}`}> Respuesta correcta</label>
                                    </>
                                    ) : (
                                    <>
                                        <input
                                            type="checkbox"
                                            className='form-check-input'
                                            id={`correctaCh-${index}-${oIndex}`}
                                            checked={p.correctas.includes(opc)}
                                            onChange={() => handleCorrectaChange(index, opc)}
                                        />
                                        <label className='px-1' htmlFor={`correctaCh-${index}-${oIndex}`}> Respuesta correcta</label>
                                   </>
                                    )}
                                </div>
                                <div className='col-1'>
                                    <button type="button" className='btn btn-link' onClick={() => quitarOpcion(index, oIndex)}>X</button>
                                </div>
                            </div>                    
                        </div>
                    ))}
                    {p.pregunta_tipo !== 'text' && (
                        <button type="button" className='btn btn-sm btn-link' onClick={() => agregarOpcion(index)}><i className="fa-solid fa-circle-plus"></i> Agregar otra opción</button>
                    )}
                    {preguntas.length>1 &&
                    <div className='d-flex justify-content-end mt-2'>
                        <button type='button' className='btn btn-sm btn-outline-secondary' onClick={() => quitarPregunta(index)}><i className="fa-regular fa-trash-can"></i></button>
                    </div>
                    }
                </div>
            ))}
            <div className='mb-2 d-flex justify-content-center'>
                <button type="button" className='btn btn-primary' onClick={agregarPregunta}><i className="fa-solid fa-circle-plus"></i> Agregar Pregunta</button>
            </div>
            <hr />
            <div className='d-flex justify-content-center'>
                <button type="button" className='btn btn-success me-1' onClick={handleSubmit}><i className="fa-regular fa-floppy-disk"></i> Guardar Cuestionario</button>
                <button type="button" className='btn btn-secondary me-1' onClick={()=>setVerNuevoCuestionario(false)}>Cancelar</button>
            </div>
        </div>
    );
};

export default CrearCuestionario;
