import { useState, useEffect } from "react";
import { show_alerta } from '../../funciones.js';
import axios from "axios";
import CONFIG from '../../config';
import { set } from "firebase/database";

const URL_TUTORES = `${CONFIG.API_URL}/operarTutores.php`;

function TutorCrudForm({ idEstudiante, mostrarFormulafio, setMostrarFormulario, datoAEditar }) {

    const inicialForm = {
        id: null,
        documento: "",
        nombre: "",
        apellido: "",
        documento: "",
        calle: "",
        numero: "",
        piso: "",
        depto: "",
        ciudad: "",
        provincia: "",
        telefono: "",
        email: "",
        idEstudiante: idEstudiante
    };

    const [form, setForm] = useState(inicialForm);
    const [buscando, setBuscando] = useState(false);
    const [encontrado, setEncontrado] = useState(false);

    useEffect(() => {
        if (datoAEditar) {
            setForm(datoAEditar);
        } else {
            setForm(inicialForm);
        }
    }, [datoAEditar])

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmint = (e) => {
        e.preventDefault();

        if (!form.nombre || !form.apellido || !form.documento || !form.telefono) {
            setEncontrado(false);
            show_alerta('faltan datos ', 'error');
            return;
        }
        RegistrarData(form);
        handleReset(e);
        setEncontrado(false);
    }

    const handleReset = (e) => {
        setForm(inicialForm);
        setEncontrado(false);
        //setDatoAEditar(null);
    }

    const RegistrarData = async (data) => {
        try {
            const response = await axios.post(URL_TUTORES, data);
            console.log('datostutor:', response.data);
            if (response.data.success) {
                show_alerta('Tutor creado exitosamente', 'success');
            } else {
                show_alerta('Error al crear el tutor', 'error');
            }
            setForm(inicialForm);
            setEncontrado(false);
            setMostrarFormulario(false);
        } catch (error) {
            console.error('Error al crear el tutor:', error);
            show_alerta('Error al crear el tutor', 'error');
        }
    }

    const buscarPorDocumento = async () => {
        if (!form.documento) return;
        setBuscando(true);
        try {
            const res = await axios.get(`${URL_TUTORES}?documento=${form.documento}`);
            if (res.data && res.data.existe) {
                // 👉 SI EXISTE: completo todo el form
                setForm({
                    ...form,
                    ...res.data.tutor
                });
                //show_alerta('Usuario encontrado', 'success');
                setEncontrado(true);
            } else {
                // 👉 NO EXISTE: limpio datos menos documento
                setForm({
                    ...inicialForm,
                    documento: form.documento,
                    idEstudiante: idEstudiante
                });
                setEncontrado(false);
            }
            setBuscando(false);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="pe-3">
            <h3>Vincular Tutor</h3>
            <form onSubmit={handleSubmint}>

                <input type='hidden' id='id' />
                <div className='input-group m-3'>
                    <span className='input-group-text'><i className='fa-regular fa-id-card'></i></span>
                    <input
                        type="text"
                        className="form-control border rounded-end-3 me-2"
                        name="documento"
                        placeholder="Documento"
                        value={form.documento}
                        onChange={handleChange}
                        onBlur={buscarPorDocumento}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault(); // 🚫 evita submit
                                buscarPorDocumento(); // 🔍 ejecuta búsqueda
                            }
                        }}
                    /><span className="text-danger small">(*)</span>
                </div>
                {buscando ?
                    <small className="text-muted">Buscando...</small>
                    :
                    encontrado && <small className="alert alert-success text-success mx-3 my-1">El usuario está registrado</small>}
                <div className='input-group m-3'>
                    <span className='input-group-text'><i className='fa-solid fa-user'></i></span>
                    <input type="text" className="form-control border rounded-end-3 me-2"
                        name="nombre"
                        placeholder="Nombre"
                        onChange={handleChange}
                        value={form.nombre}
                    /><span className="text-danger small">(*)</span>
                </div>
                <div className='input-group m-3'>
                    <span className='input-group-text'><i className='fa-solid fa-user'></i></span>
                    <input type="text" className="form-control border rounded-end-3 me-2"
                        name="apellido"
                        placeholder="Apellido"
                        onChange={handleChange}
                        value={form.apellido}
                    /><span className="text-danger small">(*)</span>
                </div>

                <div className='input-group m-3'>
                    <span className='input-group-text'><i className='fa-regular fa-id-card'></i></span>
                    <input type="text" className="form-control border rounded-end-3 me-2"
                        name="calle"
                        placeholder="Calle"
                        onChange={handleChange}
                        value={form.calle}
                    />
                </div>
                <div className='input-group m-3'>
                    <span className='input-group-text'><i className='fa-regular fa-id-card'></i></span>
                    <input type="text" className="form-control border rounded-end-3 me-2"
                        name="numero"
                        placeholder="Número"
                        onChange={handleChange}
                        value={form.numero}
                    />
                </div>
                <div className='input-group m-3'>
                    <span className='input-group-text'><i className='fa-regular fa-id-card'></i></span>
                    <input type="text" className="form-control border rounded-end-3 me-2"
                        name="piso"
                        placeholder="Piso"
                        onChange={handleChange}
                        value={form.piso}
                    />
                </div>
                <div className='input-group m-3'>
                    <span className='input-group-text'><i className='fa-regular fa-id-card'></i></span>
                    <input type="text" className="form-control border rounded-end-3 me-2"
                        name="depto"
                        placeholder="Departamento"
                        onChange={handleChange}
                        value={form.depto}
                    />
                </div>
                <div className='input-group m-3'>
                    <span className='input-group-text'><i className='fa-regular fa-id-card'></i></span>
                    <input type="text" className="form-control border rounded-end-3 me-2"
                        name="ciudad"
                        placeholder="Ciudad"
                        onChange={handleChange}
                        value={form.ciudad}
                    />
                </div>
                <div className='input-group m-3'>
                    <span className='input-group-text'><i className='fa-regular fa-id-card'></i></span>
                    <input type="text" className="form-control border rounded-end-3 me-2"
                        name="provincia"
                        placeholder="Provincia"
                        onChange={handleChange}
                        value={form.provincia}
                    />
                </div>
                <div className='input-group m-3'>
                    <span className='input-group-text'><i className='fa-regular fa-id-card'></i></span>
                    <input type="text" className="form-control border rounded-end-3 me-2"
                        name="telefono"
                        placeholder="Teléfono"
                        onChange={handleChange}
                        value={form.telefono}
                    /><span className="text-danger small">(*)</span>
                </div>
                <div className='input-group m-3'>
                    <span className='input-group-text'><i className='fa-regular fa-id-card'></i></span>
                    <input type="text" className="form-control border rounded-end-3 me-2"
                        name="email"
                        placeholder="Email"
                        onChange={handleChange}
                        value={form.email}
                    /><span className="text-danger small">(*)</span>
                </div>
                <button className="btn btn-success m-1" type="submit"><i className="fa-regular fa-floppy-disk"></i> Guardar</button>
                <input className="btn btn-primary m-1" type="reset" value="Limpiar" onClick={handleReset} />
                <button type='button' className="btn btn-secondary" onClick={() => setMostrarFormulario('')}>Cancel</button>
            </form>
        </div>
    )
};

export default TutorCrudForm;