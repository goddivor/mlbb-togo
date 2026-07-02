'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileInput, Plus, Trash2, GripVertical, Save, Eye, ChevronDown, Type, Mail, Hash, CheckSquare, Circle, AlignLeft, Upload, Calendar, Edit, BarChart3 } from 'lucide-react';
import { useAdminStore } from '@/store/useStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const fieldTypeIcons: Record<string, any> = { text: Type, email: Mail, number: Hash, select: ChevronDown, checkbox: CheckSquare, radio: Circle, textarea: AlignLeft, file: Upload, date: Calendar };
const fieldTypeLabels: Record<string, string> = { text: 'Texte', email: 'Email', number: 'Nombre', select: 'Liste déroulante', checkbox: 'Case à cocher', radio: 'Bouton radio', textarea: 'Zone de texte', file: 'Fichier', date: 'Date' };

function FieldEditor({ field, onUpdate, onDelete }: any) {
  const Icon = fieldTypeIcons[field.type] || Type;
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-gaming-darker border border-gaming-border rounded-lg p-4 group">
      <div className="flex items-center gap-3 mb-3">
        <GripVertical size={16} className="text-gray-500 cursor-grab" />
        <Icon size={16} className="text-neon-blue" />
        <span className="text-xs text-gray-400 uppercase">{fieldTypeLabels[field.type]}</span>
        <div className="flex-1" />
        <label className="flex items-center gap-1 text-xs text-gray-400">
          <input type="checkbox" checked={field.required} onChange={(e) => onUpdate({ ...field, required: e.target.checked })} className="rounded" /> Requis
        </label>
        <button onClick={onDelete} className="p-1 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
      </div>
      <input value={field.label} onChange={(e) => onUpdate({ ...field, label: e.target.value })} placeholder="Label du champ" className="w-full px-3 py-2 bg-gaming-card border border-gaming-border rounded text-white text-sm mb-2 focus:border-neon-blue focus:outline-none" />
      <input value={field.placeholder || ''} onChange={(e) => onUpdate({ ...field, placeholder: e.target.value })} placeholder="Placeholder (optionnel)" className="w-full px-3 py-2 bg-gaming-card border border-gaming-border rounded text-white text-sm mb-2 focus:border-neon-blue focus:outline-none" />
      {(field.type === 'select' || field.type === 'radio') && (
        <div className="mt-2">
          <label className="text-xs text-gray-400 mb-1 block">Options (une par ligne)</label>
          <textarea value={(field.options || []).join('\n')} onChange={(e) => onUpdate({ ...field, options: e.target.value.split('\n').filter(Boolean) })} rows={3} className="w-full px-3 py-2 bg-gaming-card border border-gaming-border rounded text-white text-sm focus:border-neon-blue focus:outline-none resize-none" />
        </div>
      )}
    </motion.div>
  );
}

