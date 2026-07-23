import React, { useState } from 'react';

function ForoRespuestaForm({ temaId, respuestaId = null, responder, setVerResponder }) {
  const usuario_id = localStorage.getItem('loggedUserId');
  const [contenido, setContenido] = useState('');
  const [archivos, setArchivos] = useState([]);

  const handleArchivoChange = (e) => {
    setArchivos([...e.target.files]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('respuesta', '1');
    formData.append('id_tema', temaId);
    if (respuestaId) {
      formData.append('id_respuesta', respuestaId);
      console.log("es respuesta a una respuesta")
    }
    formData.append('id_usuario', usuario_id);
    formData.append('contenido', contenido);
    archivos.forEach((archivo, index) => {
      formData.append(`archivos[${index}]`, archivo);
    });
    responder(formData);
    setContenido('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h6>Responder</h6>
      <div className="form-floating mb-1">
        <textarea className="form-control" id="respuesta" value={contenido} onChange={(e) => setContenido(e.target.value)} required></textarea>
        <label htmlFor="respuesta">Escribir respuesta</label>
      </div>
      <div className='mb-1'>
        <label><i className="fa-solid fa-paperclip"></i> adjuntar archivos a la respuesta</label>
        <div className="input-group mb-3">
          <input 
            type="file" 
            className="form-control" 
            id="archivos" 
            multiple 
            onChange={handleArchivoChange} 
          />
          <label className="input-group-text" htmlFor="archivos">Adjuntar</label>
        </div>
      </div>
      <button type="submit" className='btn btn-sm btn-primary me-1'>Subir respuesta</button>
      <button type="button" className='btn btn-sm btn-secondary' onClick={() => setVerResponder(false)}>Cancelar</button>
    </form>
  );
}

export default ForoRespuestaForm;
