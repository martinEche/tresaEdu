import './css/Usuarios.css';
import { useState, useEffect } from "react";

function PerfilForm({perfil, actualizarData, previewFoto}) {
    const [form, setForm] = useState(perfil);

    const handleChange =(e) => {
      //  console.log(e.target.name+':'+ e.target.files )
        if(e.target.name=='foto'){
            previewFoto(e);
            setForm({
                ...form,
                    [e.target.name]: e.target.files[0]    
                })
        }else{
            setForm({
            ...form,
                [e.target.name]: e.target.value    
            })
        }
    }

    const handleSubmint =(e) => {
        e.preventDefault();
        const formData = new FormData();

        formData.append('id', form.id);
        formData.append('nombre',form.nombre);
        formData.append('apellido',form.apellido);
        formData.append('apodo',form.apodo);
        formData.append('fecnac',form.fecnac);
        formData.append('email',form.email);
        formData.append('email2',form.email2 || '');
        formData.append('genero',form.genero);
        formData.append('telefono',form.telefono);
        formData.append('calle',form.calle);
        formData.append('numero',form.numero);
        formData.append('piso',form.piso);
        formData.append('depto',form.depto);
        formData.append('ciudad',form.ciudad);
        formData.append('provincia',form.provincia);    
        formData.append('foto', form.foto);

        //console.log(form);
       // actualizarData(form);
        actualizarData(formData);
      }

    return ( 
        <>
        <form className='form-perfil mx-1' onSubmit={handleSubmint}>
            <input type="hidden" id="id" name="id" defaultValue={form.id} /> 
            
            <div>
                <input type="file" name="foto" id="foto" accept="image/*" onChange={handleChange}/>
                <label className='label-imagen' htmlFor="foto"><i className="fa-solid fa-camera"></i> Seleccionar imagen</label>
            </div>
            <table className='table table-sm table-striped table-hover'>
            <tbody>
                <tr>
                    <th><label htmlFor="apodo" className="col-form-label">Me llaman</label></th>
                    <td><input type="text" className="form-control form-control-sm" id="apodo" name="apodo" defaultValue={form.apodo} onChange={handleChange}  /></td>
                </tr>
                <tr>
                    <th><label htmlFor="nombre" className="col-form-label">Nombre</label></th>
                    <td><input type="text" className="form-control form-control-sm" id="nombre" name="nombre" defaultValue={form.nombre} onChange={handleChange} /></td>
                </tr>
                <tr>
                    <th><label htmlFor="apellido" className="col-form-label">Apellido</label></th>
                    <td><input type="text" className="form-control form-control-sm" id="apellido" name="apellido" defaultValue={form.apellido} onChange={handleChange} /></td>
                </tr>
                <tr>
                    <th><label htmlFor="fecnac" className="col-form-label">Nacimiento</label></th>
                    <td><input type="date" className="form-control form-control-sm" id="fecnac" name="fecnac" defaultValue={form.fecnac} onChange={handleChange} /></td>
                </tr>
                <tr>
                    <th><label htmlFor="email" className="col-form-label">Email Principal</label></th>
                    <td><input type="email" className="form-control form-control-sm" id="email" name="email" defaultValue={form.email} onChange={handleChange}  /></td>
                </tr>
                <tr>
                    <th><label htmlFor="email2" className="col-form-label">Email Alternativo</label></th>
                    <td><input type="email" className="form-control form-control-sm" id="email2" name="email2" defaultValue={form.email2} onChange={handleChange}  /></td>
                </tr>
                <tr>
                    <th><label htmlFor="genero" className="col-form-label">Genero</label></th>
                    <td><input type="text" className="form-control form-control-sm" id="genero" name="genero" defaultValue={form.genero} onChange={handleChange} /></td>
                </tr>
                <tr>
                    <th><label htmlFor="telefono" className="col-form-label">Telefono</label></th>
                    <td><input type="text" className="form-control form-control-sm" id="telefono" name="telefono" defaultValue={form.telefono} onChange={handleChange}  /></td>
                </tr>
                <tr>
                    <th><label htmlFor="calle" className="col-form-label">Calle</label></th>
                    <td>
                        <div className="row">
                            <div className="col-7"><input type="text" className="form-control form-control-sm" id="calle" name="calle" defaultValue={form.calle} onChange={handleChange}  /></div>
                            <div className="col-1"><label htmlFor="numero" className="col-form-label">N°</label></div>
                            <div className="col-4"><input type="number" className="form-control form-control-sm" id="numero" name="numero" defaultValue={form.numero} onChange={handleChange}  /></div>
                        </div> 
                    </td>
                </tr>
                <tr>
                    <th><label htmlFor="piso" className="col-form-label">Piso</label></th>
                    <td>
                    <div className="row">
                            <div className="col-7"><input type="text" className="form-control form-control-sm" id="piso" name="piso" defaultValue={form.piso} onChange={handleChange}  /></div>
                            <div className="col-2"><label htmlFor="depto" className="col-form-label">Dpto</label></div>
                            <div className="col-3"><input type="text" className="form-control form-control-sm" id="depto" name="depto" defaultValue={form.depto} onChange={handleChange}  /></div>
                        </div>                  
                    </td>
                </tr>
                <tr>
                    <th><label htmlFor="ciudad" className="col-form-label">Ciudad</label></th>
                    <td><input type="text" className="form-control form-control-sm" id="ciudad" name="ciudad" defaultValue={form.ciudad} onChange={handleChange}  /></td>
                </tr>
                <tr>
                    <th><label htmlFor="eprovinciamail" className="col-form-label">Provincia</label></th>
                    <td><input type="text" className="form-control form-control-sm" id="provincia" name="provincia" defaultValue={form.provincia} onChange={handleChange} /></td>
                </tr>
            </tbody>
            </table>
  
            <div className='text-center'>
                <button type='submit' className='btn btn-sm btn-success'>Guardar</button>
            </div>
        </form>
        </> 
    );
}

export default PerfilForm;