function ActividadForm({ datoActividad, setDatoActividad, idMC, handleSubmit, setVerFormularioActividad }) {
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setDatoActividad(prevData => ({ ...prevData, [name]: value }));
    };
    const handleVolver= () =>{
        setVerFormularioActividad(false);
        setDatoActividad({
            id:null,
            id_curso: idMC,
            titulo: '',
            desarrollo: '',
            forma_presentacion: '',
            tipo_trabajo: 'grupal',
            fecha_entrega: '',
            material:'',
            adjunto:'',
            fecha_creacion:'',
            creado_por:''
        })
    }
    return ( 
        <>
        <div className="card p-4 my-2">
            <div className="row">
                <div className="col-12">
                    <form onSubmit={handleSubmit}>
                        <input type="hidden" className="form-control" id="id_curso" value={datoActividad.id_curso} name="idClaseTrabajo" />
                        <input type="hidden" className="form-control" id="id" value={datoActividad.id} name="idTrabajo" />
                        <input type="hidden" className="form-control" id="material" value={datoActividad.material} name="material" />
                        <h5>Actividad</h5>
                        <div className="form-group row">
                            <div className="col-sm-10">
                                <input type="text" className="form-control" id="titulo" placeholder="Titulo de la actividad" 
                                value={datoActividad.titulo} 
                                name="titulo" 
                                onChange={handleChange} />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label className="small" htmlFor="desarrollo">descripción: </label>
                            <textarea className="form-control " id="desarrollo" rows="4"  value={datoActividad.desarrollo} name="desarrollo" onChange={handleChange}></textarea>
                        </div>
                        <div className="form-group">
                            <label className="small" htmlFor="forma_presentacion">Detalles de la presentación</label>
                            <textarea className="form-control form-control-sm" id="forma_presentacion" name="forma_presentacion" rows="2" value={datoActividad.forma_presentacion} onChange={handleChange}></textarea>
                        </div>
                        <div className="form-check form-check-inline my-3">
                            <input className="form-check-input-sm" type="radio" name="tipo_trabajo" id="RadiosTipo1" value="individual" checked={datoActividad.tipo_trabajo == 'individual'} onChange={handleChange} />
                            <label className="form-check-label small" htmlFor="RadiosTipo1"> Trabajo individual</label>
                        </div>
                        <div className="form-check form-check-inline my-3">
                            <input className="form-check-input-sm" type="radio" name="tipo_trabajo" id="RadiosTipo2" value="grupal" checked={datoActividad.tipo_trabajo === 'grupal'} onChange={handleChange} />
                            <label className="form-check-label small" htmlFor="RadiosTipo2"> Trabajo Grupal</label>
                        </div>
                        <div className="row g-2 align-items-center mb-1">
                            <div className="col-auto">
                                <label htmlFor="fechaEntrega" className="col-form-label">Fecha de entrega:</label>
                            </div>
                            <div className="col-auto">
                                <input type="datetime-local" className="form-control-sm" id="fecha_entrega" value={datoActividad.fecha_entrega} name="fecha_entrega" onChange={handleChange} />
                            </div>
                        </div>

                        <div className="row g-2 align-items-center mb-1">
                            <div className="col-auto">
                                <label htmlFor="fechaEntrega" className="col-form-label"><i className="fa-solid fa-paperclip"></i></label>
                            </div>
                            <div className="col-auto">
                                <input type="file" className="form-control-sm" id="archivo_actividad" name="archivo" onChange={handleChange} />
                            </div>
                        </div>

                        <div className="d-flex justify-content-center mt-2">
                            <button type="submit" className="btn btn-success me-2">Guardar Registro</button>
                            <button type="button" className="btn btn-secondary" onClick={()=>handleVolver()}>Cerrar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        </>
    );
}

export default ActividadForm;