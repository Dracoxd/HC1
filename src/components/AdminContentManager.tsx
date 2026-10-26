import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { auth } from '../firebase';
import { AdminSiteContentItem, ClinicPublicSettings, PublicSiteContent } from '../types';
import { ImagePlus } from 'lucide-react';

type ContentType = AdminSiteContentItem['content_type'];
type ContentRecord = Record<string, unknown>;
type Field = { key: string; label: string; multiline?: boolean; array?: boolean; number?: boolean; options?: string[] };

const contentTypes: Array<{ id: ContentType; label: string }> = [
  { id: 'news', label: 'Announcements & news' },
  { id: 'service', label: 'Health services' },
  { id: 'outreach', label: 'Outreach programs' },
];

const fieldsByType: Record<ContentType, Field[]> = {
  news: [
    { key: 'title', label: 'Title (English)' },
    { key: 'titleFil', label: 'Title (Filipino)' },
    { key: 'summary', label: 'Summary (English)', multiline: true },
    { key: 'summaryFil', label: 'Summary (Filipino)', multiline: true },
    { key: 'content', label: 'Full announcement (English)', multiline: true },
    { key: 'contentFil', label: 'Full announcement (Filipino)', multiline: true },
    { key: 'date', label: 'Display date' },
    { key: 'category', label: 'Category', options: ['Schedule', 'Advisory', 'Campaign', 'Meds'] },
    { key: 'categoryFil', label: 'Category (Filipino)' },
    { key: 'author', label: 'Author / department' },
    { key: 'readTime', label: 'Reading time' },
  ],
  service: [
    { key: 'title', label: 'Service name (English)' },
    { key: 'titleFil', label: 'Service name (Filipino)' },
    { key: 'shortDesc', label: 'Short description (English)', multiline: true },
    { key: 'shortDescFil', label: 'Short description (Filipino)', multiline: true },
    { key: 'fullDesc', label: 'Full details (English)', multiline: true },
    { key: 'fullDescFil', label: 'Full details (Filipino)', multiline: true },
    { key: 'category', label: 'Category', options: ['maternity', 'nutrition', 'dental', 'animal_bite', 'checkup', 'xray', 'pharmacy'] },
    { key: 'schedule', label: 'Schedule (English)', multiline: true },
    { key: 'scheduleFil', label: 'Schedule (Filipino)', multiline: true },
    { key: 'location', label: 'Location' },
    { key: 'keyPersonnel', label: 'Care team (one per line)', array: true, multiline: true },
    { key: 'requirements', label: 'Requirements (English, one per line)', array: true, multiline: true },
    { key: 'requirementsFil', label: 'Requirements (Filipino, one per line)', array: true, multiline: true },
    { key: 'badge', label: 'Short label (English)' },
    { key: 'badgeFil', label: 'Short label (Filipino)' },
  ],
  outreach: [
    { key: 'title', label: 'Program name (English)' },
    { key: 'titleFil', label: 'Program name (Filipino)' },
    { key: 'description', label: 'Description (English)', multiline: true },
    { key: 'descriptionFil', label: 'Description (Filipino)', multiline: true },
    { key: 'targetBarangay', label: 'Target barangay / group' },
    { key: 'scheduleDate', label: 'Schedule date' },
    { key: 'timeWindow', label: 'Time' },
    { key: 'location', label: 'Location' },
    { key: 'capacity', label: 'Capacity', number: true },
    { key: 'slotsRemaining', label: 'Available slots', number: true },
    { key: 'eligibility', label: 'Eligibility (English)', multiline: true },
    { key: 'eligibilityFil', label: 'Eligibility (Filipino)', multiline: true },
    { key: 'category', label: 'Category', options: ['opt', 'dental', 'xray_tb', 'maintenance_refill', 'maternal', 'rabies'] },
  ],
};

