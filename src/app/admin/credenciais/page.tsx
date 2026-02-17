'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { Credential } from '@/lib/types';

type CredView = Credential & { product?: { name: string } | null; variation?: { name: string } | null };

export default function AdminCredentialsPage() {
    const router = useRouter();
    const [credentials, setCredentials] = useState<CredView[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [groups, setGroups] = useState<string[]>([]);

    // Single add
    const [credType, setCredType] = useState<'email' | 'link'>('email');
    const [newCred, setNewCred] = useState({ group: '', subgroup: '', email: '', password: '', link: '', max_uses: 1 });

    // Bulk add
    const [bulkGroup, setBulkGroup] = useState('');
    const [bulkSubgroup, setBulkSubgroup] = useState('');
    const [bulkText, setBulkText] = useState('');
    const [bulkMaxUses, setBulkMaxUses] = useState(1);

    const [filter, setFilter] = useState('all');
    const [groupFilter, setGroupFilter] = useState('');

    // Edit
    const [editCred, setEditCred] = useState<CredView | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && !localStorage.getItem('admin_auth')) {
            router.push('/admin/login'); return;
        }
        fetchData();
    }, [router]);

    async function fetchData() {
        try {
            const res = await fetch('/api/admin/credentials');
            if (res.ok) {
                const creds = await res.json();
                setCredentials(creds);
                // Extract distinct groups
                const gs = [...new Set(creds.map((c: any) => c.group).filter(Boolean))] as string[];
                setGroups(gs.sort());
            }
        } catch { setCredentials([]); }
    }

    const filtered = credentials
        .filter(c => filter === 'all' ? true : filter === 'available' ? !c.is_used : c.is_used)
        .filter(c => !groupFilter || c.group === groupFilter);

    const handleAddSingle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCred.group.trim()) { alert('Informe o grupo.'); return; }

        const payload: any = { group: newCred.group, subgroup: newCred.subgroup || null, max_uses: newCred.max_uses };
        if (credType === 'email') { payload.email = newCred.email; payload.password = newCred.password; }
        else { payload.link = newCred.link; }

        try {
            await fetch('/api/admin/credentials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } catch { }
        setShowModal(false);
        setNewCred({ group: '', subgroup: '', email: '', password: '', link: '', max_uses: 1 });
        setCredType('email');
        fetchData();
    };

    const handleBulkAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bulkGroup.trim()) { alert('Informe o grupo.'); return; }
        const lines = bulkText.split('\n').filter(l => l.trim());
        for (const line of lines) {
            const [email, password] = line.split(/[;:,|]/).map(s => s.trim());
            if (email && password) {
                try { await fetch('/api/admin/credentials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group: bulkGroup, subgroup: bulkSubgroup || null, email, password, max_uses: bulkMaxUses }) }); } catch { }
            }
        }
        setShowBulkModal(false);
        setBulkGroup(''); setBulkSubgroup(''); setBulkText(''); setBulkMaxUses(1);
        fetchData();
    };

    const deleteCred = async (id: string) => {
        if (!confirm('Excluir esta credencial?')) return;
        try { await fetch(`/api/admin/credentials?id=${id}`, { method: 'DELETE' }); } catch { }
        fetchData();
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editCred) return;
        try {
            await fetch('/api/admin/credentials', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editCred.id,
                    group: editCred.group,
                    subgroup: editCred.subgroup || null,
                    email: editCred.email || null,
                    password: editCred.password || null,
                    link: editCred.link || null,
                    max_uses: editCred.max_uses,
                    current_uses: editCred.current_uses,
                    is_used: editCred.is_used,
                }),
            });
        } catch { }
        setEditCred(null);
        fetchData();
    };

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main className="admin-content">
                <div className="admin-header">
                    <div>
                        <h1 className="admin-title">Credenciais</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                            Pool de contas organizado por grupo e subgrupo
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" onClick={() => setShowBulkModal(true)}>📋 Importar Lote</button>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Adicionar</button>
                    </div>
                </div>

                {/* Stats */}
                <div className="admin-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="stat-card"><div className="stat-card-label">Total</div><div className="stat-card-value">{credentials.length}</div></div>
                    <div className="stat-card"><div className="stat-card-label">Disponíveis</div><div className="stat-card-value" style={{ color: 'var(--success)' }}>{credentials.filter(c => !c.is_used).length}</div></div>
                    <div className="stat-card"><div className="stat-card-label">Esgotadas</div><div className="stat-card-value" style={{ color: 'var(--text-muted)' }}>{credentials.filter(c => c.is_used).length}</div></div>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {['all', 'available', 'used'].map(tab => (
                        <button key={tab} className={`btn btn-sm ${filter === tab ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(tab)}>
                            {tab === 'all' ? 'Todas' : tab === 'available' ? 'Disponíveis' : 'Esgotadas'}
                        </button>
                    ))}
                    <span style={{ margin: '0 8px', color: 'var(--border)' }}>|</span>
                    <select className="form-input" style={{ width: 'auto', minWidth: '160px', height: '34px', fontSize: '0.85rem' }} value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
                        <option value="">Todos os grupos</option>
                        {groups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>

                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead><tr><th>Grupo</th><th>Subgrupo</th><th>Email</th><th>Senha</th><th>Link</th><th>Usos</th><th>Status</th><th>Ação</th></tr></thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c.id}>
                                    <td><strong>{c.group || '-'}</strong></td>
                                    <td>{c.subgroup || '-'}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{c.email || '-'}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{c.password || '-'}</td>
                                    <td style={{ fontSize: '0.75rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {c.link ? <a href={c.link} target="_blank" style={{ color: 'var(--primary)' }}>{c.link}</a> : '-'}
                                    </td>
                                    <td style={{ fontFamily: 'monospace' }}>{c.current_uses || 0}/{c.max_uses || 1}</td>
                                    <td>
                                        <span className={`badge ${c.is_used ? 'badge-danger' : (c.current_uses || 0) > 0 ? 'badge-gold' : 'badge-success'}`}>
                                            {c.is_used ? 'Esgotada' : (c.current_uses || 0) > 0 ? 'Em uso' : 'Disponível'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button className="btn btn-sm" style={{ color: 'var(--accent-gold)', background: 'rgba(229,168,53,0.1)' }} onClick={() => setEditCred({ ...c })} title="Editar">✏️</button>
                                            {!c.is_used && <button className="btn btn-sm" style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)' }} onClick={() => deleteCred(c.id)} title="Excluir">🗑️</button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Single Add Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                            <div className="modal-header">
                                <h3 className="modal-title">Adicionar Credencial</h3>
                                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                            </div>
                            <form onSubmit={handleAddSingle}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Grupo *</label>
                                        <input type="text" className="form-input" required list="group-list" placeholder="Ex: ChatGPT, Netflix" value={newCred.group} onChange={e => setNewCred(p => ({ ...p, group: e.target.value }))} />
                                        <datalist id="group-list">{groups.map(g => <option key={g} value={g} />)}</datalist>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Subgrupo</label>
                                        <input type="text" className="form-input" placeholder="Ex: Individual, Compartilhado" value={newCred.subgroup} onChange={e => setNewCred(p => ({ ...p, subgroup: e.target.value }))} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Máx. Usos</label>
                                    <select className="form-input" value={newCred.max_uses} onChange={e => setNewCred(p => ({ ...p, max_uses: parseInt(e.target.value) }))}>
                                        <option value={1}>1 uso (único)</option>
                                        <option value={2}>2 usos</option>
                                        <option value={3}>3 usos</option>
                                        <option value={5}>5 usos</option>
                                        <option value={10}>10 usos</option>
                                        <option value={20}>20 usos</option>
                                        <option value={50}>50 usos</option>
                                        <option value={999}>Ilimitado (999)</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Tipo</label>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        {(['email', 'link'] as const).map(t => (
                                            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                                <input type="radio" name="ct" value={t} checked={credType === t} onChange={() => setCredType(t)} />
                                                {t === 'email' ? 'Email + Senha' : 'Link'}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {credType === 'email' ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Email *</label>
                                            <input type="text" className="form-input" required placeholder="email@example.com" value={newCred.email} onChange={e => setNewCred(p => ({ ...p, email: e.target.value }))} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Senha *</label>
                                            <input type="text" className="form-input" required placeholder="senha123" value={newCred.password} onChange={e => setNewCred(p => ({ ...p, password: e.target.value }))} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <label className="form-label">Link *</label>
                                        <input type="text" className="form-input" required placeholder="https://..." value={newCred.link} onChange={e => setNewCred(p => ({ ...p, link: e.target.value }))} />
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary">Adicionar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Bulk Modal */}
                {showBulkModal && (
                    <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                            <div className="modal-header">
                                <h3 className="modal-title">Importar em Lote</h3>
                                <button className="modal-close" onClick={() => setShowBulkModal(false)}>✕</button>
                            </div>
                            <form onSubmit={handleBulkAdd}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Grupo *</label>
                                        <input type="text" className="form-input" required list="group-bulk" placeholder="Ex: ChatGPT" value={bulkGroup} onChange={e => setBulkGroup(e.target.value)} />
                                        <datalist id="group-bulk">{groups.map(g => <option key={g} value={g} />)}</datalist>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Subgrupo</label>
                                        <input type="text" className="form-input" placeholder="Ex: Individual" value={bulkSubgroup} onChange={e => setBulkSubgroup(e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Máx. Usos por credencial</label>
                                    <select className="form-input" value={bulkMaxUses} onChange={e => setBulkMaxUses(parseInt(e.target.value))}>
                                        <option value={1}>1 uso (único)</option>
                                        <option value={2}>2 usos</option>
                                        <option value={3}>3 usos</option>
                                        <option value={5}>5 usos</option>
                                        <option value={10}>10 usos</option>
                                        <option value={20}>20 usos</option>
                                        <option value={50}>50 usos</option>
                                        <option value={999}>Ilimitado (999)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Credenciais (email;senha por linha) *</label>
                                    <textarea className="form-input" rows={8} required placeholder={"user1@email.com;senha123\nuser2@email.com;senha456"} value={bulkText} onChange={e => setBulkText(e.target.value)} style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }} />
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Separadores: ; : , |</p>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowBulkModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary">Importar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {editCred && (
                    <div className="modal-overlay" onClick={() => setEditCred(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                            <div className="modal-header">
                                <h3 className="modal-title">Editar Credencial</h3>
                                <button className="modal-close" onClick={() => setEditCred(null)}>✕</button>
                            </div>
                            <form onSubmit={handleEdit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Grupo *</label>
                                        <input type="text" className="form-input" required list="group-edit" value={editCred.group} onChange={e => setEditCred(p => p ? { ...p, group: e.target.value } : p)} />
                                        <datalist id="group-edit">{groups.map(g => <option key={g} value={g} />)}</datalist>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Subgrupo</label>
                                        <input type="text" className="form-input" value={editCred.subgroup || ''} onChange={e => setEditCred(p => p ? { ...p, subgroup: e.target.value } : p)} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input type="text" className="form-input" placeholder="email@example.com" value={editCred.email || ''} onChange={e => setEditCred(p => p ? { ...p, email: e.target.value } : p)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Senha</label>
                                        <input type="text" className="form-input" placeholder="senha123" value={editCred.password || ''} onChange={e => setEditCred(p => p ? { ...p, password: e.target.value } : p)} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Link</label>
                                    <input type="text" className="form-input" placeholder="https://..." value={editCred.link || ''} onChange={e => setEditCred(p => p ? { ...p, link: e.target.value } : p)} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Máx. Usos</label>
                                        <input type="number" min="1" className="form-input" value={editCred.max_uses} onChange={e => setEditCred(p => p ? { ...p, max_uses: parseInt(e.target.value) || 1 } : p)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Usos Atuais</label>
                                        <input type="number" min="0" className="form-input" value={editCred.current_uses} onChange={e => setEditCred(p => p ? { ...p, current_uses: parseInt(e.target.value) || 0 } : p)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select className="form-input" value={editCred.is_used ? 'used' : 'available'} onChange={e => setEditCred(p => p ? { ...p, is_used: e.target.value === 'used' } : p)}>
                                            <option value="available">Disponível</option>
                                            <option value="used">Esgotada</option>
                                        </select>
                                    </div>
                                </div>

                                {editCred.product && (
                                    <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        🔗 Vinculada: <strong style={{ color: 'var(--text-primary)' }}>{editCred.product.name}</strong>
                                        {editCred.variation && <> → {editCred.variation.name}</>}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setEditCred(null)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary">Salvar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
