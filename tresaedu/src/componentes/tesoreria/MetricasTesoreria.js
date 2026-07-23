import React from 'react';

function MetricasTesoreria({ metricas }) {
    if (!metricas) {
        return <div className="text-center py-3">Cargando métricas...</div>;
    }

    const {
        facturado_total = 0,
        cobrado_total = 0,
        pendiente_total = 0,
        vencido_total = 0,
        total_cuotas = 0,
        cuotas_pagadas = 0,
        cuotas_vencidas = 0
    } = metricas;

    // Calcular tasas e índices de cumplimiento
    const totalFacturado = parseFloat(facturado_total);
    const totalCobrado = parseFloat(cobrado_total);
    const tasaCumplimiento = totalFacturado > 0 ? ((totalCobrado / totalFacturado) * 100).toFixed(1) : "0.0";

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
    };

    return (
        <div className="mb-4">
            <h4 className="mb-3 text-muted">Resumen Financiero</h4>
            <div className="row g-3 mb-4">
                {/* Facturado Total */}
                <div className="col-12 col-md-3">
                    <div className="card shadow-sm border-0 bg-primary bg-gradient text-white h-100 p-3 rounded-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <h6 className="text-uppercase text-white-50 small mb-1">Total Facturado</h6>
                                <h4 className="mb-0 fw-bold">{formatCurrency(totalFacturado)}</h4>
                            </div>
                            <div className="fs-3 opacity-50">
                                <i className="fa-solid fa-file-invoice-dollar"></i>
                            </div>
                        </div>
                        <div className="mt-2 small text-white-50">
                            {total_cuotas} cuotas generadas en total
                        </div>
                    </div>
                </div>

                {/* Cobrado Total */}
                <div className="col-12 col-md-3">
                    <div className="card shadow-sm border-0 bg-success bg-gradient text-white h-100 p-3 rounded-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <h6 className="text-uppercase text-white-50 small mb-1">Total Cobrado</h6>
                                <h4 className="mb-0 fw-bold">{formatCurrency(totalCobrado)}</h4>
                            </div>
                            <div className="fs-3 opacity-50">
                                <i className="fa-solid fa-circle-check"></i>
                            </div>
                        </div>
                        <div className="mt-2 small text-white-50">
                            {cuotas_pagadas} cuotas cobradas
                        </div>
                    </div>
                </div>

                {/* Pendiente Vigente */}
                <div className="col-12 col-md-3">
                    <div className="card shadow-sm border-0 bg-warning bg-gradient text-dark h-100 p-3 rounded-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <h6 className="text-uppercase text-dark-50 small mb-1">Pendiente Vigente</h6>
                                <h4 className="mb-0 fw-bold">{formatCurrency(pendiente_total)}</h4>
                            </div>
                            <div className="fs-3 opacity-50">
                                <i className="fa-solid fa-clock"></i>
                            </div>
                        </div>
                        <div className="mt-2 small text-dark-50">
                            Cuotas pendientes sin vencer
                        </div>
                    </div>
                </div>

                {/* Vencido (Mora) */}
                <div className="col-12 col-md-3">
                    <div className="card shadow-sm border-0 bg-danger bg-gradient text-white h-100 p-3 rounded-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <h6 className="text-uppercase text-white-50 small mb-1">Deuda Vencida (Mora)</h6>
                                <h4 className="mb-0 fw-bold">{formatCurrency(vencido_total)}</h4>
                            </div>
                            <div className="fs-3 opacity-50">
                                <i className="fa-solid fa-triangle-exclamation"></i>
                            </div>
                        </div>
                        <div className="mt-2 small text-white-50">
                            {cuotas_vencidas} cuotas impagas vencidas
                        </div>
                    </div>
                </div>
            </div>

            {/* Progreso de Recaudación */}
            <div className="card shadow-sm border-0 p-3 rounded-3 mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-semibold text-muted">Progreso de Recaudación</span>
                    <span className="badge bg-success bg-opacity-10 text-success fw-bold">{tasaCumplimiento}% Cobrado</span>
                </div>
                <div className="progress rounded-pill" style={{ height: '12px' }}>
                    <div 
                        className="progress-bar bg-success progress-bar-striped progress-bar-animated" 
                        role="progressbar" 
                        style={{ width: `${tasaCumplimiento}%` }} 
                        aria-valuenow={tasaCumplimiento} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                    ></div>
                </div>
            </div>
        </div>
    );
}

export default MetricasTesoreria;
