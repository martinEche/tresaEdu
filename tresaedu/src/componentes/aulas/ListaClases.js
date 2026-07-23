import './css/Aulas.css';
import Espera from '../Espera';

function ListaClases({ clases, clase, setClase, visible, editarClase, nuevaClase, editaMaterial, editaActividad, rol, handleNUevo, verAreaForos }) {
    
    const seleccionarClase = (id) => {
        setClase(clases.find((c) => c.id === id));
    }

    return (    
        <div className='row'>
            {(rol === 6 || rol === 5 || rol === 11 || rol === "6" || rol === "5" || rol === "11") &&
            <div className='col-4 col-lg-2 mt-1'>
                    <button 
                    type='button' 
                    className={`btn ${!nuevaClase ? 'btn-primary' : 'btn-secondary'} ${(editarClase || editaMaterial || verAreaForos) ? 'disabled' : ''}`} 
                    onClick={ () => handleNUevo() }
                    >
                        {!nuevaClase ? '+ Clase' : "Cancelar Nuevo"}
                    </button>
            </div>
            }
            <div className='col mt-1 '>
            {!visible && !nuevaClase ?
            <select className='form-select mb-4' 
            onChange={(e) => seleccionarClase(Number(e.target.value))} 
            value={clase?.id || ''}>
                {clases.length === 0 ? (
                    <option value={0}>No hay clases disponibles</option>
                ) : (
                    clases.map((cl) => (
                        <option key={cl.id} value={cl.id} disabled={nuevaClase || editarClase || editaMaterial || editaActividad}>
                            {cl.titulo_corto}
                        </option>
                    ))
                )}
            </select>
            
            : <div className='container m-3'><Espera visible={visible} /></div>
            }
            </div>
        </div>
    );
}

export default ListaClases;
