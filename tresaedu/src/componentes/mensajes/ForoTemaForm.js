import React, { useState, useEffect } from 'react';
import { crearTema, editarTema } from '../../servicios/forumService.js';
import { show_alerta } from '../../funciones.js';

function ForoTemaForm({temaEdita, clase, setVerNuevoTema,setTemas,fetchTemas}) {
  const usuario_id = localStorage.getItem('loggedUserId');
  const claseId = clase.id;

  const [idTema, setIdTema] = useState(0);
  const [tema, setTema] = useState('');
  const [contenido, setContenido] = useState('');
  const [archivos, setArchivos] = useState([]);

  const handleArchivoChange = (e) => {
    setArchivos([...e.target.files]);
  };

  useEffect(() => {
    if(temaEdita) {
      setIdTema(temaEdita.id);
      setTema(temaEdita.tema);
      setContenido(temaEdita.contenido);
      console.log('archivo: '+temaEdita.archivos)
      setArchivos(!(temaEdita.archivos==null)?temaEdita.archivos:[]);
     }   
  }, [temaEdita]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('id_clase', claseId);
    formData.append('id_usuario', usuario_id);
    formData.append('id_tema_editar', idTema);
    formData.append('tema', tema);
    formData.append('contenido', contenido);
    archivos.forEach((archivo, index) => {
      formData.append(`archivos[${index}]`, archivo);
    });
    try {
      let res;
      if(idTema==0){
        res = await crearTema(formData);
      }else{
        res = await editarTema(formData);
      }
      //console.log("resdata: "+res.data);
      var tipo = res.data[0];
      var msj = res.data[1];
      //console.log("ddd: "+msj + '-' + tipo);
      show_alerta(msj, tipo);
      setVerNuevoTema(false);
      setTemas([]);
      fetchTemas();
      //navigate('/');
    } catch (err) {
      show_alerta('Error en la solicitud', 'error');
      console.log(err);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h6>{!idTema ?'Nuevo Tema':`Editando tema: "${tema}" `}</h6>
        <div className='mb-3'>
          <label>Tema</label>
          <input id='idTema' type='hidden' value={idTema} />
          <div className="form-floating">
            <input 
              type="text" 
              className="form-control" 
              id="tema"  
              value={tema} 
              onChange={(e) => setTema(e.target.value)} 
              required 
            />
            <label htmlFor="tema">Colocar el tema de debate</label>
          </div>
        </div>
        <div className='mb-3'>
          <label>Contenido</label>
          <div className="form-floating">
            <textarea 
              className="form-control" 
              id="Contenido"  
              value={contenido} 
              onChange={(e) => setContenido(e.target.value)} 
              required 
            ></textarea>
            <label htmlFor="Contenido">Ingresar contenido</label>
          </div>
        </div>
        <div className='mb-3'>
          <label>Archivos</label>
          <div>
            {archivos.length !=0 &&
            <table>
              <thead>
                <th></th>
                <th></th>
                <th></th>
              </thead>
              <tbody>
                {archivos.map((archivo, index)=>(
                <tr key={archivo.id}>
                  <td className='small'><i className="fa-solid fa-paperclip"></i></td>
                  <td className='small'><a href={archivo.file_path} >archivo{index}.{archivo.extension}</a>
                  </td>
                  <td className='small'><button type='button' className='btn btn-outline-danger btn-sm'><i className="fa-regular fa-trash-can"></i></button></td>
                </tr>
                ))}

              </tbody>
            </table>
            }
          </div>
          <div className="input-group mb-3">
            <input 
              type="file" 
              className="form-control" 
              id="archivos" 
              multiple 
              onChange={handleArchivoChange} 
            />
            <label className="input-group-text" htmlFor="archivos"><i className="fa-solid fa-paperclip"></i></label>
          </div>
        </div>
        <div className='d-flex justify-content-center'>
          <button type="submit" className='btn btn-sm btn-success mx-1'>Guardar</button>
          <button type="button" className='btn btn-sm btn-secondary mx-1' onClick={() => setVerNuevoTema(false)}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

export default ForoTemaForm;
