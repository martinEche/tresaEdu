import './css/Aulas.css';
import { useState, useRef, useMemo } from "react";
import axios from 'axios';
import CONFIG from '../../config';

import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';
import toolbar from "./toolbar";


function ClaseForm({clase, enviarSolicitud }) {
    const [form, setForm] = useState(clase);
    const idUsuario = localStorage.getItem('loggedUserId');
    
    const quillPresentacion = useRef(null);
    const quillDesarrollo = useRef(null);
    const quillCierre = useRef(null);

    const imageHandler = (quillRef) => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            const formData = new FormData();
            formData.append('image', file);

            try {
                const res = await axios.post(`${CONFIG.API_URL}/subirImagenEditor.php`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                if (res.data && res.data.url) {
                    const quill = quillRef.current.getEditor();
                    const range = quill.getSelection(true);
                    quill.insertEmbed(range.index, 'image', res.data.url);
                }
            } catch (error) {
                console.error("Error al subir imagen:", error);
            }
        };
    };

    const modulesPresentacion = useMemo(() => ({
        toolbar: {
            container: toolbar,
            handlers: {
                image: () => imageHandler(quillPresentacion)
            }
        }
    }), []);

    const modulesDesarrollo = useMemo(() => ({
        toolbar: {
            container: toolbar,
            handlers: {
                image: () => imageHandler(quillDesarrollo)
            }
        }
    }), []);

    const modulesCierre = useMemo(() => ({
        toolbar: {
            container: toolbar,
            handlers: {
                image: () => imageHandler(quillCierre)
            }
        }
    }), []);

    const handleChange =(e) => {
        setForm({
            ...form,
                [e.target.name]: e.target.value    
        })
    }
    const handleChangePresentacion = (value) => {
        setForm(prev => ({ ...prev, presentacion: value }));
    };

    const handleChangeDesarrollo = (value) => {
    setForm(prev => ({ ...prev, desarrollo: value }));
    };

    const handleChangeCierre = (value) => {
    setForm(prev => ({ ...prev, cierre: value }));
    };

    const handleSubmint =(e) => {
        e.preventDefault();
        //console.log("form.id:"+form.id);
        //console.log("desarrollo:"+form.desarrollo);
        const formData = new FormData();
        formData.append('id', form.id);
        formData.append('id_curso', form.id_curso);
        formData.append('id_curso_grupo', form.id_curso_grupo);
        formData.append('titulo_corto', form.titulo_corto);
        formData.append('tema', form.tema);
        formData.append('presentacion', form.presentacion);
        formData.append('desarrollo', form.desarrollo);
        formData.append('cierre', form.cierre);
        formData.append('creado_por', idUsuario);
        if(form.id===null){
            formData.append('nuevo', 'SI');
        }else{
            formData.append('nuevo', 'NO');
        }
        enviarSolicitud("POST",formData); 
    }

    return (    
        <>
        <div className='alert alert-info'>
            Luego de completar la información de la clase podrá adicionar material de lectura con archivos externos y podrá agregar actividades y cuestionarios a la clase. también crear un foro de debate.
        </div>
        <form id='form1' className='form-clase ' onSubmit={handleSubmint} >
            <input type="hidden" id="id" name="id" defaultValue={form.id} /> 
            <input type="hidden" id="id_curso" name="id_curso" defaultValue={form.id_curso} /> 

            <div className="mb-3 row">
                <label htmlFor="titulo_corto" className="col-sm-1 col-form-label">Titulo</label>
                <div className="col-sm-11">
                    <input 
                    type="text" 
                    className="form-control" 
                    id="titulo_corto" 
                    name='titulo_corto' 
                    value={form.titulo_corto || ""}
                    onChange={handleChange}
                    />
                </div>
            </div>
            <div className="mb-3 row">
                <label htmlFor="tema" className="col-sm-1 col-form-label">Tema</label>
                <div className="col-sm-11">
                    <input type="text" className="form-control" id="tema" name='tema' defaultValue={form.tema} onChange={handleChange}/>
                </div>
            </div>
            <div className="mb-3">
                <label htmlFor="presentacion" className="form-label">Presentación de la clase</label>
                <ReactQuill  
                    ref={quillPresentacion}
                    modules={modulesPresentacion} 
                    theme="snow" 
                    placeholder={"escribir aqui..."}
                    value={form.presentacion} 
                    onChange={handleChangePresentacion} />
                
            </div>
            <div className="mb-3">
                <label htmlFor="presentacion" className="form-label">Desarrollo de la clase</label>
                <ReactQuill  
                    ref={quillDesarrollo}
                    modules={modulesDesarrollo} 
                    theme="snow" 
                    placeholder={"escribir aqui..."}
                    value={form.desarrollo} 
                    onChange={handleChangeDesarrollo} />
                
            </div>
            <div className="mb-3">
                <label htmlFor="presentacion" className="form-label">Cierre de la clase</label>
                <ReactQuill  
                    ref={quillCierre}
                    modules={modulesCierre} 
                    theme="snow" 
                    placeholder={"escribir aqui..."}
                    value={form.cierre || ""}
                    onChange={handleChangeCierre} />
                
            </div>
            <button type='submit' className='btn btn-sm btn-success m-1' >Guardar y publicas la clase</button>
        </form>
        </>
     );
}

export default ClaseForm;