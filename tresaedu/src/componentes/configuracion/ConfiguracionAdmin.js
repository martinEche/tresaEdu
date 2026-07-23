import React, { useState, useEffect } from 'react';
import { Button, Modal } from 'react-bootstrap';
import ConfiguracionForm from './ConfiguracionForm';
import ConfiguracionTable from './ConfiguracionTable';
import { fetchConfiguracion, guardaConfiguracion } from '../../servicios/configuracionService.js';
import CONFIG from '../../config';

function ConfiguracionAdmin({ acceder, rol }) {
    const [configuracion, setConfiguracion] = useState('');
  
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if(acceder && rol==1){
            obtenerConfiguracion();
        }else{
            
        }
    }, [acceder, rol]);

    async function obtenerConfiguracion() {
        try {
          const data = await fetchConfiguracion();
          setConfiguracion(data);
        } catch (error) {
          console.error('Failed to fetch configuration:', error);
        }
      }

    const handleAddConfig = () => {
        setShowModal(true);
    };


    const handleSaveConfig = (configForm) => {
        guardaConfiguracion(configForm);
        obtenerConfiguracion();
        setShowModal(false);
    };

    

    return (
        <div className="container-principal">
            <h3>Administrar Configuraciones<hr/></h3>
            <div className='row mx-1'><Button variant="primary" onClick={handleAddConfig}>cambiar Configuración</Button></div>
            
            {configuracion!=='' && 
                <ConfiguracionTable configuraciones={configuracion} />
            }
            {/* Modal para agregar o editar configuración */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Editar Configuración </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ConfiguracionForm
                        configuracion={configuracion}
                        onSave={handleSaveConfig}
                    />
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default ConfiguracionAdmin;
