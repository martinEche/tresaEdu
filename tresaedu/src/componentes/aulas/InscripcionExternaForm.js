import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { show_alerta } from '../../funciones.js';
import CONFIG from '../../config';

const URL = `${CONFIG.API_URL}/operaInscripciones.php`;

function InscripcionExternaForm({ setVerFormRegistro, codigo }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    codigo: codigo || '',
    usuario: '',
    clave: '',
    nombre: '',
    apellido: '',
    documento: '',
    hijos: []
  });

  const [cantidadHijos, setCantidadHijos] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if(name==='documento'){
      setFormData({ ...formData, [name]: value, ['usuario']: value });
    }else{
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleHijoChange = (index, e) => {
    const { name, value } = e.target;
    const updatedHijos = [...formData.hijos];
    updatedHijos[index] = { ...updatedHijos[index], [name]: value };
    setFormData({ ...formData, hijos: updatedHijos });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    //console.log('prev '+JSON.stringify(formData))
    try {
      const response = await axios.post(URL, formData);
      //console.log('data: '+response.data)
      if(response.data.success){
          var tipo = 'success';
          var msj = response.data.message;
          show_alerta(msj, tipo);
          setVerFormRegistro(false);
          navigate('/'); // Redirigir

      }else{
         var tipo = 'error';
         var msj = response.data.error;
         show_alerta(msj, tipo);
          console.error('Error al registrar el usuario');
      }
      show_alerta(msj,tipo);
      //setVerNuevoCuestionario(false);  
    } catch (error) {
      console.error('Error en la solicitud:', error);
    }
  };

  const agregarHijosInputs = () => {
    const hijosInputs = [];
    for (let i = 0; i < cantidadHijos; i++) {
      hijosInputs.push(
        <div key={i}>
          <h3 className="ms-3">Datos del Hijo {i + 1}</h3>
          <div className='grupo m-3'>
            <input
              type="text"
              className=""
              name="nombre"
              required
              onChange={(e) => handleHijoChange(i, e)}
            />
            <span className="barra"></span>
            <label htmlFor="nombre">Nombre</label>
          </div>
          <div className='grupo m-3'>
            <input
              type="text"
              className=""
              name="apellido"
              required
              onChange={(e) => handleHijoChange(i, e)}
            />
            <span className="barra"></span>
            <label htmlFor="apellido">Apellido</label>
          </div>
          <div className='grupo m-3'>
            <input
              type="text"
              className=""
              name="documento"
              required
              onChange={(e) => handleHijoChange(i, e)}
            />
            <span className="barra"></span>
            <label htmlFor="documento">Documento</label>
          </div>
          <div className='grupo m-3'>
            <input
              type="date"
              className=""
              name="fecnac"
              required
              onChange={(e) => handleHijoChange(i, e)}
            />
            <span className="barra"></span>
            <label htmlFor="documento">Fecha de Nacimiento</label>
          </div>
        </div>
      );
    }
    return hijosInputs;
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="form">
          <h1>Registro</h1>
          <div className='grupo m-3'>
            <input
              type="text"
              readOnly
              className=" text-end"
              id="codigo"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
            />
            <span className="barra"></span>
            <label htmlFor="codigo"><i className='fa-solid fa-user'></i> Código</label>
          </div>
          <h3 className="ms-3">Datos del Tutor</h3>
          <div className='grupo m-3'>
            <input
              type="text"
              className=""
              name="nombre"
              required
              value={formData.nombre}
              onChange={handleChange}
            />
            <span className="barra"></span>
            <label htmlFor="nombre">Nombre</label>
          </div>
          <div className='grupo m-3'>
            <input
              type="text"
              className=""
              name="apellido"
              required
              value={formData.apellido}
              onChange={handleChange}
            />
            <span className="barra"></span>
            <label htmlFor="apellido">Apellido</label>
          </div>
          <div className='grupo m-3'>
            <input
              type="text"
              className=""
              name="documento"
              required
              value={formData.documento}
              onChange={handleChange}
            />
            <span className="barra"></span>
            <label htmlFor="documento">Documento</label>
          </div>
          <div className='grupo m-3'>
            <input
              type="text"
              className="text-end"
              id="usuario"
              name="usuario"
              required
              defaultValue={formData.usuario}
              readOnly
            />
            <span className="barra"></span>
            <label htmlFor="usuario"><i className='fa-solid fa-user'></i> Usuario</label>
          </div>
          <div className='grupo m-3'>
            <input
              type="password"
              className=""
              name="clave"
              required
              value={formData.clave}
              onChange={handleChange}
            />
            <span className="barra"></span>
            <label htmlFor="clave"><i className='fa-solid fa-key'></i> Contraseña</label>
          </div>
          
          <div className='grupo m-3'>
            <input
              type="number"
              className=""
              name="cantidadHijos"
              value={cantidadHijos}
              onChange={(e) => setCantidadHijos(parseInt(e.target.value) || 0)}
            />
            <span className="barra"></span>
            <label htmlFor="cantidadHijos">Cantidad de hijos a inscribir en el curso</label>
          </div>
          {agregarHijosInputs()}
          <div className="text-center">
            <button className="btn btn-success m-1" type="submit">Registrar e inscribir</button>
            <button className="btn btn-secondary m1" type="button" onClick={() => setVerFormRegistro(false)}>Cancelar</button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default InscripcionExternaForm;
