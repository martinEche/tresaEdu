import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { show_alerta } from '../../funciones.js';
import CONFIG from '../../config.js';

const URL_CUOTAS = `${CONFIG.API_URL}/operarCuotas.php`;

function RegistroPagoModal({ cuotas, studentName, onSaved, onClose }) {
    const [descuento, setDescuento] = useState(0);
    const [recargo, setRecargo] = useState(0);
    const [metodo, setMetodo] = useState('efectivo');
    const [comprobante, setComprobante] = useState(null);
    const [cargando, setCargando] = useState(false);

    const subtotal = cuotas.reduce((acc, cuota) => {
        return acc + (parseFloat(cuota.monto_original) + (parseFloat(cuota.monto_original) * parseFloat(cuota.impuestos) / 100));
    }, 0);
    const [montoFinal, setMontoFinal] = useState(subtotal);

    useEffect(() => {
        const desc = parseFloat(descuento) || 0;
        const rec = parseFloat(recargo) || 0;
        setMontoFinal(subtotal - desc + rec);
    }, [descuento, recargo, subtotal]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setComprobante(e.target.files[0]);
        } else {
            setComprobante(null);
        }
    };

    const handleRegistrar = async (e) => {
        e.preventDefault();
        setCargando(true);

        try {
            const descIndividual = (parseFloat(descuento) || 0) / cuotas.length;
            const recIndividual = (parseFloat(recargo) || 0) / cuotas.length;

            for (const cuota of cuotas) {
                const formData = new FormData();
                formData.append('accion', 'registrar_pago');
                formData.append('id_cuota', cuota.id);
                formData.append('descuento', descIndividual.toFixed(2));
                formData.append('recargo', recIndividual.toFixed(2));
                formData.append('metodo', metodo);
                if (comprobante) {
                    formData.append('comprobante', comprobante);
                }

                const res = await axios.post(URL_CUOTAS, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (!res.data.success) {
                    throw new Error(res.data.mensaje || 'Error al procesar cuota ID ' + cuota.id);
                }
            }

            show_alerta('Cobro/s registrado/s exitosamente.', 'success');
            onSaved();
        } catch (err) {
            console.error(err);
            show_alerta(err.message || 'Error al intentar registrar el pago en el servidor.', 'error');
        } finally {
            setCargando(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
    };

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div className="modal-header bg-success text-white py-3">
                        <h5 className="modal-title fw-bold"><i className="fa-solid fa-money-bill-transfer me-2"></i>Registrar Pago de Cuota</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
                    </div>
                    <form onSubmit={handleRegistrar}>
                        <div className="modal-body p-4">
                            <div className="mb-3 bg-light p-3 rounded-3 small">
                                <div><strong>Estudiante:</strong> {studentName}</div>
                                <div><strong>Cuotas a cobrar:</strong> {cuotas.length} cuotas seleccionadas</div>
                                <div><strong>Monto Neto Total:</strong> {formatCurrency(cuotas.reduce((a,c) => a + parseFloat(c.monto_original), 0))}</div>
                                <div className="mt-1 pt-1 border-top text-muted">
                                    <strong>Subtotal con IVA:</strong> {formatCurrency(subtotal)}
                                </div>
                            </div>

                            {/* Descuento */}
                            <div className="mb-3">
                                <label className="form-label fw-semibold">Descuento ($)</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light"><i className="fa-solid fa-tags text-success"></i></span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="form-control"
                                        placeholder="Ej: 500.00"
                                        value={descuento}
                                        onChange={e => setDescuento(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Recargo */}
                            <div className="mb-3">
                                <label className="form-label fw-semibold">Recargo ($)</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light"><i className="fa-solid fa-triangle-exclamation text-danger"></i></span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="form-control"
                                        placeholder="Ej: 300.00"
                                        value={recargo}
                                        onChange={e => setRecargo(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Método de pago */}
                            <div className="mb-3">
                                <label className="form-label fw-semibold">Método de Pago</label>
                                <select 
                                    className="form-select border-2" 
                                    value={metodo} 
                                    onChange={e => setMetodo(e.target.value)}
                                    required
                                >
                                    <option value="efectivo">Efectivo</option>
                                    <option value="transferencia">Transferencia Bancaria</option>
                                    <option value="mercadopago">MercadoPago</option>
                                </select>
                            </div>

                            {/* Archivo de comprobante */}
                            <div className="mb-4">
                                <label className="form-label fw-semibold">Comprobante de Pago (PDF / Imagen)</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept="image/*,application/pdf"
                                    onChange={handleFileChange}
                                />
                                <div className="form-text text-muted small">
                                    * Opcional. Útil para transferencias bancarias o cobros online.
                                </div>
                            </div>

                            {/* Resumen Final */}
                            <div className="card border-0 bg-success bg-opacity-10 text-success p-3 rounded-3 mb-2 text-center">
                                <span className="small text-uppercase fw-semibold">Monto Final Cobrado</span>
                                <h3 className="fw-bold mb-0">{formatCurrency(montoFinal)}</h3>
                            </div>
                        </div>
                        <div className="modal-footer bg-light border-top-0 py-3 d-flex justify-content-end gap-2">
                            <button type="button" className="btn btn-outline-secondary rounded-3" onClick={onClose} disabled={cargando}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-success bg-gradient rounded-3 px-4 fw-semibold" disabled={cargando || montoFinal <= 0}>
                                {cargando ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Registrando...
                                    </>
                                ) : (
                                    <><i className="fa-solid fa-circle-check me-1"></i> Confirmar Cobro</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default RegistroPagoModal;