const settingsFields: Array<{ key: keyof ClinicPublicSettings; label: string; multiline?: boolean }> = [
  { key: 'clinicHours', label: 'General clinic hours (English)' },
  { key: 'clinicHoursFil', label: 'General clinic hours (Filipino)' },
  { key: 'doctorHours', label: 'Doctor hours (English)', multiline: true },
  { key: 'doctorHoursFil', label: 'Doctor hours (Filipino)', multiline: true },
  { key: 'xrayHours', label: 'X-ray hours (English)' },
  { key: 'xrayHoursFil', label: 'X-ray hours (Filipino)' },
  { key: 'dentalHours', label: 'Dental hours (English)' },
  { key: 'dentalHoursFil', label: 'Dental hours (Filipino)' },
  { key: 'clinicAddress', label: 'Clinic address (English)' },
  { key: 'clinicAddressFil', label: 'Clinic address (Filipino)' },
  { key: 'contactPhone', label: 'Clinic phone' },
  { key: 'contactEmail', label: 'Clinic email' },
  { key: 'emergencyPhone', label: 'Emergency phone (English)' },
  { key: 'emergencyPhoneFil', label: 'Emergency phone (Filipino)' },
  { key: 'holidayAdvisory', label: 'Holiday advisory (English)', multiline: true },
  { key: 'holidayAdvisoryFil', label: 'Holiday advisory (Filipino)', multiline: true },
];

function emptyContent(type: ContentType): ContentRecord {
  if (type === 'service') return {
    title: '', titleFil: '', shortDesc: '', shortDescFil: '', fullDesc: '', fullDescFil: '',
    category: 'checkup', schedule: '', scheduleFil: '', location: '', keyPersonnel: [],
    requirements: [], requirementsFil: [], badge: '', badgeFil: '',
  };
  if (type === 'news') return {
    title: '', titleFil: '', summary: '', summaryFil: '', content: '', contentFil: '',
    date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    category: 'Advisory', categoryFil: 'Pabatid', author: 'Health Center', readTime: '1 min read', imageUrl: '',
  };
  return {
    title: '', titleFil: '', description: '', descriptionFil: '', targetBarangay: '',
    scheduleDate: '', timeWindow: '', location: '', capacity: 0, slotsRemaining: 0,
    eligibility: '', eligibilityFil: '', category: 'opt',
  };
}

async function optimizeAnnouncementImage(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPEG, PNG, or WEBP image.');
  }
  if (file.size > 15 * 1024 * 1024) throw new Error('Choose an image smaller than 15 MB.');

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('This image could not be prepared for upload.');
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let image: Blob | null = null;
  for (const quality of [0.88, 0.8, 0.72, 0.64]) {
    image = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (image && image.size <= 2 * 1024 * 1024) break;
  }
  if (!image || image.size > 2 * 1024 * 1024) {
    throw new Error('This image is too large after optimization. Choose a smaller image.');
  }

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('The optimized image could not be read.'));
    reader.onerror = () => reject(new Error('The optimized image could not be read.'));
    reader.readAsDataURL(image);
  });
}

async function postAdminAction(action: string, payload: Record<string, unknown>) {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in as an administrator to manage website content.');
  const token = await user.getIdToken();
  const response = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, ...payload }),
  });
  const result = await response.json() as { error?: string; [key: string]: unknown };
  if (!response.ok) throw new Error(result.error || 'Website content could not be saved.');
  return result;
}