function FormPreview({ fields, formName }: any) {
  return (
    <div className="bg-gaming-card border border-gaming-border rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-1">{formName || 'Aperçu du formulaire'}</h3>
      <p className="text-gray-400 text-sm mb-6">Remplissez les champs ci-dessous</p>
      <div className="space-y-4">
        {fields.map((field: any) => (
          <div key={field.id}>
            <label className="text-sm text-gray-300 mb-1 block">{field.label} {field.required && <span className="text-red-400">*</span>}</label>
            {field.type === 'text' || field.type === 'email' || field.type === 'number' || field.type === 'date' ? (
              <input type={field.type} placeholder={field.placeholder} className="w-full px-3 py-2 bg-gaming-darker border border-gaming-border rounded-lg text-white text-sm focus:border-neon-blue focus:outline-none" disabled />
            ) : field.type === 'textarea' ? (
              <textarea placeholder={field.placeholder} rows={3} className="w-full px-3 py-2 bg-gaming-darker border border-gaming-border rounded-lg text-white text-sm focus:border-neon-blue focus:outline-none resize-none" disabled />
            ) : field.type === 'select' ? (
              <select className="w-full px-3 py-2 bg-gaming-darker border border-gaming-border rounded-lg text-white text-sm" disabled><option>{field.placeholder || 'Sélectionner...'}</option></select>
            ) : field.type === 'checkbox' ? (
              <label className="flex items-center gap-2 text-gray-400 text-sm"><input type="checkbox" disabled className="rounded" /> {field.placeholder || 'Oui'}</label>
            ) : field.type === 'radio' ? (
              (field.options || ['Option 1']).map((opt: string, i: number) => <label key={i} className="flex items-center gap-2 text-gray-400 text-sm mr-4"><input type="radio" name={field.id} disabled /> {opt}</label>)
            ) : field.type === 'file' ? (
              <div className="border-2 border-dashed border-gaming-border rounded-lg p-4 text-center text-gray-500 text-sm"><Upload size={20} className="mx-auto mb-1" /> Glissez un fichier ici</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FormBuilder() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('list');
  const [editingForm, setEditingForm] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [fields, setFields] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [viewingResponses, setViewingResponses] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const { addAdminLog } = useAdminStore();

  useEffect(() => {
    api.admin.forms.list().then(setTemplates);
  }, []);

  const addField = (type: string) => {
    setFields([...fields, { id: 'f_' + Date.now(), type, label: '', placeholder: '', required: false, options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined }]);
  };

  const updateField = (index: number, updated: any) => {
    setFields(fields.map((f, i) => (i === index ? updated : f)));
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const saveForm = () => {
    if (!formName.trim()) return toast.error('Nom requis');
    if (fields.length === 0) return toast.error('Ajoutez au moins un champ');
    const form = { name: formName, description: formDesc, fields, status: 'active', responses: 0 };
    if (editingForm) {
      setTemplates(templates.map((t) => (t.id === editingForm ? { ...t, ...form } : t)));
      api.admin.forms.update(editingForm, form).catch(() => {});
      toast.success('Formulaire mis à jour');
    } else {
      const local = { ...form, id: 'form_' + Date.now(), createdAt: new Date().toISOString() };
      setTemplates([...templates, local]);
      api.admin.forms.create(form).catch(() => {});
      toast.success('Formulaire créé');
    }
    addAdminLog({ action: 'form_' + (editingForm ? 'update' : 'create'), admin: 'TogoKing', target: formName, details: `${fields.length} champs` });
    setActiveTab('list');
    setEditingForm(null);
    setFormName('');
    setFormDesc('');
    setFields([]);
  };

  const startEdit = (form: any) => {
    setEditingForm(form.id);
    setFormName(form.name);
    setFormDesc(form.description || '');
    setFields([...form.fields]);
    setActiveTab('create');
  };

  const deleteForm = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
    api.admin.forms.remove(id).catch(() => {});
    toast.success('Formulaire supprimé');
  };

  const viewResponses = (form: any) => {
    setViewingResponses(form);
    api.admin.forms.responses(form.id).then(setResponses).catch(() => setResponses([]));
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><FileInput className="text-pink-400" size={32} /> Form Builder</h1>
          <p className="text-gray-400 mt-1">Créez des formulaires dynamiques sans coder</p>
        </div>
      </motion.div>

      <div className="flex gap-2">
        {[{ id: 'list', label: 'Mes formulaires', icon: FileInput }, { id: 'create', label: editingForm ? 'Modifier' : 'Créer', icon: Plus }].map((tab) => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'create' && !editingForm) { setFormName(''); setFormDesc(''); setFields([]); } }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30' : 'bg-gaming-card text-gray-400 border border-gaming-border hover:text-white'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'list' && (
        <div className="space-y-4">
          {templates.map((form: any, i: number) => (
            <motion.div key={form.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-gaming-card border border-gaming-border rounded-xl p-5 hover:border-pink-400/30 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">{form.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{form.description}</p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    <span>{form.fields?.length || 0} champs</span>
                    <span>{form.responses || 0} réponses</span>
                    <span className={`px-2 py-0.5 rounded ${form.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{form.status}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => viewResponses(form)} className="py-2 px-3 bg-gaming-darker text-gray-300 rounded-lg hover:text-neon-blue transition-colors text-sm"><BarChart3 size={14} /></button>
                  <button onClick={() => startEdit(form)} className="py-2 px-3 bg-gaming-darker text-gray-300 rounded-lg hover:text-yellow-400 transition-colors text-sm"><Edit size={14} /></button>
                  <button onClick={() => deleteForm(form.id)} className="py-2 px-3 bg-gaming-darker text-gray-300 rounded-lg hover:text-red-400 transition-colors text-sm"><Trash2 size={14} /></button>
                </div>
              </div>
            </motion.div>
          ))}
          {templates.length === 0 && <div className="text-center py-12 text-gray-500">Aucun formulaire créé. Cliquez sur {'"Créer"'} pour commencer.</div>}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-gaming-card border border-gaming-border rounded-xl p-5 space-y-4">
              <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nom du formulaire" className="w-full px-4 py-3 bg-gaming-darker border border-gaming-border rounded-lg text-white text-lg font-medium focus:border-neon-blue focus:outline-none" />
              <input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Description (optionnelle)" className="w-full px-4 py-2 bg-gaming-darker border border-gaming-border rounded-lg text-white text-sm focus:border-neon-blue focus:outline-none" />
            </div>

            <div className="bg-gaming-card border border-gaming-border rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">Champs du formulaire</h3>
              <AnimatePresence>
                <div className="space-y-3">
                  {fields.map((field: any, i: number) => <FieldEditor key={field.id} field={field} onUpdate={(updated: any) => updateField(i, updated)} onDelete={() => removeField(i)} />)}
                </div>
              </AnimatePresence>
              {fields.length === 0 && <p className="text-gray-500 text-center py-8">Ajoutez des champs depuis la palette à droite</p>}
            </div>

            <div className="flex gap-3">
              <button onClick={saveForm} className="flex-1 py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"><Save size={16} /> {editingForm ? 'Mettre à jour' : 'Sauvegarder'}</button>
              <button onClick={() => setShowPreview(!showPreview)} className="py-3 px-6 bg-gaming-card border border-gaming-border text-gray-300 rounded-lg hover:text-white transition-colors flex items-center gap-2"><Eye size={16} /> Aperçu</button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gaming-card border border-gaming-border rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">Palette de champs</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(fieldTypeLabels).map(([type, label]) => {
                  const Icon = fieldTypeIcons[type];
                  return (
                    <button key={type} onClick={() => addField(type)} className="flex items-center gap-2 p-3 bg-gaming-darker border border-gaming-border rounded-lg text-gray-300 hover:text-white hover:border-neon-blue/30 transition-all text-sm">
                      <Icon size={14} className="text-neon-blue" /> {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {showPreview && <FormPreview fields={fields} formName={formName} />}
          </div>
        </div>
      )}

      <AnimatePresence>
        {viewingResponses && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingResponses(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="bg-gaming-card border border-gaming-border rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4">Réponses: {viewingResponses.name}</h3>
              {responses.map((resp: any) => (
                <div key={resp.id} className="bg-gaming-darker border border-gaming-border rounded-lg p-4 mb-3">
                  <p className="text-gray-400 text-xs mb-2">{resp.submittedAt}</p>
                  <div className="space-y-1">
                    {Object.entries(resp.data || {}).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-sm"><span className="text-gray-400">{key}</span><span className="text-white">{String(val)}</span></div>
                    ))}
                  </div>
                </div>
              ))}
              {responses.length === 0 && <p className="text-gray-500 text-center py-8">Aucune réponse pour ce formulaire</p>}
              <button onClick={() => setViewingResponses(null)} className="mt-4 w-full py-2 bg-gaming-darker text-gray-300 rounded-lg hover:text-white transition-colors">Fermer</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
