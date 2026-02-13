'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';


interface Order {
    id: string;
    customer_name: string;
    customer_email: string;
    customer_whatsapp: string;
    product_name: string;
    total: number;
    status: string;
    created_at: string;
}

export default function AdminOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (typeof window !== 'undefined' && !localStorage.getItem('admin_auth')) {
            router.push('/admin/login');
            return;
        }
        fetchOrders();
    }, [router]);

    async function fetchOrders() {
        try {
            const res = await fetch('/api/admin/orders');
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
                return;
            }
        } catch {
            // fallback
        }
        setOrders([]);
    }

    const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            await fetch('/api/admin/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, status: newStatus }),
            });
        } catch { /* ignore */ }
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid': return <span className="badge badge-success">Pago</span>;
            case 'pending': return <span className="badge badge-gold">Pendente</span>;
            case 'delivered': return <span className="badge badge-success">Entregue</span>;
            case 'cancelled': return <span className="badge badge-danger">Cancelado</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main className="admin-content">
                <div className="admin-header">
                    <div>
                        <h1 className="admin-title">Pedidos</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                            Gerencie e acompanhe os pedidos
                        </p>
                    </div>
                </div>

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {[
                        { value: 'all', label: 'Todos' },
                        { value: 'pending', label: 'Pendentes' },
                        { value: 'paid', label: 'Pagos' },
                        { value: 'delivered', label: 'Entregues' },
                        { value: 'cancelled', label: 'Cancelados' },
                    ].map(tab => (
                        <button
                            key={tab.value}
                            className={`btn btn-sm ${filter === tab.value ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter(tab.value)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Produto</th>
                                <th>Valor</th>
                                <th>Status</th>
                                <th>Data</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.customer_email}</div>
                                        {order.customer_whatsapp && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📱 {order.customer_whatsapp}</div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{order.product_name}</div>
                                        {(order as any).variation_name && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>
                                                {(order as any).variation_name}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>R$ {order.total.toFixed(2)}</td>
                                    <td>{getStatusBadge(order.status)}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                        <br />
                                        <span style={{ fontSize: '0.75rem' }}>
                                            {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            {order.status === 'paid' && (
                                                <button className="btn btn-sm btn-primary" onClick={() => updateStatus(order.id, 'delivered')}>
                                                    Entregar
                                                </button>
                                            )}
                                            {order.status === 'pending' && (
                                                <>
                                                    <button className="btn btn-sm" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)' }} onClick={() => updateStatus(order.id, 'paid')}>
                                                        Confirmar
                                                    </button>
                                                    <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }} onClick={() => updateStatus(order.id, 'cancelled')}>
                                                        Cancelar
                                                    </button>
                                                </>
                                            )}
                                            {(order.status === 'paid' || order.status === 'delivered') && (
                                                <button className="btn btn-sm btn-secondary" title="Reenviar credenciais">
                                                    📧 Reenviar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
