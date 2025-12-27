import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, addDays, startOfDay, addHours, isSameDay, parseISO, getISOWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { API } from '../../context/AuthContext';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/requests').then(res => setRequests(res.data));
  }, []);

  // --- Calendar Logic ---
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 }); 
  const weekDays = [...Array(7)].map((_, i) => addDays(startDate, i));
  const timeSlots = [...Array(14)].map((_, i) => i + 6); // 06:00 to 19:00

  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const today = () => setCurrentDate(new Date());

  const getEvents = (day, hour) => {
    return requests.filter(r => {
      // Use Scheduled Date for the calendar placement
      if (!r.scheduled_date) return false;
      const rDate = parseISO(r.scheduled_date);
      return isSameDay(rDate, day) && rDate.getHours() === hour;
    });
  };

  const getStageColor = (stage) => {
    switch(stage) {
       case 'New': return 'bg-blue-600 border-blue-400';
       case 'In Progress': return 'bg-yellow-600 border-yellow-400';
       case 'Repaired': return 'bg-green-600 border-green-400';
       case 'Scrap': return 'bg-red-600 border-red-400';
       default: return 'bg-gray-600 border-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] text-gray-200 animate-fade-in">
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#242424] border-b border-[#333] shadow-md z-20">
        <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Maintenance Calendar</h1>
            <div className="flex items-center bg-[#333] rounded-md border border-[#444]">
                <button onClick={prevWeek} className="p-1.5 hover:bg-[#444] rounded-l text-gray-300"><ChevronLeft size={20}/></button>
                <button onClick={today} className="px-4 py-1 text-sm font-bold border-l border-r border-[#444] hover:bg-[#444] text-white">Today</button>
                <button onClick={nextWeek} className="p-1.5 hover:bg-[#444] rounded-r text-gray-300"><ChevronRight size={20}/></button>
            </div>
            <span className="text-lg text-gray-300 font-medium ml-2">
                {format(currentDate, 'MMMM yyyy')} <span className="text-sm text-gray-500">Week {getISOWeek(currentDate)}</span>
            </span>
        </div>
        <div className="flex gap-4 text-xs font-medium">
            <span className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-600"></div> New</span>
            <span className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-yellow-600"></div> In Progress</span>
            <span className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-600"></div> Repaired</span>
        </div>
      </div>

      {/* --- CALENDAR GRID --- */}
      <div className="flex flex-1 overflow-hidden">
        {/* Time Sidebar */}
        <div className="w-16 flex-none bg-[#242424] border-r border-[#333] flex flex-col pt-10 z-10">
            {timeSlots.map(hour => (
                <div key={hour} className="h-24 text-xs text-gray-500 text-right pr-2 relative -top-2">
                    {hour}:00
                </div>
            ))}
        </div>

        {/* Days Columns */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
            {/* Days Header */}
            <div className="flex border-b border-[#333] bg-[#242424] min-h-[60px] sticky top-0 z-10 shadow-sm">
                {weekDays.map(day => (
                    <div key={day.toString()} className={`flex-1 text-center py-2 border-r border-[#333] ${isSameDay(day, new Date()) ? 'bg-[#2a2a2a]' : ''}`}>
                        <div className={`text-xs font-bold uppercase ${isSameDay(day, new Date()) ? 'text-odoo-secondary' : 'text-gray-500'}`}>
                            {format(day, 'EEE')}
                        </div>
                        <div className={`text-xl ${isSameDay(day, new Date()) ? 'text-odoo-secondary font-bold' : 'text-gray-300'}`}>
                            {format(day, 'd')}
                        </div>
                    </div>
                ))}
            </div>

            {/* Time Grid Body */}
            <div className="flex flex-1 relative bg-[#1a1a1a]">
                {/* Horizontal Grid Lines */}
                <div className="absolute inset-0 flex flex-col pointer-events-none">
                    {timeSlots.map(t => (
                        <div key={t} className="h-24 border-b border-[#333] w-full"></div>
                    ))}
                </div>

                {/* Event Columns */}
                {weekDays.map(day => (
                    <div key={day.toString()} className="flex-1 border-r border-[#333] relative h-[1344px]"> {/* 14 slots * 24 (96px) */}
                        {timeSlots.map(hour => {
                            const events = getEvents(day, hour);
                            return events.map(ev => (
                                <div 
                                    key={ev.id}
                                    onClick={() => navigate(`/requests/${ev.id}`)}
                                    className={`absolute left-1 right-1 p-2 rounded-md shadow-lg border-l-4 cursor-pointer text-white text-xs hover:brightness-110 z-10 transition-transform hover:scale-[1.02] ${getStageColor(ev.stage)}`}
                                    style={{ top: `${(hour - 6) * 6}rem`, height: '5.5rem' }} 
                                >
                                    <div className="font-bold truncate text-sm shadow-black drop-shadow-md">{ev.subject}</div>
                                    <div className="truncate text-gray-200 text-[10px]">{ev.equipment_name}</div>
                                    <div className="flex items-center gap-1 mt-1 text-gray-100 font-mono bg-black/20 w-fit px-1 rounded">
                                        <Clock size={10} /> {format(parseISO(ev.scheduled_date), 'HH:mm')}
                                    </div>
                                </div>
                            ));
                        })}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;