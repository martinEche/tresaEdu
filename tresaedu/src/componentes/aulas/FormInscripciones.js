import './css/Cursos.css';
import { useState } from "react";


function FormInscripciones({ enviarFormData, idFormacion, cohorte }) {
    const [fechaInicioInscripcion, setFechaInicioInscripcion] = useState('');
    const [fechaCierreInscripcion, setFechaCierreInscripcion] = useState('');

    //metodo enviar formulario
    const handleSubmint=(e)=> {
        e.preventDefault();
    
        const formData = new FormData();
        formData.append('nuevo', 'DefinirFechasInscripcion');
        formData.append('cohorte', cohorte);
        formData.append('idFormacion', idFormacion);  
        formData.append('fechaInicioInscripcion', fechaInicioInscripcion);
        formData.append('fechaCierreInscripcion', fechaCierreInscripcion);
        
        enviarFormData(formData);
        handleReset();
    };

    //metodo resetear formulario
    const handleReset =() => {
        let formulario = document.getElementById('formInscripciones');
        formulario.reset();
        setFechaInicioInscripcion('');
        setFechaCierreInscripcion('');
    };


    return ( 
        <>
            <h6 className=''>Configurar periodo de inscripciones para todos los cursos</h6>
            <form onSubmit={handleSubmint} id='formInscripciones'>
                <div className="form-floating mb-3">
                    <input type="datetime-local" className="form-control" 
                    name='fechaInicioInscripcion' id="fechaInicioInscripcion" 
                    defaultValue={fechaInicioInscripcion} onChange={(e) => setFechaInicioInscripcion(e.target.value)} />
                    <label htmlFor="fechaInicioInscripcion">Fecha apertura de inscripción</label>
                </div>

                <div className="form-floating mb-3">
                    <input type="datetime-local" className="form-control" 
                    name='fechaCierreInscripcion' id="fechaCierreInscripcion" 
                    defaultValue={fechaCierreInscripcion} onChange={(e) => setFechaCierreInscripcion(e.target.value)} />
                    <label htmlFor="fechaCierreInscripcion">Fecha finalizacion de inscripciones</label>
                </div>
                <div className='m-3 text-center'>
                    <button type="submit" className="btn btn-sm btn-primary m-1">Establecer periodo</button>
                    <button type="reset" className="btn btn-sm btn-warning m-1" onClick={()=>handleReset()}>Limpiar datos</button>
                    <button type="button" className="btn btn-sm btn-secondary m-1" data-bs-dismiss="modal">Cancelar</button>
                </div>
            </form>
        </> 
    );
}

export default FormInscripciones;