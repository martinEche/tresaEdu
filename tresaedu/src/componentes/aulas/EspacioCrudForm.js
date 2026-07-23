import { useEffect, useState } from "react";
import { show_alerta } from '../../funciones.js';

function EspacioCrudForm({ enviarFormData, espacios, id_formacion, nombreEstructura, datoEditar }) {
    const [id, setId] = useState(0);
    const [nombre, setNombre] = useState("");
    const [orden, setOrden] = useState(1);
    const [dictado, setDictado] = useState("Estudiantes");
    const [horas, setHoras] = useState(0);
    const [correspondencia, setCorrespondencia] = useState(0);
    const [imagen, setImagen] = useState(null); // 👈 nuevo estado
    const [preview, setPreview] = useState(null); // 👈 miniatura

    useEffect(() => {
        if (datoEditar) {
            setId(datoEditar.id);
            setNombre(datoEditar.nombre_espacio);
            setOrden(datoEditar.orden);
            setDictado(datoEditar.dictado);
            setHoras(datoEditar.horas);
            setCorrespondencia(datoEditar.correspondencia);
            setImagen(null); // no cargamos imagen desde datoEditar
        } else {
            handleReset();
        }
    }, [datoEditar]);

    function handleSubmint(e) {
        e.preventDefault();

        if (!nombre || !orden) {
            show_alerta('faltan datos importantes ', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('nuevo', 'espacio');
        formData.append('id', id);
        formData.append('id_formacion', id_formacion);
        formData.append('nombre', nombre);
        formData.append('orden', orden);
        formData.append('dictado', dictado);
        formData.append('horas', horas);
        formData.append('correspondencia', correspondencia);

        if (imagen) {
            formData.append('imagen', imagen); // 👈 agregamos la imagen
        }

        enviarFormData(formData);
        handleReset();
    }

    const handleReset = () => {
        let formulario = document.getElementById('form');
        if (formulario) formulario.reset();
        setId(0);
        setNombre("");
        setOrden(1);
        setDictado("Estudiantes");
        setHoras(0);
        setCorrespondencia(0);
        setImagen(null);
    };

    return (
        <div className="me-2">
            <form onSubmit={handleSubmint} id='form' className="d-flex flex-column gap-3">
                <input type="hidden" name="id" value={id} readOnly />

                <div className='input-group'>
                    <span className='input-group-text'>Nombre</span>
                    <input type="text" className="form-control"
                        name="nombre"
                        placeholder="Nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                    />
                </div>

                <div className='input-group'>
                    <span className='input-group-text'>Orden</span>
                    <select className="form-select"
                        name="orden"
                        onChange={(e) => setOrden(e.target.value)}
                        value={orden}  >
                            <option value=''>seleccionar</option>
                    {nombreEstructura.includes('Módulo')?( 
                    
                        <option value='M'>Modulo</option>
                    )
                    :
                    (<>
                        <option value='S2'>Sala de 2</option>
                        <option value='S3'>Sala de 3</option>
                        <option value='S4'>Sala de 4</option>
                        <option value='S5'>Sala de 5</option>
                        <option value='1'>1</option>
                        <option value='2'>2</option>
                        <option value='3'>3</option>
                        <option value='4'>4</option>
                        <option value='5'>5</option>
                        <option value='6'>6</option>
                        <option value='In'>Institucional</option>
                    </>)
                    }
                    </select>
                </div>

                <div className='input-group'>
                    <span className='input-group-text'>Dictado</span>
                    <select className="form-select"
                        name="dictado"
                        onChange={(e) => setDictado(e.target.value)}
                        value={dictado} >
                        <option value='Estudiantes'>Estudiantes</option>
                        <option value='Docentes'>Docentes</option>
                    </select>
                </div>

                <div className='input-group'>
                    <span className='input-group-text'>Horas Semanales</span>
                    <input type="number" className="form-control"
                        name="horas"
                        onChange={(e) => setHoras(e.target.value)}
                        value={horas}
                    />
                </div>

                <div className='input-group'>
                    <span className='input-group-text'>Correspondencia con:</span>
                    <select className="form-select"
                        name="Correspondencia"
                        onChange={(e) => setCorrespondencia(e.target.value)}
                        value={correspondencia} >
                        <option value={0}>Sin correspondencia</option>
                        {espacios.map(e =>
                            <option key={e.id} value={e.id}>{e.nombre_espacio}</option>
                        )}
                    </select>
                </div>

                {/* campo para imagen */}
                <div className='input-group'>
                    <span className='input-group-text'>Imagen</span>
                    <input 
                    type="file" 
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files[0];
                        setImagen(file);
                        if (file) {
                            setPreview(URL.createObjectURL(file)); // 👈 genera miniatura
                        } else {
                            setPreview(null);
                        }
                    }}
                    />
                </div>
                {preview && (
                    <div className="text-center mt-2">
                        <img 
                        src={preview} 
                        alt="Preview" 
                        className="img-thumbnail rounded-4" 
                        style={{ width: "120px", height: "120px", objectFit: "cover" }} 
                        />
                    </div>
                )}


                <hr className="my-4" />
                <div className="text-center">
                    <button type='submit' className="btn btn-success m-1">Guardar</button>
                    <button type='reset' className="btn btn-primary  m-1" onClick={handleReset}>Limpiar</button>
                    <button type="button" id='btnCerrar' className="btn btn-secondary  m-1" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </form>
        </div>
    );
}
export default EspacioCrudForm;
