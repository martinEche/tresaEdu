import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import CONFIG from '../../config';

function ConfiguracionForm({ configuracion, onSave }) {
    const [formValues, setFormValues] = useState(configuracion);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormValues({ ...formValues, [name]: value });
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFormValues({ ...formValues, [name]: files[0] });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        Object.keys(formValues).forEach(key => {
            formData.append(key, formValues[key]);
        });
        onSave(formData);
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Form.Group controlId="nombre">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                    type="text"
                    name="nombre"
                    value={formValues.nombre}
                    onChange={handleChange}
                />
            </Form.Group>
            <Form.Group controlId="sub_titulo">
                <Form.Label>Sub Título</Form.Label>
                <Form.Control
                    type="text"
                    name="sub_titulo"
                    value={formValues.sub_titulo}
                    onChange={handleChange}
                />
            </Form.Group>
            <Form.Group controlId="logo_grande">
                <Form.Label>Logo Barra Lateral</Form.Label>
                <Form.Control
                    type="file"
                    name="logo_grande"
                    onChange={handleFileChange}
                />
            </Form.Group>
            <Form.Group controlId="logo_chico" className="mb-3">
                <Form.Label>Logo Barra superior</Form.Label>
                <Form.Control
                    type="file"
                    name="logo_chico"
                    onChange={handleFileChange}
                />
            </Form.Group>
            <Form.Group controlId="logo_solo" className="mb-3">
                <Form.Label>Logo sobre usuario</Form.Label>
                <Form.Control
                    type="file"
                    name="logo_solo"
                    onChange={handleFileChange}
                />
            </Form.Group>
            <Form.Group controlId="imagen_fondo" className="mb-3">
                <Form.Label>Imagen de Fondo</Form.Label>
                <Form.Control
                    type="file"
                    name="imagen_fondo"
                    onChange={handleFileChange}
                />
            </Form.Group>
            <Form.Group controlId="color_principal">
                <Form.Label>Color Principal</Form.Label>
                <Form.Control
                    type="color"
                    name="color_principal"
                    value={formValues.color_principal}
                    onChange={handleChange}
                />
            </Form.Group>
            <Form.Group controlId="color_secundario">
                <Form.Label>Color Secundario</Form.Label>
                <Form.Control
                    type="color"
                    name="color_secundario"
                    value={formValues.color_secundario}
                    onChange={handleChange}
                />
            </Form.Group>
            <Form.Group controlId="color_terciario">
                <Form.Label>Color Terciario</Form.Label>
                <Form.Control
                    type="color"
                    name="color_terciario"
                    value={formValues.color_terciario}
                    onChange={handleChange}
                />
            </Form.Group>
            <Form.Group  controlId="fondo_barra_superior">
                <Form.Label>Fondo Barra Superior </Form.Label>
                <Form.Control
                    type="color"
                    name="fondo_barra_superior"
                    value={formValues.fondo_barra_superior}
                    onChange={handleChange}
                />
            </Form.Group>
            <Form.Group controlId="color_texto_barra_superior">
                <Form.Label>Color Texto Barra Superior {formValues.color_texto_barra_superior}</Form.Label>
                <Form.Control
                    type="color"
                    name="color_texto_barra_superior"
                    value={formValues.color_texto_barra_superior}
                    onChange={handleChange}
                />
            </Form.Group>
            <Form.Group controlId="fondo_barra_lateral">
                <Form.Label>Fondo Barra Lateral</Form.Label>
                <Form.Control
                    type="color"
                    name="fondo_barra_lateral"
                    value={formValues.fondo_barra_lateral}
                    onChange={handleChange}
                />
            </Form.Group>
            <Form.Group controlId="color_texto_barra_lateral">
                <Form.Label>Color Texto Barra Lateral</Form.Label>
                <Form.Control
                    type="color"
                    name="color_texto_barra_lateral"
                    value={formValues.color_texto_barra_lateral}
                    onChange={handleChange}
                />
            </Form.Group>
            <Form.Group controlId="formato_icono_perfil">
                <Form.Label>Formato Icono Perfil</Form.Label>
                <Form.Control
                    type="text"
                    name="formato_icono_perfil"
                    value={formValues.formato_icono_perfil}
                    onChange={handleChange}
                />
            </Form.Group>
            <Button variant="primary" type="submit" className="mt-3">
                Guardar
            </Button>
        </Form>
    );
}

export default ConfiguracionForm;

