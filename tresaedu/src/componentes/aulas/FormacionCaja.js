import { Link, useNavigate } from 'react-router-dom';
import './css/Aulas.css';
import CONFIG from '../../config';

function FormacionCaja({ formacion, setVerForm, setDatosFormacion, eliminarFormacion, configuracion }) {
    const Rol = parseInt(localStorage.getItem('loggeduserRolId'));
    const navigate = useNavigate();

    const editar = (f) => {
        //console.log(f.nombre_formacion);
        setDatosFormacion(f);
        setVerForm(true);
    }

    const handleCardClick = () => {
        navigate(`/Formaciones/${formacion.id}`);
    }

    return (
        <div className='card-estructura' onClick={handleCardClick} style={{ cursor: 'pointer' }}>
            <div className='caja-imagen-top'>
                {formacion.caratula != "" ?
                    <img src={`${CONFIG.API_URL}/${formacion.caratula}`} className='card-img-top object-fit-cover' />
                    :
                    <img src={`${CONFIG.API_URL}/img/${configuracion.imagen_fondo}`} className='card-img-top object-fit-cover' />
                }
            </div>
            <div className='caja-cuerpo'>
                <div className='caja-titulo small mt-2 mb-1 mx-0 text-center text-muted'>Estructura Curricular</div>
                <hr className="my-1 text-black-50" />
                <div className='caja-medio text-center my-2'><span className='formacion-texto-nivel fw-bold'> {formacion.nombre_formacion}</span></div>
                <hr className="my-1 mb-3 text-black-50" />
                <div className='text-center caja-botonera mb-2 d-flex justify-content-center align-items-center'>
                    <Link className='btn btn-sm btn-outline-primary me-2' onClick={(e) => e.stopPropagation()} to={`/Formaciones/${formacion.id}`}> {formacion.nivel === 6 || formacion.nivel === 7 ? 'Módulos' : 'Espacios curriculares'}</Link>
                    {(Rol === 1 || Rol === 2) && (
                        <div className="btn-group shadow-sm">
                            <button type='button' className='btn btn-sm btn-outline-secondary' title="Editar" onClick={(e) => { e.stopPropagation(); editar(formacion); }}><i className="fa-solid fa-pencil"></i></button>
                            <button type='button' className='btn btn-sm btn-outline-danger' title="Eliminar" onClick={(e) => { e.stopPropagation(); eliminarFormacion(formacion.id); }} ><i className="fa-solid fa-trash-can"></i></button>
                        </div>
                    )}
                </div>
                <div className='caja-info'></div>
            </div>
        </div>
    );
}

export default FormacionCaja;