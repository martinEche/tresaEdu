import './css/Aulas.css';
import { useState, useEffect } from "react";
import axios from 'axios';
import CONFIG from '../../config';

const URL  = `${CONFIG.API_URL}/operarClases.php`;

function ClaseMaterialesForm({id_clase, setEditaMaterial, enviarSolicitud}) {
    const [repositorio, setRepositorio] = useState(true);
    const [dispositivo, setDispositivo] = useState(false);
    const [enlace, setEnlace] = useState(false);
    
    const [form, setForm] = useState({propio:'',archivo:'', link:'', nombre:''});
 
    const [propio, setPropio] = useState("");
    const [files, setFiles] = useState([]);
    const [link, setLink] = useState("");
    const [nombre, setNombre] = useState("");
 
    const [visible, setVisible] = useState(false);
    const [Materiales, setMateriales] = useState([]);

    const loggeduserId =localStorage.getItem('loggedUserId');

    const data= {
        'id_usuario' : loggeduserId,
        'id_clase' : id_clase,
        'modo': 'buscarMaterialUsuario'
    }
    useEffect(() => {
        buscaMaterialUsuario(data);
    }, []);

    const buscaMaterialUsuario =  (d) =>{
        setVisible(true);
        axios.post(URL, d)
        .then(res =>{
            if(!res.data.error){   
                setMateriales(res.data)
            }else{
                setMateriales([]);
            }
            setVisible(false);           
        })
        .catch(err=>{
            console.log(err);
        })   
    }

    const selector=(valor)=>{
        switch (valor) {
            case 'repositorio':
                setRepositorio(true);
                setDispositivo(false);
                setEnlace(false)
                break;
            case 'dispositivo':
                setRepositorio(false);
                setDispositivo(true);
                setEnlace(false)
                break;
            case 'enlace':
                setRepositorio(false);
                setDispositivo(false);
                setEnlace(true)
                break;                  
          }
    }
    const handleChange =(e) => {
        if(e.target.name=="archivo"){
            //console.log(e.target.name);
            setForm({
                ...form,
                    [e.target.name]: e.target.files    
            })
    
        }else{
            setForm({
                ...form,
                    [e.target.name]: e.target.value    
            })    
        }
    }
    const handleSubmit = (e) =>{
        e.preventDefault();
        const formData = new FormData();
        formData.append('nuevo', 'MaterialPoner');
        formData.append('id_clase', id_clase);
        formData.append('id_usuario', loggeduserId);
         
        if(repositorio){
            formData.append('tipo', 'repositorio');
            let valor=propio.split(';');
         //   console.log('id:'+valor[0]);
          //  console.log('nombre:'+valor[1]);
            formData.append('id_material', valor[0]);
            formData.append('nombre', valor[1]);
        }
        if(dispositivo){
            console.log(files);
            formData.append('tipo', 'dispositivo');
            files.forEach((file, index) => {
                formData.append(`file${index}`, file);
              });
            formData.append('nombre', nombre);
            formData.append('usuario', loggeduserId);
            

        }
        if(enlace){
            formData.append('tipo', 'enlace');
            formData.append('link', link);
            formData.append('nombre', nombre);
            formData.append('usuario', loggeduserId);
        }
        enviarSolicitud("POST",formData);
        setEditaMaterial(false);
        
    }
    return (    
        <>
            <form className='text-center' onSubmit={handleSubmit}>
                <div className="material-form-selector">
                    <input className="btn-check" type="radio" name="options-base" id="opcion1" autoComplete="off" defaultChecked={`${repositorio?'checked':''}`} onClick={()=>selector('repositorio')} />
                    <label className="btn" htmlFor="opcion1"><i className="fa-solid fa-share-nodes"></i> Mi repositorio</label>
                    
                    <input className="btn-check" type="radio" name="options-base" id="opcion2" autoComplete="off" onClick={()=>selector('dispositivo')} />
                    <label className="btn m-1" htmlFor="opcion2"><i className="fa-solid fa-upload"></i> Mi dispositivo</label>
               
                    <input className="btn-check" type="radio" name="options-base" id="opcion3" autoComplete="off" onClick={()=>selector('enlace')} />
                    <label className="btn" htmlFor="opcion3"><i className="fa-solid fa-link"></i> Enlace</label>
                </div>
                <div className="mb-3">
                    {repositorio &&
                    <select className="form-select" aria-label="Default select example" 
                    name="propio" defaultValue={propio} value={propio} 
                    onChange={(e) => setPropio(e.target.value)} required>
                        <option ></option>
                        {Materiales.map((m)=>(
                        <option key={m.id} defaultValue={`${m.id};${m.nombre_archivo}`} value={`${m.id};${m.nombre_archivo}`}>{`${m.nombre_archivo}(${m.tipo})`}</option>
                        ))}
                    </select>
                    }
                    {dispositivo && <>
                    <input type="file" 
                    className="form-control form-control-sm" 
                    id="file" name="file" 
                    multiple onChange={(e) => setFiles([...e.target.files])}
                    defaultValue={files} 
                    required />
                    <input type="text" className="form-control form-control-sm" 
                    id="nombre" name="nombre" placeholder="nombre a mostrar" 
                    defaultValue={nombre} onChange={(e) => setNombre(e.target.value)} required />
                    </>}
                    {enlace && <>
                    <input type="text" className="form-control form-control-sm" 
                    id="link" name="link" placeholder="https:// " 
                    defaultValue={link} onChange={(e) => setLink(e.target.value)} required />
                    <input type="text" className="form-control form-control-sm" 
                    id="nombre" name="nombre" placeholder="nombre a mostrar" 
                    defaultValue={nombre}  onChange={(e) => setNombre(e.target.value)} required />
                    </>}
                </div>
              
                <button type="submit" className="btn btn-success btn-sm">agregar el recurso a mi repositorio y a la clase</button>
            </form>
            <hr />
        </>
     );
}

export default ClaseMaterialesForm;