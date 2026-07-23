import { useState, useEffect } from "react";
import { show_alerta } from '../../funciones.js';
import CONFIG from '../../config';
import { set } from "firebase/database";

function FormacionCrudForm({ enviarFormData, setVerForm, datosFormacion, setDatosFormacion }) {
    const [id, setId] = useState("");
    const [nombre, setNombre] = useState("");
    const [resolucionN, setResolucionN] = useState("");
    const [resolucionP, setResolucionP] = useState("");
    const [año, setAño] = useState("");
    const [observacion, setObservacion] = useState("");
    const [tipo, setTipo] = useState(0);
    const [caratulas, setCaratulas] = useState([]);
    const [familia, setFamilia] = useState("");

    useEffect(() => {
        if (datosFormacion == "") {
            setId("");
            setNombre("");
            setResolucionN("");
            setResolucionP("");
            setAño("");
            setTipo("");
            setObservacion("");
            setCaratulas([]);
            setFamilia("");
        } else {
            setId(datosFormacion.id);
            setNombre(datosFormacion.nombre_formacion);
            setResolucionN(datosFormacion.resolucion_N);
            setResolucionP(datosFormacion.resolucion_P);
            setAño(datosFormacion.año);
            setTipo(datosFormacion.nivel);
            document.getElementById('tipo').value = datosFormacion.nivel;
            setObservacion(datosFormacion.ovservacion);
            setCaratulas([]);
            setFamilia(datosFormacion.familia);
            let imagPre = document.getElementById('preview');
            imagPre.src = `${CONFIG.API_URL}/${datosFormacion.caratula}`;
        }
    }, []);

    function handleSubmint(e) {
        e.preventDefault();

        if (!nombre || !año) {
            show_alerta('faltan datos importantes ', 'error');
            return;
        }
        if (tipo === 0) {
            show_alerta('Seleccione un nivel de formacion', 'error');
            return;
        }
        const formData = new FormData();
        formData.append('nuevo', 'formacion');
        formData.append('id', id);
        formData.append('nombre', nombre);
        formData.append('resolucionN', resolucionN);
        formData.append('resolucionP', resolucionP);
        formData.append('año', año);
        formData.append('observacion', observacion);
        formData.append('tipo', tipo); //nivel de formacion
        formData.append('familia', familia);
        caratulas.forEach((caratula, index) => {
            formData.append(`caratula${index}`, caratula);
        });

        enviarFormData(formData);
        handleReset();
    }

    const handleCancelar = () => {
        setVerForm(false);
        //setDatosFormacion("");
    }
    const handleReset = (e) => {
        let formulario = document.getElementById('form');
        formulario.reset();
        setId("");
        setNombre("");
        setResolucionN("");
        setResolucionP("");
        setAño("");
        setTipo("");
        setObservacion("");
        setCaratulas([]);
        setFamilia("");
    }
    const cargarImagen = (e) => {
        setCaratulas([...e.target.files]);
        let previewContainer = document.getElementById('preview-container');
        previewContainer.innerHTML = '';
        let files = e.target.files;
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let reader = new FileReader();

            reader.onload = function (e) {
                let img = document.createElement('img');
                img.src = e.target.result;
                img.style.maxWidth = '200px';
                img.style.maxHeight = '200px';
                previewContainer.appendChild(img);
            }

            reader.readAsDataURL(file);
        }

    }
    return (
        <div className="container me-2">
            <form onSubmit={handleSubmint} id='form' className="d-flex flex-column gap-3">
                <input type="hidden" name="id" id="id" value={id} onChange={(e) => setId(e.target.value)} />
                <div className='input-group'>
                    <span className='input-group-text'>Denominación</span>
                    <input type="text" className="form-control"
                        name="nombre"
                        placeholder="Nombre"
                        onChange={(e) => setNombre(e.target.value)}
                        value={nombre}
                    />
                </div>

                <div className='input-group'>
                    <span className='input-group-text'>Resolución Provincial</span>
                    <input type="text" className="form-control"
                        name="resolución Provincial"
                        onChange={(e) => setResolucionP(e.target.value)}
                        value={resolucionP}
                    />
                </div>

                <div className='input-group'>
                    <span className='input-group-text'>Resolución Nacional</span>
                    <input type="text" className="form-control"
                        name="resolución Nacional"
                        onChange={(e) => setResolucionN(e.target.value)}
                        value={resolucionN}
                    />
                </div>

                <div className='input-group'>
                    <span className='input-group-text'>Año creación</span>
                    <input type="text" className="form-control"
                        name="año"
                        onChange={(e) => setAño(e.target.value)}
                        value={año}
                    />
                </div>

                <div className='input-group'>
                    <span className='input-group-text'>Tipo de formación</span>
                    <select className="form-select" name="tipo" id="tipo"
                        onChange={(e) => setTipo(e.target.value)} >
                        <option value="0">Seleccionar nivel de formación</option>
                        <option value="1">Inicial</option>
                        <option value="2">Primario</option>
                        <option value="3">Secundario</option>
                        <option value="4">Teriario</option>
                        <option value="5">Universitario</option>
                        <option value="6">Formacion Profesional</option>
                        <option value="7">Capacitación</option>
                        <option value="8">Postitulo</option>
                    </select>
                </div>
                <div className='input-group'>
                    <span className='input-group-text'>Familia de incumbencia</span>
                    <select className="form-select" name="familia" id="familia"
                        onChange={(e) => setFamilia(e.target.value)} >
                        <option value="0">Seleccionar familia de incumbencia</option>
                        <option value="Administración">Administración</option>
                        <option value="Informática">Informática</option>
                        <option value="Metalmecanica">Metalmecanica</option>
                        <option value="Madera y muebles">Madera y muebles</option>
                        <option value="Estética">Estética</option>
                    </select>
                </div>
                <div className='form-floating'>
                    <textarea className="form-control mensaje-textarea" rows="10" placeholder="observaciones"
                        id="floatingTextarea2"
                        name="observaciones"
                        onChange={(e) => setObservacion(e.target.value)}
                        value={observacion}
                    ></textarea>
                    <label htmlFor="floatingTextarea2">observacion</label>
                </div>

                <div className="row">
                    <div className="col-9">
                        <div className='input-group'>
                            <span className='input-group-text'><i className="fa-regular fa-image"></i></span>
                            <input type="file" className="form-control"
                                name="caratula" placeholder="adjunto" accept="image/*"
                                multiple onChange={(e) => cargarImagen(e)}
                                defaultValue={caratulas}
                            />
                        </div>
                    </div>
                    <div className="col-2" id="preview-container">
                        <img id="preview" name="preview" src="https://static.vecteezy.com/system/resources/previews/004/141/669/non_2x/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg" width="100px" />
                    </div>
                </div>


                <button className="btn btn-success m-1" type="submit">Guardar</button>
                <button className="btn btn-primary m-1" type="reset" onClick={handleReset}>Limpiar</button>
                <button className="btn btn-secondary m-1" type="button" onClick={() => handleCancelar()}>Cancel</button>
            </form>
        </div>

    );
}

export default FormacionCrudForm;