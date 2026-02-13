'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

interface Stats {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    totalProducts: number;
    todayOrders: number;
    todayRevenue: number;
}

interface RecentOrder {
    id: string;
    customer_name: string;
    customer_email: string;
    product_name: string;
    total: number;
    status: string;
    created_at: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats>({
        totalOrders: 0, totalRevenue: 0, pendingOrders: 0,
        totalProducts: 0, todayOrders: 0, todayRevenue: 0,
    });
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

    useEffect(() => {
        // Check auth
        if (typeof window !== 'undefined' && !localStorage.getItem('admin_auth')) {
            router.push('/admin/login');
            return;
        }

        async function fetchData() {
            try {
                const res = await fetch('/api/admin/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data.stats);
                    setRecentOrders(data.recentOrders);
                }
            } catch {
                // Demo mode
            }
        }
        fetchData();
    }, [router]);


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
                        <h1 className="admin-title">Dashboard</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                            Visão geral da loja
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="admin-stats">
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Vendas Hoje</span>
                            <span className="stat-card-icon">📈</span>
                        </div>
                        <div className="stat-card-value">{stats.todayOrders}</div>
                        <div className="stat-card-change positive">+12% vs ontem</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Receita Total</span>
                            <span className="stat-card-icon">💰</span>
                        </div>
                        <div className="stat-card-value" style={{ color: 'var(--accent-gold)' }}>
                            R$ {stats.totalRevenue.toFixed(2)}
                        </div>
                        <div className="stat-card-change positive">+8% vs semana passada</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">FEE (2%)</span>
                            <span className="stat-card-icon">📉</span>
                        </div>
                        <div className="stat-card-value" style={{ color: 'var(--text-muted)' }}>
                            R$ {(stats.totalRevenue * 0.02).toFixed(2)}
                        </div>
                        <div className="stat-card-change">Taxa administrativa</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Pedidos Pendentes</span>
                            <span className="stat-card-icon">⏳</span>
                        </div>
                        <div className="stat-card-value" style={{ color: 'var(--warning)' }}>
                            {stats.pendingOrders}
                        </div>
                        <div className="stat-card-change">Aguardando pagamento</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Total de Produtos</span>
                            <span className="stat-card-icon">📦</span>
                        </div>
                        <div className="stat-card-value">{stats.totalProducts}</div>
                        <div className="stat-card-change">{stats.totalOrders} pedidos total</div>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="admin-table-wrapper">
                    <div className="admin-table-header">
                        <span className="admin-table-title">Últimos Pedidos</span>
                        <button className="btn btn-secondary btn-sm" onClick={() => router.push('/admin/pedidos')}>
                            Ver todos
                        </button>
                    </div>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Produto</th>
                                <th>Valor</th>
                                <th>Status</th>
                                <th>Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map(order => (
                                <tr key={order.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.customer_email}</div>
                                    </td>
                                    <td>{order.product_name}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>
                                        R$ {order.total.toFixed(2)}
                                    </td>
                                    <td>{getStatusBadge(order.status)}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
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
