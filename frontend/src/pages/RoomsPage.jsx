import { useEffect, useState, useCallback } from 'react';
import { api } from '../utils/api.js';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';

const CAT = {
  1: { label: 'Category 1 — Up to Lt Col',         bg: '#E6F1FB', text: '#185FA5' },
  2: { label: 'Category 2 — Colonel & Brigadier',   bg: '#FAEEDA', text: '#854F0B' },
  3: { label: 'Category 3 — Brigadier & above',     bg: '#EAF3DE', text: '#3B6D11' },
};

const RANKS = [
  { value: 1, label: 'Lt' },
  { value: 1, label: 'Capt' },
  { value: 1, label: 'Major' },
  { value: 1, label: 'Lt Col' },
  { value: 2, label: 'Colonel' },
  { value: 2, label: 'Brigadier' },
  { value: 3, label: 'Maj Gen' },
  { value: 3, label: 'Lt Gen' },
  { value: 3, label: 'General' },
];

const BORDER = { available: '#1D9E75', pending: '#EF9F27', occupied: '#E24B4A' };

function toDateStr(d) { return d.toISOString().split('T')[0]; }

const emptyForm = {
  name: '', rank: '', unit: '', mobile: '', email: '',
  idType: '', idNumber: '', checkin: '', checkout: '', arrivalTime: '',
};

export default function RoomsPage() {
  const [rooms, setRooms]         = useState([]);
  const [bookings, setBookings]   = useState([]);
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [editing, setEditing]     = useState(null);
  const [saving, setSaving]       = useState(false);
  const [modal, setModal]         = useState(null);
  const [modalMode, setModalMode] = useState('assign');
  const [form, setForm]           = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [success, setSuccess]     = useState('');
  const [errors, setErrors]       = useState({});

  const load = useCallback(async () => {
    try {
      const [r, b] = await Promise.all([
        api.get('/rooms'),
        api.get('/bookings'),
      ]);
      setRooms([...r]);
      setBookings([...b]);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getRoomInfo = (room) => {
    const date = selectedDate;
    const booking = bookings.find(b =>
      b.room?._id === room._id &&
      ['Approved', 'Checked In'].includes(b.status) &&
      b.checkin <= date && b.checkout >= date
    );
    if (booking) return {
      status: 'occupied',
      guest: booking.officer.name,
      rank: booking.officer.rank,
      checkin: booking.checkin,
      checkout: booking.checkout,
      booking,
    };
    return { status: 'available', guest: null, booking: null };
  };

  const saveName = async (room) => {
    setSaving(true);
    try {
      await api.patch(`/rooms/${room._id}`, { name: editing.name });
      setEditing(null);
      await load();
    } finally { setSaving(false); }
  };

  const openModal = (room) => {
    const info = getRoomInfo(room);
    setForm({ ...emptyForm, checkin: selectedDate });
    setErrors({});
    setSuccess('');
    setModalMode('assign');
    setModal({ room, info });
  };

  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim())   errs.name     = 'Required';
    if (!form.rank)          errs.rank     = 'Required';
    if (!form.unit.trim())   errs.unit     = 'Required';
    if (!form.mobile.trim()) errs.mobile   = 'Required';
    if (!/^\d{10}$/.test(form.mobile)) errs.mobile = 'Must be 10 digits';
    if (!form.checkin)       errs.checkin  = 'Required';
    if (!form.checkout)      errs.checkout = 'Required';
    if (!form.arrivalTime)   errs.arrivalTime = 'Required';
    if (form.checkin && form.checkout && form.checkout <= form.checkin)
      errs.checkout = 'Must be after check-in';
    return errs;
  };

  const handleAssign = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setFormLoading(true);
    try {
      const category = RANKS.find(r => r.label === form.rank)?.value || 1;
      const booking = await api.post('/bookings', {
        officer: {
          name: form.name, rank: form.rank, unit: form.unit,
          mobile: form.mobile, email: form.email,
          idType: form.idType, idNumber: form.idNumber,
          arrivalTime: form.arrivalTime,
        },
        category,
        checkin: form.checkin,
        checkout: form.checkout,
      });
      await api.patch(`/bookings/${booking._id}/approve`, { roomId: modal.room._id });
      setSuccess(`✅ ${modal.room.name} assigned to ${form.rank} ${form.name} from ${form.checkin} to ${form.checkout}.`);
      await load();
    } catch (err) {
      setErrors({ submit: err.message });
    } finally { setFormLoading(false); }
  };

  const handleReassign = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setFormLoading(true);
    try {
      if (modal.info.booking) {
        await api.patch(`/bookings/${modal.info.booking._id}/cancel`, {
          cancelReason: `Room reassigned to ${form.name} by admin`,
        });
      }
      await api.patch(`/rooms/${modal.room._id}`, {
        status: 'available', currentGuest: null, currentBooking: null,
      });
      await new Promise(r => setTimeout(r, 800));
      const category = RANKS.find(r => r.label === form.rank)?.value || 1;
      const newBooking = await api.post('/bookings', {
        officer: {
          name: form.name, rank: form.rank, unit: form.unit,
          mobile: form.mobile, email: form.email,
          idType: form.idType, idNumber: form.idNumber,
          arrivalTime: form.arrivalTime,
        },
        category,
        checkin: form.checkin,
        checkout: form.checkout,
      });
      await api.patch(`/bookings/${newBooking._id}/approve`, { roomId: modal.room._id });
      await load();
      setSuccess(`✅ ${modal.room.name} reassigned to ${form.rank} ${form.name} from ${form.checkin} to ${form.checkout}.`);
    } catch (err) {
      setErrors({ submit: err.message });
      await load();
    } finally { setFormLoading(false); }
  };

  const handleVacate = async () => {
    setFormLoading(true);
    tr
