import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckSquare, List, ArrowUp, RefreshCw, X, Loader } from 'lucide-react';
import { checklistService } from '../../services/services';

export default function OpeningClosingFormPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('opening'); // 'opening' | 'closing'
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  // Form State
  const [form, setForm] = useState({
    text: '',
    procedureType: 'opening',
    controlType: 'checkbox',
    optionsText: '',
    sortOrder: 0,
    isActive: true
  });

  const loadTasks = () => {
    setLoading(true);
    checklistService.getAllTasks()
      .then(r => setTasks(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleOpenAdd = () => {
    setEditingTask(null);
    setForm({
      text: '',
      procedureType: tab,
      controlType: 'checkbox',
      optionsText: '',
      sortOrder: tasks.filter(t => t.procedureType === tab).length * 10,
      isActive: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    
    let parsedOpts = '';
    if (task.options) {
      try {
        const arr = JSON.parse(task.options);
        if (Array.isArray(arr)) {
          parsedOpts = arr.join(', ');
        }
      } catch (e) {
        parsedOpts = task.options;
      }
    }

    setForm({
      text: task.text,
      procedureType: task.procedureType,
      controlType: task.controlType,
      optionsText: parsedOpts,
      sortOrder: task.sortOrder,
      isActive: task.isActive
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.text.trim()) return;

    let optionsArray = null;
    if (form.controlType === 'dropdown' && form.optionsText.trim()) {
      optionsArray = form.optionsText.split(',').map(s => s.trim()).filter(Boolean);
    }

    const payload = {
      text: form.text.trim(),
      procedureType: form.procedureType,
      controlType: form.controlType,
      options: optionsArray,
      sortOrder: parseInt(form.sortOrder) || 0,
      isActive: form.isActive
    };

    try {
      if (editingTask) {
        await checklistService.updateTask(editingTask.id, payload);
      } else {
        await checklistService.createTask(payload);
      }
      setShowModal(false);
      loadTasks();
    } catch (err) {
      console.error(err);
      alert('Failed to save checklist question.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await checklistService.deleteTask(id);
      loadTasks();
    } catch (err) {
      alert('Failed to delete question.');
    }
  };

  const filteredTasks = tasks.filter(t => t.procedureType === tab);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Opening & Closing Forms Builder</h1>
          <p style={{ marginTop: 4, fontSize: '0.85rem' }}>Create dynamic checklist forms filled by Station Masters</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={loadTasks}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={14} /> Add Question
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <div className={`tab ${tab === 'opening' ? 'active' : ''}`} onClick={() => setTab('opening')}>
          Opening Checklist ({tasks.filter(t => t.procedureType === 'opening').length})
        </div>
        <div className={`tab ${tab === 'closing' ? 'active' : ''}`} onClick={() => setTab('closing')}>
          Closing Checklist ({tasks.filter(t => t.procedureType === 'closing').length})
        </div>
      </div>

      {/* Grid List */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 80 }}>Order</th>
                <th>Question/Label</th>
                <th style={{ width: 140 }}>Control Type</th>
                <th>Options / Actions</th>
                <th style={{ width: 100 }}>Status</th>
                <th style={{ width: 100, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>
                    <Loader size={22} className="spin" style={{ color: 'var(--brand-accent)' }} />
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <h3>No questions configured</h3>
                      <p>Click "Add Question" to start building your form.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{t.sortOrder}</td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{t.text}</div>
                    </td>
                    <td style={{ textTransform: 'capitalize', fontSize: '0.82rem' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 6,
                        background: t.controlType === 'checkbox' ? 'rgba(0,165,145,0.08)' : t.controlType === 'dropdown' ? 'rgba(59,130,246,0.08)' : 'rgba(245,158,11,0.08)',
                        color: t.controlType === 'checkbox' ? 'var(--brand-primary)' : t.controlType === 'dropdown' ? 'var(--info)' : 'var(--warning)',
                        fontWeight: 600
                      }}>
                        {t.controlType === 'action' ? 'Process Action' : t.controlType}
                      </span>
                    </td>
                    <td>
                      {t.controlType === 'dropdown' && t.options ? (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {JSON.parse(t.options).map((opt, idx) => (
                            <span key={idx} style={{
                              fontSize: '0.72rem', background: 'var(--bg-hover)',
                              padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)'
                            }}>
                              {opt}
                            </span>
                          ))}
                        </div>
                      ) : t.controlType === 'action' ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Instructions item requiring confirmation checkbox</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Standard checkbox</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
                        background: t.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: t.isActive ? '#22c55e' : '#ef4444'
                      }}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => handleOpenEdit(t)}>
                          <Edit2 size={13} style={{ color: 'var(--brand-primary)' }} />
                        </button>
                        <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => handleDelete(t.id)}>
                          <Trash2 size={13} style={{ color: 'var(--danger)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: 500, padding: 24, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingTask ? 'Edit Question' : 'Add Question'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Question Text / Label</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Platform inspection completed and passenger screens verified"
                  value={form.text}
                  onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Procedure Mode</label>
                  <select
                    className="form-control"
                    value={form.procedureType}
                    onChange={e => setForm(f => ({ ...f, procedureType: e.target.value }))}
                  >
                    <option value="opening">Opening</option>
                    <option value="closing">Closing</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Control Type</label>
                  <select
                    className="form-control"
                    value={form.controlType}
                    onChange={e => setForm(f => ({ ...f, controlType: e.target.value }))}
                  >
                    <option value="checkbox">Checkbox</option>
                    <option value="dropdown">Dropdown Options</option>
                    <option value="action">Process Action</option>
                  </select>
                </div>
              </div>

              {form.controlType === 'dropdown' && (
                <div className="form-group">
                  <label className="form-label">Dropdown Choices (comma separated)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Clean, Average, Action Required"
                    value={form.optionsText}
                    onChange={e => setForm(f => ({ ...f, optionsText: e.target.value }))}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                    Users will select from this list of options.
                  </span>
                </div>
              )}

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Sort Order</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.sortOrder}
                    onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, height: '100%', paddingTop: 26 }}>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                  />
                  <label htmlFor="isActive" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                    Active (visible on portal)
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
