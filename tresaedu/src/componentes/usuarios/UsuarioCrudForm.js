import { useState, useEffect } from "react";
import { show_alerta } from '../../funciones.js';

function UsuarioCrudForm({crearData, actualizarData, datoAEditar, setDatoAEditar}){
    
    const inicialForm ={
        id:null,
        usuario:"",
        clave:'',
        nombre:"",
        apellido:"",
        documento:""
    };
    
    const [form, setForm] = useState(inicialForm)

    useEffect(()=>{
        if(datoAEditar){
            setForm(datoAEditar);
        }else{
            setForm(inicialForm);
        }
    },[datoAEditar])

    const handleChange =(e) => {
        setForm({
        ...form,
            [e.target.name]: e.target.value    
        })
    }

    const handleSubmint =(e) => {
        e.preventDefault();

        if(!form.usuario || !form.nombre || !form.apellido || !form.documento ){
            show_alerta('faltan datos ','error');
            return;
        }
         
        if(form.id == null){
            crearData(form);
        }else{
            actualizarData(form);
            
        }
        handleReset(e);
    }

    const handleReset =(e) => {
        setForm(inicialForm);
        setDatoAEditar(null);
        console.log('reset')
    }

    return(
        <div>
            <h3>{datoAEditar ? "Editar" : "Agregar Nuevo"}</h3>
            <form onSubmit={handleSubmint}>

                <input type='hidden' id='id' />
                <div className='input-group m-3'>
                    <span className='input-group-text'><i className='fa-regular fa-id-badge'></i></span>
                    <input type="text" className="form-control"
                     name="usuario" 
                    placeholder="Nombre de usuario" 
                    value={form.usuario} 
                    onChange={handleChange} 
                   
                    />
                </div>
                { datoAEditar==null ? ( 
                <div className='input-group m-3'>
                    <span className='input-group-text'><i className='fa-solid fa-key'></i></span>
                    <input type="password" className="form-control"
                    name="clave" 
                    placeholder="contraseña" 
                    onChange={handleChange} 
                    value={form.clave} 
                    />
                </div>
                ):""
                }
                <div className='input-group m-3'>
                    <span className='input-group-text'><i className='fa-solid fa-user'></i></span>
                    <input type="text" className="form-control"
                     name="nombre" 
                    placeholder="Nombre" 
                    onChange={handleChange} 
                    value={form.nombre} 
                    />
                </div>                    
                <div className='input-group m-3'>
                    <span className='input-group-text'><i className='fa-solid fa-user'></i></span>
                    <input type="text" className="form-control"
                    name="apellido" 
                    placeholder="Apellido" 
                    onChange={handleChange} 
                    value={form.apellido} 
                    />
                </div>
                <div className='input-group m-3'>
                    <span className='input-group-text'><i className='fa-regular fa-id-card'></i></span>
                    <input type="text" className="form-control"
                    name="documento" 
                    placeholder="Documento" 
                    onChange={handleChange} 
                    value={form.documento} 
                    />
                </div>                           
                                   
               <button className="btn btn-success m-1" type="submit"><i className="fa-regular fa-floppy-disk"></i> Guardar</button> 
               <input className="btn btn-primary" type="reset" value="Limpiar" onClick={handleReset}/>
            </form>
        </div>
    )
};

export default UsuarioCrudForm;