"use client";

import { useState, useEffect, useCallback } from 'react';
import { formatDateToMMDD } from "@/lib/cdUtils";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import Link from 'next/link';

const HotelItem = ({ hotel, onEdit, onDelete }) => {
  if (!hotel || !hotel.cdInfo) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 shadow-lg">
        <strong className="font-bold">错误:</strong>
        <span className="block sm:inline"> 无效的酒店数据 {hotel?.hotelName || '未知酒店'}。 CD信息: {JSON.stringify(hotel?.cdInfo)}</span>
      </div>
    );
  }

  const { hotelName, cdInfo } = hotel;
  const { cdEndDate, daysRemaining, isActive, cdPeriod, formattedCheckInDate } = cdInfo;

  return (
    <div className={`p-6 rounded-lg shadow-xl mb-6 border-l-8 ${isActive ? 'border-green-500 bg-white text-gray-800' : 'border-gray-400 bg-gray-100 text-gray-700'}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="md:col-span-2">
          <h3 className={`text-2xl font-semibold mb-2 ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>{hotelName}</h3>
          <p className={`text-sm ${isActive ? 'text-gray-600' : 'text-gray-500'} mb-1`}>入住日期: {formattedCheckInDate}</p>
          <p className={`text-sm ${isActive ? 'text-gray-600' : 'text-gray-500'} mb-1`}>CD 周期: <span className="font-medium">{cdPeriod} 天</span></p>
          <p className={`text-sm ${isActive ? 'text-gray-600' : 'text-gray-500'}`}>CD 结束日期: <span className="font-medium">{cdEndDate}</span></p>
        </div>
        <div className="text-left md:text-right">
          {isActive ? (
            <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full mb-2 inline-block">
              CD 生效中
            </span>
          ) : (
            <span className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-full mb-2 inline-block">
              CD 已结束
            </span>
          )}
          {isActive && (
            <div className="mt-1 md:mt-0">
              <p className="text-lg font-bold text-green-600">{daysRemaining}</p>
              <p className="text-xs text-gray-500">剩余天数</p>
            </div>
          )}
          {!isActive && daysRemaining <= 0 && (
             <div className="mt-1 md:mt-0">
              <p className="text-lg font-bold text-gray-500">-</p>
              <p className="text-xs text-gray-500">剩余天数</p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <button 
          onClick={() => onEdit(hotel)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
        >
          编辑
        </button>
        <button 
          onClick={() => onDelete(hotel.id)}
          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-150"
        >
          删除
        </button>
      </div>
    </div>
  );
};

const AddEditHotelModal = ({ hotel, onClose, onSave }) => {
  const [hotelName, setHotelName] = useState(hotel?.hotelName || '');
  const [checkInDate, setCheckInDate] = useState(hotel?.checkInDate || new Date().toISOString().split('T')[0]);
  const [customCD, setCustomCD] = useState(hotel?.customCD === null || hotel?.customCD === undefined ? '' : String(hotel.customCD));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    const trimmedHotelName = hotelName.trim();
    if (!trimmedHotelName) {
        setFormError("酒店名称不能为空。");
        setIsSubmitting(false);
        return;
    }

    const cdValue = customCD.trim() === '' ? null : parseInt(customCD, 10);
    if (customCD.trim() !== '' && (isNaN(cdValue) || cdValue < 0)) {
      setFormError("自定义CD必须是正数或为空。");
      setIsSubmitting(false);
      return;
    }
    try {
      await onSave({ hotelName: trimmedHotelName, checkInDate, customCD: cdValue });
    } catch (error) {
      setFormError(error.message || "保存失败，请重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 p-8 rounded-lg shadow-xl w-full max-w-md mx-auto text-slate-100">
        <h2 className="text-2xl font-semibold mb-6 text-center">{hotel ? '编辑酒店信息' : '添加新酒店'}</h2>
        {formError && <p className="text-red-400 text-sm mb-4 text-center">{formError}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="hotelName" className="block text-sm font-medium text-slate-300 mb-1">酒店名称</label>
            <input 
              type="text" 
              id="hotelName" 
              value={hotelName} 
              onChange={(e) => setHotelName(e.target.value)} 
              required 
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-100 placeholder-slate-400"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="checkInDate" className="block text-sm font-medium text-slate-300 mb-1">入住日期</label>
            <input 
              type="date" 
              id="checkInDate" 
              value={checkInDate} 
              onChange={(e) => setCheckInDate(e.target.value)} 
              required 
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-100 placeholder-slate-400"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="customCD" className="block text-sm font-medium text-slate-300 mb-1">自定义CD (天, 可选)</label>
            <input 
              type="number" 
              id="customCD" 
              value={customCD} 
              onChange={(e) => setCustomCD(e.target.value)} 
              placeholder="默认: 30 天" 
              min="0"
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-100 placeholder-slate-400"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 rounded-md hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors duration-150"
            >
              取消
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 transition-colors duration-150"
            >
              {isSubmitting ? '保存中...' : (hotel ? '保存更改' : '添加酒店')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function HomePage() {
  const [hotels, setHotels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [searchTerm, setSearchTerm] = useState('');
  const { isSignedIn, user } = useUser();

  const fetchHotels = useCallback(async () => {
    if (!isSignedIn) return; // Do not fetch if not signed in
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/hotels');
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "获取酒店列表失败，请稍后重试" }));
        throw new Error(errData.error || `请求失败，状态码: ${response.status}`);
      }
      const data = await response.json();
      setHotels(data);
    } catch (e) {
      console.error("获取酒店列表失败:", e);
      let errorMessage = "未知错误，请稍后重试";
      if (e.message) {
        errorMessage = e.message;
      } else if (e.response) {
        errorMessage = `请求失败，状态码: ${e.response.status}`;
        if (e.response.data?.error) {
          errorMessage = e.response.data.error;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels, isSignedIn]);

  const handleAddHotel = () => {
    setEditingHotel(null);
    setShowAddEditModal(true);
  };

  const handleEditHotel = (hotel) => {
    setEditingHotel(hotel);
    setShowAddEditModal(true);
  };

  const handleDeleteHotel = async (hotelId) => {
    if (!confirm("您确定要删除这条酒店记录吗?")) return;
    try {
      const response = await fetch(`/api/hotels/${hotelId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "未知错误" }));
        throw new Error(errData.error || `HTTP 错误! 状态: ${response.status}`);
      }
      fetchHotels(); 
    } catch (e) {
      console.error("删除酒店失败:", e);
      alert(`删除酒店错误: ${e.message}`);
    }
  };

  const handleModalClose = () => {
    setShowAddEditModal(false);
    setEditingHotel(null);
  };

  const handleModalSave = async (hotelData) => {
    const isEditing = !!editingHotel;
    const url = isEditing ? `/api/hotels/${editingHotel.id}` : '/api/hotels';
    const method = isEditing ? 'PUT' : 'POST';

    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(hotelData),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error: "未知错误" }));
          // Handle 409 Conflict specifically for duplicate hotel name
          if (response.status === 409) {
            throw new Error(errData.error || "酒店名称已存在，请使用其他名称。");
          }
          throw new Error(errData.error || `HTTP 错误! 状态: ${response.status}`);
        }
        setShowAddEditModal(false);
        setEditingHotel(null);
        fetchHotels();
        resolve(); 
      } catch (e) {
        console.error("保存酒店失败:", e);
        reject(e); 
      }
    });
  };

  const currentHotelsSource = hotels.filter(hotel => hotel.cdInfo && hotel.cdInfo.isActive);
  const historyHotelsSource = hotels.filter(hotel => hotel.cdInfo && !hotel.cdInfo.isActive);

  let baseDisplayedHotels = activeTab === 'current' ? currentHotelsSource : historyHotelsSource;

  // 按入住日期排序（降序）
  baseDisplayedHotels = baseDisplayedHotels.sort((a, b) => {
    const dateA = new Date(a.checkInDate);
    const dateB = new Date(b.checkInDate);
    return dateB - dateA; // 降序排序，最新日期在前
  });

  const displayedHotels = searchTerm.trim() === ''
    ? baseDisplayedHotels
    : baseDisplayedHotels.filter(hotel =>
        hotel.hotelName && hotel.hotelName.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const noHotelsMessage = activeTab === 'current' 
    ? { title: "暂无生效中的CD记录", subtitle: "所有记录的CD均已结束，或您尚未添加任何记录。" }
    : { title: "暂无历史记录", subtitle: "没有已结束CD的酒店记录。" };
  
  const hasInitialDataOnTab = (activeTab === 'current' ? currentHotelsSource.length > 0 : historyHotelsSource.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-white p-4 sm:p-8 font-sans">
      <header className="mb-12">
        <div className="max-w-4xl mx-auto flex justify-between items-center py-4">
          <div className="text-left">
            <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              酒店 CD 追踪器
            </h1>
            <p className="text-sm sm:text-base text-slate-300">管理您的酒店入住冷却时间。</p>
          </div>
          <SignedIn>
            <UserButton afterSignOutUrl="/sign-in" />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition duration-150">
              登录 / 注册
            </Link>
          </SignedOut>
        </div>
      </header>

      <SignedIn>
        <main className="max-w-4xl mx-auto">
          <div className="mb-8">
              <div className="flex border-b border-slate-600">
                  <button 
                      onClick={() => setActiveTab('current')}
                      className={`py-3 px-6 font-medium text-center transition-colors duration-150 ${activeTab === 'current' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                      当前记录
                  </button>
                  <button 
                      onClick={() => setActiveTab('history')}
                      className={`py-3 px-6 font-medium text-center transition-colors duration-150 ${activeTab === 'history' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                      历史记录
                  </button>
              </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <div className="w-full sm:w-auto flex-grow">
              <input
                type="text"
                placeholder="搜索酒店名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 text-sm text-slate-100 bg-slate-700 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400"
              />
            </div>

            {activeTab === 'current' && (
              <button 
                onClick={handleAddHotel}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition duration-150 whitespace-nowrap"
              >
                添加新酒店
              </button>
            )}
          </div>

          {isLoading && <p className="text-center text-slate-400">加载中...</p>}
          {error && <p className="text-center text-red-400">错误: {error}</p>}
          {!isLoading && !error && displayedHotels.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-slate-300">{noHotelsMessage.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{noHotelsMessage.subtitle}</p>
              {activeTab === 'current' && !hasInitialDataOnTab && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleAddHotel}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    添加第一条记录
                  </button>
                </div>
              )}
            </div>
          )}
          {!isLoading && !error && displayedHotels.length > 0 && (
            <div className="grid grid-cols-1 gap-6">
              {displayedHotels.map((hotel) => (
                <HotelItem 
                  key={hotel.id} 
                  hotel={hotel} 
                  onEdit={handleEditHotel} 
                  onDelete={handleDeleteHotel} 
                />
              ))}
            </div>
          )}
        </main>
      </SignedIn>
      <SignedOut>
        <div className="max-w-4xl mx-auto text-center py-16">
            <h2 className="text-2xl font-semibold text-slate-200 mb-4">请登录以访问酒店CD追踪器</h2>
            <p className="text-slate-400 mb-8">登录或注册以开始管理您的酒店入住冷却时间。</p>
            <Link href="/sign-in">
                <span className="px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition duration-150">
                    前往登录页面
                </span>
            </Link>
        </div>
      </SignedOut>

      {showAddEditModal && (
        <AddEditHotelModal 
          hotel={editingHotel} 
          onClose={handleModalClose} 
          onSave={handleModalSave} 
        />
      )}
    </div>
  );
}

