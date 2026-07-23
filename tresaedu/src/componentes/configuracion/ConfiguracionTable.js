import React from 'react';
import { Table } from 'react-bootstrap';
import CONFIG from '../../config';

function ConfiguracionTable({ configuraciones }) {
    const getImgUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('ConfigArchivos')) {
            return `${CONFIG.API_URL}/${path}`;
        }
        return `${CONFIG.BASE_URL}img/${path.replace('../img/', '')}`;
    };

    return (
        <>
        <div className='card my-2 p-4'>
            <h4>Titulo: {configuraciones.nombre}</h4>
            <h6 className='mb-3'>Subtitulo: {configuraciones.sub_titulo}</h6>
            <div className='card p-3 mt-2'>
                <h4>imagenes y logos</h4>
                <div className='row px-3'>
                    <div className='col-md-3 border text-center p-2'><h6 className='fw-bold mb-0'>Logo en Barra Lateral</h6></div>
                    <div className='col-md-3 border text-center p-2'><h6 className='fw-bold mb-0'>Logo en barra superior</h6></div>
                    <div className='col-md-3 border text-center p-2'><h6 className='fw-bold mb-0'>Logo sobre usuario</h6></div>
                    <div className='col-md-3 border text-center p-2'><h6 className='fw-bold mb-0'>Imagen Fondo Login</h6></div>
                </div>
                <div className='row px-3'>
                    <div className='col-md-3 border d-flex justify-content-center align-items-center p-3'>
                        <img src={getImgUrl(configuraciones.logo_grande)} alt="Logo Grande" className="img-fluid" style={{maxHeight: '120px'}} />
                    </div>
                    <div className='col-md-3 border d-flex justify-content-center align-items-center p-3'>
                        <img src={getImgUrl(configuraciones.logo_chico)} alt="Logo Chico" className="img-thumbnail" style={{maxHeight: '120px'}} />
                    </div>
                    <div className='col-md-3 border d-flex justify-content-center align-items-center p-3'>
                        <div className="position-relative mt-2 mb-2" style={{ width: '80px', height: '80px' }}>
                            <div 
                                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow"
                                style={{ backgroundColor: '#0d6efd', width: '100%', height: '100%', fontSize: '32px' }}
                            >
                                LU
                            </div>
                            <img 
                                src={getImgUrl(configuraciones.logo_solo)} 
                                alt="Logo Solo" 
                                className="position-absolute p-0 bg-transparent border-0" 
                                style={{ bottom: '-5px', right: '-10px', width: '45px', height: '45px', objectFit: 'contain' }} 
                            />
                        </div>
                    </div>
                    <div className='col-md-3 border d-flex justify-content-center align-items-center p-3'>
                        <img src={getImgUrl(configuraciones.imagen_fondo)} alt="Fondo" className="img-fluid rounded" style={{maxHeight: '120px'}} />
                    </div>
                </div>
            </div>
            <div className='card p-3 mt-4'>
                <h4>formato de icono perfil</h4>
                <div className="form-check form-switch">
                    <label className="form-check-label" htmlFor='flexSwitchCheckChecked'>Utilizar el formato cuadrado con puntas redondeadas</label>
                    <input className="form-check-input" type="checkbox" readOnly role="switch" id="flexSwitchCheckChecked" checked={configuraciones.formato_icono_perfil==='cuadrado'? 'checked ' :''} disabled/>
                </div>
            </div>
            <div className='card p-3 mt-4'>
                <h6>Configuración de colores</h6> 
                <Table  bordered hover className="mt-3">
                    <thead>
                        <tr>
                        
                            <th className='small text-center'>Color Principal</th>
                            <th className='small text-center'>Color Secundario</th>
                            <th className='small text-center'>Color Terciario</th>
                            <th className='small text-center'>Barra Superior: Fondo</th>
                            <th className='small text-center'>Barra Superior: texto</th>
                            <th className='small text-center'>Barra Lateral: fondo</th>
                            <th className='small text-center'>Barra Lateral: iconos y texto</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className='text-center'>{configuraciones.color_principal}</td>
                            <td className='text-center'>{configuraciones.color_secundario}</td>
                            <td className='text-center'>{configuraciones.color_terciario}</td>
                            <td className='text-center'>{configuraciones.fondo_barra_superior}</td>
                            <td className='text-center'>{configuraciones.color_texto_barra_superior}</td>
                            <td className='text-center'>{configuraciones.fondo_barra_lateral}</td>
                            <td className='text-center'>{configuraciones.color_texto_barra_lateral}</td>
                        </tr>
                        <tr>
                            <td className='text-center' style={{backgroundColor: configuraciones.color_principal}}></td>
                            <td className='text-center' style={{backgroundColor: configuraciones.color_secundario}}></td>
                            <td className='text-center' style={{backgroundColor: configuraciones.color_terciario}}></td>
                            <td className='text-center' colSpan={2} style={{backgroundColor: configuraciones.fondo_barra_superior, color: configuraciones.color_texto_barra_superior}}> Barra Superior</td>
                        
                            <td className='text-center' colSpan={2} style={{backgroundColor: configuraciones.fondo_barra_lateral, color: configuraciones.color_texto_barra_lateral}}><i className="fa-solid fa-sliders"></i> Dashboard</td>
                            
                        </tr>
                    </tbody>
                </Table>
            </div>
        </div>
        
    </>
    );
}

export default ConfiguracionTable;