export const AdminContentManager: React.FC = () => {
  const [type, setType] = useState<ContentType>('news');
  const [items, setItems] = useState<AdminSiteContentItem[]>([]);
  const [settings, setSettings] = useState<ClinicPublicSettings | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [content, setContent] = useState<ContentRecord>(emptyContent('news'));
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Sign in as an administrator to manage website content.');
      const token = await user.getIdToken();
      const response = await fetch('/api/admin?mode=site_content', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const result = await response.json() as { items?: AdminSiteContentItem[]; content?: PublicSiteContent; error?: string };
      if (!response.ok || !Array.isArray(result.items) || !result.content) {
        throw new Error(result.error || 'Website content could not be loaded.');
      }
      setItems(result.items);
      setSettings(result.content.settings);
      setError('');
      return { items: result.items, settings: result.content.settings };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load().catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : 'Website content could not be loaded.');
    });
  }, []);

  const visibleItems = useMemo(() => items.filter((item) => item.content_type === type), [items, type]);
  const beginNew = () => {
    setSelectedId(`custom-${type}-${Date.now()}`);
    setContent(emptyContent(type));
    setPublished(true);
    setError('');
    setNotice('');
  };

  const chooseType = (nextType: ContentType) => {
    setType(nextType);
    setSelectedId('');
    setContent(emptyContent(nextType));
  };

  const selectItem = (item: AdminSiteContentItem) => {
    try {
      const parsed = JSON.parse(item.content_json) as ContentRecord;
      setType(item.content_type);
      setSelectedId(item.content_id);
      setContent(parsed);
      setPublished(item.published === 1);
      setError('');
      setNotice('');
    } catch {
      setError('This content item contains invalid saved data and cannot be edited.');
    }
  };

  const saveContent = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const normalized: ContentRecord = { ...content };
      for (const field of fieldsByType[type]) {
        if (field.array) {
        normalized[field.key] = Array.isArray(content[field.key])
          ? content[field.key]
          : String(content[field.key] ?? '').split('\n').map((value) => value.trim()).filter(Boolean);
        } else if (field.number) {
          normalized[field.key] = Math.max(0, Number(content[field.key] ?? 0));
        }
      }
      await postAdminAction('save_site_content', {
        contentType: type, contentId: selectedId, content: normalized, published,
      });
      const saved = await load();
      const savedItem = saved.items.find((item) => item.content_type === type && item.content_id === selectedId);
      if (!savedItem || savedItem.published !== (published ? 1 : 0)
        || JSON.stringify(JSON.parse(savedItem.content_json)) !== JSON.stringify({ ...normalized, id: selectedId })) {
        throw new Error('The save was not confirmed by the database. Check the Vercel Turso database settings and try again.');
      }
      setNotice('Website content saved.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Website content could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const deleteContent = async () => {
    if (!selectedId || !items.some((item) => item.content_type === type && item.content_id === selectedId)) return;
    if (!window.confirm('Delete this item from the public website? This cannot be undone.')) return;
    setSaving(true);
    setError('');
    try {
      await postAdminAction('delete_site_content', { contentType: type, contentId: selectedId });
      setSelectedId('');
      setContent(emptyContent(type));
      const saved = await load();
      if (saved.items.some((item) => item.content_type === type && item.content_id === selectedId)) {
        throw new Error('The deletion was not confirmed by the database. Check the Vercel Turso database settings and try again.');
      }
      setNotice('Content item deleted.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Content item could not be deleted.');
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async (event: FormEvent) => {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await postAdminAction('save_public_settings', { settings });
      const saved = await load();
      const settingsMatch = Object.entries(settings).every(([key, value]) => (
        saved.settings[key as keyof ClinicPublicSettings] === value.trim()
      ));
      if (!settingsMatch) {
        throw new Error('The save was not confirmed by the database. Check the Vercel Turso database settings and try again.');
      }
      setNotice('Clinic hours and contact information saved.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Clinic information could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const uploadAnnouncementImage = async (file: File) => {
    setImageUploading(true);
    setError('');
    setNotice('');
    try {
      const imageData = await optimizeAnnouncementImage(file);
      const result = await postAdminAction('upload_announcement_image', { contentId: selectedId, imageData });
      if (typeof result.imageUrl !== 'string') throw new Error('The image upload did not return a valid image URL.');
      setContent((current) => ({ ...current, imageUrl: result.imageUrl }));
      setNotice('Image uploaded. Save content to publish the announcement image.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Announcement image could not be uploaded.');
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="min-w-0 space-y-4">
        <section className="border border-[#dfe6e1] bg-white p-4 sm:p-5">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Website content type">
            {contentTypes.map((item) => (
              <button key={item.id} type="button" role="tab" aria-selected={type === item.id} onClick={() => chooseType(item.id)}
                className={`min-h-10 border px-3 text-xs font-bold ${type === item.id ? 'border-[#17645c] bg-[#edf5f1] text-[#17645c]' : 'border-[#dfe6e1] text-[#66736f]'}`}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold">Published and draft items</h2>
            <button type="button" onClick={beginNew} className="min-h-10 shrink-0 bg-[#17645c] px-3 text-xs font-bold text-white">New item</button>
          </div>
          <div className="mt-3 max-h-[430px] divide-y divide-[#edf1ee] overflow-y-auto border-y border-[#edf1ee]">
            {visibleItems.map((item) => {
              const value = JSON.parse(item.content_json) as ContentRecord;
              const title = String(value.title ?? value.titleFil ?? item.content_id);
              return (
                <button key={item.content_id} type="button" onClick={() => selectItem(item)}
                  className={`w-full px-3 py-3 text-left ${selectedId === item.content_id ? 'bg-[#edf5f1]' : 'hover:bg-[#f7f9f7]'}`}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-xs font-bold">{title}</span>
                    <span className={`shrink-0 px-2 py-1 text-[9px] font-bold uppercase ${item.published ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{item.published ? 'Published' : 'Draft'}</span>
                  </span>
                  <span className="mt-1 block truncate font-mono text-[10px] text-[#87938c]">{item.content_id}</span>
                </button>
              );
            })}
            {!loading && visibleItems.length === 0 && <p className="p-4 text-xs text-[#66736f]">No items in this section.</p>}
            {loading && <p className="p-4 text-xs text-[#66736f]">Loading website content...</p>}
          </div>
        </section>
        <form onSubmit={saveSettings} className="space-y-3 border border-[#dfe6e1] bg-white p-4 sm:p-5">
          <div><h2 className="text-sm font-bold">Clinic hours and contact</h2><p className="mt-1 text-xs text-[#66736f]">These details are shown on the public clinic information section.</p></div>
          {settingsFields.map((field) => (
            <label key={field.key} className="block text-xs font-semibold text-[#66736f]">
              {field.label}
              {field.multiline ? (
                <textarea value={settings?.[field.key] ?? ''} onChange={(event) => setSettings((current) => current ? { ...current, [field.key]: event.target.value } : current)} rows={2} className="mt-1 block w-full border border-[#d9e1dc] px-3 py-2 text-sm font-normal text-[#17312e]" />
              ) : (
                <input value={settings?.[field.key] ?? ''} onChange={(event) => setSettings((current) => current ? { ...current, [field.key]: event.target.value } : current)} className="mt-1 block min-h-10 w-full border border-[#d9e1dc] px-3 text-sm font-normal text-[#17312e]" />
              )}
            </label>
          ))}
          <button type="submit" disabled={saving || !settings} className="min-h-11 w-full bg-[#17645c] px-4 text-xs font-bold text-white disabled:opacity-60">Save clinic information</button>
        </form>
      </div>

      <form onSubmit={saveContent} className="min-w-0 space-y-3 border border-[#dfe6e1] bg-white p-4 sm:p-5">
        <div><h2 className="text-sm font-bold">{selectedId ? 'Edit public content' : 'Select or create an item'}</h2><p className="mt-1 text-xs text-[#66736f]">Edits appear on the website after publishing. English and Filipino content are separate fields.</p></div>
        {selectedId && <>
          <label className="block text-xs font-semibold text-[#66736f]">Content ID<input value={selectedId} readOnly className="mt-1 block min-h-10 w-full border border-[#d9e1dc] bg-[#f7f9f7] px-3 font-mono text-xs text-[#66736f]" /></label>
          {fieldsByType[type].map((field) => {
            const value = content[field.key];
            const displayValue = field.array
              ? Array.isArray(value) ? value.join('\n') : String(value ?? '')
              : String(value ?? '');
            const change = (next: string) => setContent((current) => ({ ...current, [field.key]: field.number ? (next === '' ? 0 : Number(next)) : next }));
            return (
              <label key={field.key} className="block text-xs font-semibold text-[#66736f]">
                {field.label}
                {field.options ? (
                  <select value={displayValue} onChange={(event) => change(event.target.value)} className="mt-1 block min-h-10 w-full border border-[#d9e1dc] bg-white px-3 text-sm font-normal text-[#17312e]">
                    {field.options.map((option) => <option key={option}>{option}</option>)}
                  </select>
                ) : field.multiline ? (
                  <textarea value={displayValue} onChange={(event) => change(event.target.value)} rows={3} className="mt-1 block w-full border border-[#d9e1dc] px-3 py-2 text-sm font-normal text-[#17312e]" />
                ) : (
                  <input type={field.number ? 'number' : 'text'} min={field.number ? 0 : undefined} value={displayValue} onChange={(event) => change(event.target.value)} className="mt-1 block min-h-10 w-full border border-[#d9e1dc] px-3 text-sm font-normal text-[#17312e]" />
                )}
              </label>
            );
          })}
          {type === 'news' && (
            <div className="space-y-3 border border-[#dfe6e1] bg-[#f7f9f7] p-3">
              <div>
                <h3 className="text-xs font-bold text-[#17312e]">Announcement image</h3>
                <p className="mt-1 text-[11px] text-[#66736f]">Images are optimized to WEBP, up to 1600 px, then stored in Turso. Maximum original file size: 15 MB.</p>
              </div>
              {typeof content.imageUrl === 'string'
                && /^\/api\/content-image\?id=[0-9a-f-]{36}$/i.test(content.imageUrl)
                && <img src={content.imageUrl} alt="Announcement preview" className="max-h-56 w-full bg-white object-contain" />}
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 bg-[#17645c] px-3 text-xs font-bold text-white">
                  <ImagePlus className="h-4 w-4" />
                  {imageUploading ? 'Uploading image...' : content.imageUrl ? 'Replace image' : 'Upload image'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={imageUploading || saving}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = '';
                      if (file) void uploadAnnouncementImage(file);
                    }}
                    className="sr-only"
                  />
                </label>
                {typeof content.imageUrl === 'string' && content.imageUrl
                  && <button type="button" disabled={imageUploading || saving} onClick={() => setContent((current) => ({ ...current, imageUrl: '' }))} className="min-h-10 border border-[#d9e1dc] px-3 text-xs font-bold text-rose-700 disabled:opacity-60">Remove image</button>}
              </div>
            </div>
          )}
          <label className="flex min-h-11 items-center gap-2 border border-[#dfe6e1] px-3 text-xs font-semibold text-[#17312e]">
            <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} className="h-4 w-4 accent-[#17645c]" />
            Publish this item on the public website
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className="min-h-11 flex-1 bg-[#17645c] px-4 text-xs font-bold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save content'}</button>
            {items.some((item) => item.content_type === type && item.content_id === selectedId)
              && <button type="button" disabled={saving} onClick={() => void deleteContent()} className="min-h-11 border border-rose-200 px-4 text-xs font-bold text-rose-700 disabled:opacity-60">Delete</button>}
          </div>
        </>}
        {!selectedId && <p className="border-y border-[#edf1ee] py-6 text-center text-xs text-[#87938c]">Choose an existing item or tap “New item” to create public content.</p>}
      </form>
      {(error || notice) && <div role={error ? 'alert' : 'status'} className={`xl:col-span-2 border px-4 py-3 text-xs ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || notice}</div>}
    </section>
  );
};
